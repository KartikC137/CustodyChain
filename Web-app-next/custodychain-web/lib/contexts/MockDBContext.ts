"use client";

import { createContext, type Dispatch, useContext } from "react";
import type { Address } from "viem";

export type callType = "read" | "create" | "discontinue" | "transfer";
export type accountType = "owner" | "creator";

export interface Evidence {
  isActive: boolean;
  evidenceId: `0x${string}`;
  description: string;
  creator: Address;
  currentOwner: Address;
}

export interface AccountProfile {
  address: Address;
  type: accountType;
  evidencesCreated: Evidence[];
  evidencesOwned: Evidence[];
}

export interface MockDbAction {
  call: callType;
  account: Address;
  accountType: accountType;
  evidence: Evidence;
  accountTo?: Address;
}

export interface MockDbContextType {
  allAccounts: AccountProfile[];
  dispatch: Dispatch<MockDbAction>;
}

export const MockDbContext = createContext<MockDbContextType | undefined>(
  undefined,
);

export function useMockDb() {
  const context = useContext(MockDbContext);
  if (context === undefined) {
    throw new Error("useMockDb must be used within a MockDbProvider");
  }
  return context;
}
