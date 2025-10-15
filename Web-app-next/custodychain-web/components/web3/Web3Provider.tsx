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
} from "viem";
import { anvil, type Chain} from "viem/chains";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

const localAnvil = {
  ...anvil,
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
};

interface Web3ProviderProps {
  children: ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<Address | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);

  // universal provider, implemant later
  // const initializeProvider = useCallback((connectedAccount: Address, chain: Chain, walletTransport: idk type , clientTransport: idk type)=>{
  //   if (typeof window.ethereum === "undefined") {
  //     alert("Please install MetaMask!");
  //     return;
  //   }


  // },[]);

  const connectWallet = useCallback( async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!");
      return;
    }

    const newWalletClient = createWalletClient({
      chain: localAnvil,
      transport: custom(window.ethereum),
    });

    const newPublicClient = createPublicClient({
      chain: localAnvil,
      transport: http(),
    });

    try {
      const [address] = await newWalletClient.requestAddresses();
      setAccount(address);
      setWalletClient(newWalletClient);
      setPublicClient(newPublicClient);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  }, []);

  // Check existing connection on page reload
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as Address[];
          if (accounts.length > 0) {

            const newWalletClient = createWalletClient({ 
              chain: anvil, 
              transport: custom(window.ethereum) 
            });
            
            const newPublicClient = createPublicClient({ 
              chain: anvil, 
              transport: http() 
            });
            
            setAccount(accounts[0]);
            setWalletClient(newWalletClient);
            setPublicClient(newPublicClient);
          }
        } catch (error) {
          console.error("Error checking for existing connection:", error);
        }
      }
    };
    checkExistingConnection();
  }, []);

  const contextValue: Web3ContextType = {
    account,
    publicClient,
    walletClient,
    connectWallet,
  }

  return (
    <Web3Context.Provider value={contextValue}>{children}</Web3Context.Provider>
  );
}
