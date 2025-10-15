"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Web3Context,
  type Web3ContextType,
} from "../../lib/contexts/web3/Web3Context";
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  type Address,
  type PublicClient,
  type WalletClient,
  type EIP1193Provider,
  type Chain,
} from "viem";
import { anvil, sepolia } from "viem/chains";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

// finds supported chain by viem, currently only test chains enabled
const supportedChains: Record<number, Chain> = {
  [anvil.id]: anvil,
  [sepolia.id]: sepolia,
};
interface Web3ProviderProps {
  children: ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [account, setAccount] = useState<Address | null>(null);
  const [chain, setChain] = useState<Chain | undefined>(undefined);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);

  const initializeProvider = useCallback(async (connectedAccount: Address) => {
    try {
      const tempWalletClient = createWalletClient({
        transport: custom(window.ethereum!),
      });
      const chainId = await tempWalletClient.getChainId();
      const currentChain = supportedChains[chainId];

      if (!currentChain) {
        alert(
          "Unsupported network: " +
            chainId +
            " . Please switch to a supported network."
        );
        return;
      }

      const finalWalletClient = createWalletClient({
        account: connectedAccount,
        chain: currentChain,
        transport: custom(window.ethereum!),
      });
      const finalPublicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      setAccount(connectedAccount);
      setChain(currentChain);
      setWalletClient(finalWalletClient);
      setPublicClient(finalPublicClient);

      console.log(
        `Provider initialized on ${currentChain.name} for ${connectedAccount}`
      );
    } catch (error) {
      console.error("Failed to initialize provider:", error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as Address[];
      if (accounts.length > 0) {
        await initializeProvider(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }, [initializeProvider]);

  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        if (window.ethereum) {
          const accounts = (await window.ethereum.request({
            method: "eth_accounts",
          })) as Address[];
          if (accounts.length > 0) {
            await initializeProvider(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error during initial connection check:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkExistingConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        initializeProvider(accounts[0] as Address);
      } else {
        setAccount(null);
        setChain(undefined);
        setWalletClient(null);
      }
    };
    const handleChainChanged = () => window.location.reload();

    window.ethereum?.on("accountsChanged", handleAccountsChanged);
    window.ethereum?.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [initializeProvider]);

  const contextValue: Web3ContextType = {
    isLoading,
    account,
    chain,
    publicClient,
    walletClient,
    connectWallet,
  };

  return (
    <Web3Context.Provider value={contextValue}>{children}</Web3Context.Provider>
  );
}
