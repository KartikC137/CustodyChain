"use client";

import { useReducer, type ReactNode, useEffect } from "react";
import { type Address } from "viem";
import {
  MockDbContext,
  type AccountProfile,
  type Evidence,
  type MockDbAction,
  type accountType,
} from "@/lib/contexts/MockDBContext"; // Adjust path as needed

// --- 1. Helper Function ---
/**
 * Finds an account profile in the state. If not found, creates a new one
 * and returns a new state array.
 * This is a PURE function.
 */
function findOrCreateAccountProfile(
  state: AccountProfile[],
  accountAddress: Address,
  type: accountType
): { updatedState: AccountProfile[]; profile: AccountProfile } {
  const targetAddress = accountAddress.toLowerCase();
  let profile = state.find((p) => p.address.toLowerCase() === targetAddress);

  if (!profile) {
    console.log(`Creating new Account Profile for ${accountAddress}...`);
    profile = {
      address: accountAddress,
      type: type,
      evidencesCreated: [],
      evidencesOwned: [],
    };
    // Return a *new* state array with the new profile
    return { updatedState: [...state, profile], profile };
  }
  // Return the existing state and the found profile
  return { updatedState: state, profile };
}

// --- 2. The Reducer Function ---
/**
 * The main reducer function. It takes the current state and an action,
 * and returns the *new* state immutably.
 */
function mockDbReducer(
  state: AccountProfile[],
  action: MockDbAction
): AccountProfile[] {
  const { account, accountTo, accountType, evidence, call } = action;

  const { updatedState: stateAfterFind, profile: accountProfile } =
    findOrCreateAccountProfile(state, account, accountType);

  let nextState = stateAfterFind;

  switch (call) {
    case "create": {
      if (accountType !== "creator") return state;
      const newEvidence = {
        ...evidence,
        creator: account,
        currentOwner: account,
      };

      return nextState.map((p) =>
        p.address.toLowerCase() === accountProfile.address.toLowerCase()
          ? {
              ...p,
              evidencesCreated: [...p.evidencesCreated, newEvidence],
              evidencesOwned: [...p.evidencesOwned, newEvidence],
            }
          : p
      );
    }

    case "discontinue": {
      // This action needs to find the evidence in *all* lists and update it
      const evidenceId = evidence.evidenceId.toLowerCase();

      return nextState.map((profile) => ({
        ...profile,
        evidencesCreated: profile.evidencesCreated.map((e) =>
          e.evidenceId.toLowerCase() === evidenceId
            ? { ...e, isActive: false }
            : e
        ),
        evidencesOwned: profile.evidencesOwned.map((e) =>
          e.evidenceId.toLowerCase() === evidenceId
            ? { ...e, isActive: false }
            : e
        ),
      }));
    }

    case "transfer": {
      if (!accountTo || account === accountTo) return state;

      const { updatedState: stateAfterFindTo, profile: accountToProfile } =
        findOrCreateAccountProfile(nextState, accountTo, "owner");

      let nextStateAfterFindTo = stateAfterFindTo;
      let evidenceToTransfer: Evidence | undefined;

      // 1. Remove from sender
      nextState = nextStateAfterFindTo.map((p) => {
        if (p.address.toLowerCase() === accountProfile.address.toLowerCase()) {
          const index = p.evidencesOwned.findIndex(
            (item) =>
              item.evidenceId.toLowerCase() ===
              evidence.evidenceId.toLowerCase()
          );
          if (index === -1) return p;
          evidenceToTransfer = p.evidencesOwned[index];
          return {
            ...p,
            evidencesOwned: [
              ...p.evidencesOwned.slice(0, index),
              ...p.evidencesOwned.slice(index + 1),
            ],
          };
        }
        return p;
      });

      // 2. Add to receiver
      if (evidenceToTransfer) {
        const newOwnedEvidence = {
          ...evidenceToTransfer,
          currentOwner: accountToProfile.address,
        };

        nextState = nextState.map((p) => {
          if (
            p.address.toLowerCase() === accountToProfile.address.toLowerCase()
          ) {
            if (
              p.evidencesOwned.some(
                (e) =>
                  e.evidenceId.toLowerCase() ===
                  newOwnedEvidence.evidenceId.toLowerCase()
              )
            ) {
              return p;
            }
            return {
              ...p,
              evidencesOwned: [...p.evidencesOwned, newOwnedEvidence],
            };
          }
          return p;
        });

        // 3. Update 'currentOwner' in 'evidencesCreated' list (for consistency)
        nextState = nextState.map((profile) => ({
          ...profile,
          evidencesCreated: profile.evidencesCreated.map((e) =>
            e.evidenceId.toLowerCase() ===
            newOwnedEvidence.evidenceId.toLowerCase()
              ? { ...e, currentOwner: newOwnedEvidence.currentOwner }
              : e
          ),
        }));
      }
      return nextState;
    }

    case "read":
    default:
      return state; // 'read' is handled by components, not the reducer
  }
}

// --- 3. The Provider Component (with localStorage Persistence) ---
const LOCAL_STORAGE_KEY = "custodyChainMockDb";

export function MockDbProvider({ children }: { children: ReactNode }) {
  const [allAccounts, dispatch] = useReducer(mockDbReducer, [], (initial) => {
    // This lazy initializer runs only once on component mount
    if (typeof window === "undefined") {
      return initial; // Server-side render, return empty array
    }
    try {
      // Try to load the saved state from localStorage
      const savedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      // Parse and ensure it's an array
      const parsed = savedState ? JSON.parse(savedState) : initial;
      return Array.isArray(parsed) ? parsed : initial;
    } catch (error) {
      console.error("Failed to load mock DB from localStorage:", error);
      return initial;
    }
  });

  // This effect runs *after* every render where 'allAccounts' has changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Save the new state back to localStorage
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(allAccounts)
      );
    }
  }, [allAccounts]); // Dependency: only run when 'allAccounts' changes

  const value = { allAccounts, dispatch };

  return (
    <MockDbContext.Provider value={value}>{children}</MockDbContext.Provider>
  );
}
