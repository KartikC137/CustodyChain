"use client";

import { createContext, type Dispatch, useContext } from "react";
import type { Address } from "viem";

export type activityType = "fetch" | "create" | "transfer" | "discontinue";

export interface AccountProfile {
  address: Address;
  activities: Activity[];
}

export interface Activity {
  evidenceId: `0x${string}`;
  activityType: activityType;
  transferredTo: Address | null;
  time: Date;
}

export interface ActivityManagerAction {
  address: Address;
  activityType: activityType;
  evidenceId: `0x${string}`;
  transferredTo: Address | null;
  time: Date;
}

export interface ActivityManagerContextType {
  allAccounts: AccountProfile[];
  dispatch: Dispatch<ActivityManagerAction>;
}

export const ActivityManagerContext = createContext<
  ActivityManagerContextType | undefined
>(undefined);

export function useActivityManager() {
  const context = useContext(ActivityManagerContext);
  if (context === undefined) {
    throw new Error(
      "useActivityManager must be used within a ActivityManagerProvider",
    );
  }
  return context;
}
