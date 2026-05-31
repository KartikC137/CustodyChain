"use client";

import Button from "../../ui/Button";
import { useWallet } from "@/src/context-and-hooks/WalletContext";

export default function ConnectWalletButton() {
  const { chain, isLoading, account, connectWallet } = useWallet();
  if (!account) {
    return (
      <Button
        onClick={() => connectWallet(undefined, undefined)}
        variant="primary"
        isLoading={isLoading}
        loadingText="Connecting..."
      >
        Connect MetaMask Wallet
      </Button>
    );
  }
  if (isLoading) {
    return <p>"Connecting to Account ${account}..."</p>;
  }
  return (
    <div className="ml-1 mt-1 font-[600] text-md text-orange-700">
      <p>
        {chain?.name}:{chain?.id}
      </p>
      <p>{account}</p>
    </div>
  );
}
