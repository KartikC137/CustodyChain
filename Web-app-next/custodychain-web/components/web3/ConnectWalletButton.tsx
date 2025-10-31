"use client";

import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import Button from "@/components/Button";

export default function ConnectWalletButton() {
  const { chain, isLoading, account, connectWallet } = useWeb3();
  if (!account || !chain) {
    return (
      <Button
        onClick={connectWallet}
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
    <div>
      <p>
        {chain.name}: {chain.id}
      </p>
      <p>{account}</p>
    </div>
  );
}
