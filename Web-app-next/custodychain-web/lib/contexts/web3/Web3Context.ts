"use client";

import { createContext, useContext } from "react";
import {
  type Address,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";

export interface Web3ContextType {
  isLoading: boolean;
  account: Address | null;
  chain: Chain | undefined;
  walletClient: WalletClient | null;
  publicClient: PublicClient | null;
  connectWallet: () => Promise<void>;
}

export const Web3Context = createContext<Web3ContextType | null>(null);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
