"use client";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

export default function ConnectWalletButton() {
  const { chain, isLoading, account, connectWallet } = useWeb3();

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 font-bold text-white bg-gray-400 rounded cursor-not-allowed"
      >
        Connecting...
      </button>
    );
  }

  if (account && chain) {
    return (
      <p className="font-mono font-bold">
        User: {account} @ {chain?.name}
      </p>
    );
  }
  return (
    <button
      onClick={connectWallet}
      className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
    >
      Connect Wallet
    </button>
  );
}
