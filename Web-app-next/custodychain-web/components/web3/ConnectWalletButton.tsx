"use client";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context"; 

export default function ConnectWalletButton() {
  const { account, connectWallet } = useWeb3();

  // If connect return account address
  if (account) {
    return (
      <div className="p-2 bg-gray-200 rounded">
        <p className="font-mono text-sm">
            Connected: {`${account}`}
        </p>
      </div>
    )
  }
  return (
    // If not connected, show the connect button
    <button
      onClick={connectWallet}
      className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
    >
    Connect Wallet
    </button>
  );
}
