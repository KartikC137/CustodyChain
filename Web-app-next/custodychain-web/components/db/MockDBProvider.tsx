"use client";

import { type ReactNode, useEffect, useReducer } from "react";
import type { Address } from "viem";
import {
  type AccountProfile,
  type accountType,
  type Evidence,
  type MockDbAction,
  MockDbContext,
} from "@/lib/contexts/MockDBContext";

function findOrCreateAccountProfile(
  state: AccountProfile[],
  accountAddress: Address,
  type: accountType,
): { updatedState: AccountProfile[]; profile: AccountProfile } {
  const targetAddress = accountAddress.toLowerCase();
  let profile = state.find((p) => p.address.toLowerCase() === targetAddress);

  if (!profile) {
    console.log(
      `MockDBContext: Creating new Account Profile for ${accountAddress}...`,
    );
    profile = {
      address: accountAddress,
      type: type,
      evidencesCreated: [],
      evidencesOwned: [],
    };
    return { updatedState: [...state, profile], profile };
  }
  return { updatedState: state, profile };
}

function mockDbReducer(
  state: AccountProfile[],
  action: MockDbAction,
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

      return nextState.map((profile) =>
        profile.address.toLowerCase() === accountProfile.address.toLowerCase()
          ? {
              ...profile,
              evidencesCreated: [...profile.evidencesCreated, newEvidence],
              evidencesOwned: [...profile.evidencesOwned, newEvidence],
            }
          : profile,
      );
    }

    case "discontinue": {
      const evidenceId = evidence.evidenceId.toLowerCase();

      return nextState.map((profile) => ({
        ...profile,
        evidencesCreated: profile.evidencesCreated.map((evidence) =>
          evidence.evidenceId.toLowerCase() === evidenceId
            ? { ...evidence, isActive: false }
            : evidence,
        ),
        evidencesOwned: profile.evidencesOwned.map((evidence) =>
          evidence.evidenceId.toLowerCase() === evidenceId
            ? { ...evidence, isActive: false }
            : evidence,
        ),
      }));
    }

    case "transfer": {
      if (!accountTo || account === accountTo) return state;

      const { updatedState: stateAfterFindTo, profile: accountToProfile } =
        findOrCreateAccountProfile(nextState, accountTo, "owner");

      const nextStateAfterFindTo = stateAfterFindTo;
      let evidenceToTransfer: Evidence | undefined;

      // Remove from accountProfile
      nextState = nextStateAfterFindTo.map((profile) => {
        if (
          profile.address.toLowerCase() === accountProfile.address.toLowerCase()
        ) {
          const index = profile.evidencesOwned.findIndex(
            (item) =>
              item.evidenceId.toLowerCase() ===
              evidence.evidenceId.toLowerCase(),
          );
          if (index === -1) return profile;
          evidenceToTransfer = profile.evidencesOwned[index];
          return {
            ...profile,
            evidencesOwned: [
              ...profile.evidencesOwned.slice(0, index),
              ...profile.evidencesOwned.slice(index + 1),
            ],
          };
        }
        return profile;
      });

      // Add to accountToProfile
      if (evidenceToTransfer) {
        const newOwnedEvidence = {
          ...evidenceToTransfer,
          currentOwner: accountToProfile.address,
        };

        nextState = nextState.map((profileTo) => {
          if (
            profileTo.address.toLowerCase() ===
            accountToProfile.address.toLowerCase()
          ) {
            if (
              profileTo.evidencesOwned.some(
                (evidence) =>
                  evidence.evidenceId.toLowerCase() ===
                  newOwnedEvidence.evidenceId.toLowerCase(),
              )
            ) {
              return profileTo;
            }
            return {
              ...profileTo,
              evidencesOwned: [...profileTo.evidencesOwned, newOwnedEvidence],
            };
          }
          return profileTo;
        });

        // Update 'currentOwner' in 'evidencesCreated' list
        nextState = nextState.map((profile) => ({
          ...profile,
          evidencesCreated: profile.evidencesCreated.map((evidence) =>
            evidence.evidenceId.toLowerCase() ===
            newOwnedEvidence.evidenceId.toLowerCase()
              ? { ...evidence, currentOwner: newOwnedEvidence.currentOwner }
              : evidence,
          ),
        }));
      }
      return nextState;
    }

    default:
      return state;
  }
}

const LOCAL_STORAGE_KEY = "custodyChainMockDb";

export function MockDbProvider({ children }: { children: ReactNode }) {
  const [allAccounts, dispatch] = useReducer(mockDbReducer, [], (initial) => {
    // Runs only once on component mount
    if (typeof window === "undefined") {
      return initial;
    }
    try {
      const savedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = savedState ? JSON.parse(savedState) : initial;
      return Array.isArray(parsed) ? parsed : initial;
    } catch (error) {
      console.error(
        "MockDBProvider: Failed to load mock DB from localStorage:",
        error,
      );
      return initial;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(allAccounts),
      );
    }
  }, [allAccounts]);

  const value = { allAccounts, dispatch };

  return (
    <MockDbContext.Provider value={value}>{children}</MockDbContext.Provider>
  );
}
