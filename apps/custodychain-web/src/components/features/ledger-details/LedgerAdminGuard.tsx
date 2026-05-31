"use client";

import { useLedger } from "@/src/context-and-hooks/LedgerContext";
import { useWallet } from "@/src/context-and-hooks/WalletContext";
import React from "react";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWalletLoading, account, walletClient, chain } = useWallet();
  const { creator, isLedgerLoading } = useLedger();

  if (isWalletLoading || isLedgerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg text-gray-600">
          Loading wallet and ledger data...
        </p>
      </div>
    );
  }

  if (!walletClient || !chain || !account) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg text-red-600 font-medium">
          Couldn't Connect to the Wallet.
        </p>
      </div>
    );
  }

  if (account !== creator) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-5xl text-red-500 font-bold">Admin Restricted.</p>
      </div>
    );
  }

  return <>{children}</>;
}
