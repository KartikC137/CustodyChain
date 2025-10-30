"use client";

import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import Button from "@/components/Button";

export default function ConnectWalletButton() {
  const { chain, isLoading, account, connectWallet } = useWeb3();

  if (account && chain) {
    return (
      <p className="font-mono font-bold">
        User: {account} @ {chain?.name}
      </p>
    );
  }

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
