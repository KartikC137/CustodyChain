"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient,
  custom,
  type EIP1193Provider,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { anvil, sepolia } from "viem/chains";
import {
  Web3Context,
  type Web3ContextType,
} from "../../lib/contexts/web3/Web3Context";

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

  const getProvider = useCallback((): EIP1193Provider | undefined => {
    return typeof window !== "undefined" ? window.ethereum : undefined;
  }, []);

  const initializeProvider = useCallback(
    async (connectedAccount: Address) => {
      try {
        const provider = getProvider();
        if (!provider) {
          console.error("Install Metamask to continue...");
          return;
        }

        const tempWalletClient = createWalletClient({
          transport: custom(provider),
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
          transport: custom(provider),
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
    },
    [getProvider]
  );

  const connectWallet = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      alert("Wallet disconnected.");
      return;
    }
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as Address[];
      if (accounts.length > 0) {
        await initializeProvider(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }, [initializeProvider, getProvider]);

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
        setPublicClient(null);
      }
    };
    const handleChainChanged = () => window.location.reload();

    const provider = getProvider();
    if (provider?.on) {
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
    }

    return () => {
      const p = getProvider();
      if (p?.removeListener) {
        p.removeListener("accountsChanged", handleAccountsChanged);
        p.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [initializeProvider, getProvider]);

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
