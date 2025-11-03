"use client";

import { useReducer, type ReactNode, useEffect } from "react";
import { type Address } from "viem";
import {
  ActivityManagerContext,
  type AccountProfile,
  type Activity,
  type ActivityManagerAction,
} from "@/lib/contexts/ActivityManagerContext";

function findOrCreateAccountProfile(
  state: AccountProfile[],
  accountAddress: Address
): { updatedState: AccountProfile[]; profile: AccountProfile } {
  const targetAddress = accountAddress.toLowerCase();
  let profile = state.find((p) => p.address.toLowerCase() === targetAddress);

  if (!profile) {
    console.log(
      `ActivityManager: Creating new Account Profile for ${accountAddress}...`
    );
    profile = {
      address: accountAddress,
      activities: [],
    };
    return { updatedState: [...state, profile], profile };
  }
  return { updatedState: state, profile };
}

function activityManagerReducer(
  state: AccountProfile[],
  action: ActivityManagerAction
): AccountProfile[] {
  const { address, activityType, evidenceId, transferredTo, time } = action;

  const { updatedState: stateAfterFind, profile: accountProfile } =
    findOrCreateAccountProfile(state, address);

  let nextState = stateAfterFind;
  const newActivity: Activity = {
    evidenceId: evidenceId,
    activityType: activityType,
    transferredTo: transferredTo,
    time: time,
  };

  return nextState.map((profile) =>
    profile.address.toLowerCase() === accountProfile.address.toLowerCase()
      ? {
          ...profile,
          activities: [newActivity, ...profile.activities],
        }
      : profile
  );
}

const LOCAL_STORAGE_KEY = "activityLogs";

export function ActivityManagerProvider({ children }: { children: ReactNode }) {
  const [allAccounts, dispatch] = useReducer(
    activityManagerReducer,
    [],
    (initial) => {
      if (typeof window === "undefined") {
        return initial;
      }
      try {
        const savedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = savedState ? JSON.parse(savedState) : initial;
        return Array.isArray(parsed) ? parsed : initial;
      } catch (error) {
        console.error(
          "ActivityManagerProvider: Failed to load Activity from localStorage:",
          error
        );
        return initial;
      }
    }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(allAccounts)
      );
    }
  }, [allAccounts]);

  const value = { allAccounts, dispatch };

  return (
    <ActivityManagerContext.Provider value={value}>
      {children}
    </ActivityManagerContext.Provider>
  );
}
