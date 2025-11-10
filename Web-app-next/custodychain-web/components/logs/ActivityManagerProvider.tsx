"use client";

import { type ReactNode, useEffect, useReducer } from "react";
import type { Address } from "viem";
import {
  type AccountProfile,
  type Activity,
  type ActivityManagerAction,
  ActivityManagerContext,
} from "@/lib/contexts/ActivityManagerContext";

function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return new Date(value);
}

function findOrCreateAccountProfile(
  state: AccountProfile[],
  accountAddress: Address,
): { updatedState: AccountProfile[]; profile: AccountProfile } {
  const targetAddress = accountAddress.toLowerCase();
  let profile = state.find((p) => p.address.toLowerCase() === targetAddress);

  if (!profile) {
    console.log(
      `ActivityManager: Creating new Account Profile for ${accountAddress}...`,
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
  action: ActivityManagerAction,
): AccountProfile[] {
  const { address, activityType, evidenceId, transferredTo, time } = action;

  const { updatedState: stateAfterFind, profile: accountProfile } =
    findOrCreateAccountProfile(state, address);

  const nextState = stateAfterFind;
  const normalizedTime = toDate(time);
  const newActivity: Activity = {
    evidenceId: evidenceId,
    activityType: activityType,
    transferredTo: transferredTo,
    time: normalizedTime,
  };

  return nextState.map((profile) =>
    profile.address.toLowerCase() === accountProfile.address.toLowerCase()
      ? {
          ...profile,
          activities: [newActivity, ...profile.activities],
        }
      : profile,
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
        if (!Array.isArray(parsed)) return initial;

        const normalized = parsed.map((profile: AccountProfile) => {
          const activities = Array.isArray(profile.activities)
            ? profile.activities.map((act: Activity) => {
                const t = act.time;
                return {
                  ...act,
                  time: toDate(t),
                };
              })
            : [];
          return {
            ...profile,
            activities,
          };
        });

        return normalized as AccountProfile[];
      } catch (error) {
        console.error(
          "ActivityManagerProvider: Failed to load Activity from localStorage:",
          error,
        );
        return initial;
      }
    },
  );

  useEffect(() => {
    try {
      const serializable = allAccounts.map((profile) => ({
        ...profile,
        activities: profile.activities.map((act: Activity) => ({
          ...act,
          time: act.time instanceof Date ? act.time.toISOString() : act.time,
        })),
      }));
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(serializable),
      );
    } catch (err) {
      console.error(
        "ActivityManagerProvider: Failed to save activity logs:",
        err,
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
