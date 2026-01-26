"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
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
import { getSocket } from "../config/socket";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

interface Web3State {
  isLoading: boolean;
  account: Address | null;
  chain: Chain | undefined;
  walletClient: WalletClient | null;
  publicClient: PublicClient | null;
}

interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

const supportedChains: Record<number, Chain> = {
  [anvil.id]: anvil,
  [sepolia.id]: sepolia,
};

const INITIAL_STATE: Web3State = {
  isLoading: true,
  account: null,
  chain: undefined,
  walletClient: null,
  publicClient: null,
};

export function Web3Provider({ children }: { children: ReactNode }) {
  const [web3State, setWeb3State] = useState<Web3State>(INITIAL_STATE);

  const getProvider = useCallback((): EIP1193Provider | undefined => {
    return typeof window !== "undefined" ? window.ethereum : undefined;
  }, []);

  const socket = getSocket();

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
          alert(`Unsupported network: ${chainId}. Please switch.`);
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

        socket.emit("connect_account", connectedAccount);
        console.log("connect account emitted", connectedAccount);

        setWeb3State({
          isLoading: false,
          account: connectedAccount,
          chain: currentChain,
          walletClient: finalWalletClient,
          publicClient: finalPublicClient,
        });
        console.log(
          `Provider initialized on ${currentChain.name} for ${connectedAccount}`,
        );
      } catch (error) {
        console.error("Failed to initialize provider:", error);
        socket.emit("disconnect_account", connectedAccount);
        setWeb3State((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [getProvider],
  );

  const connectWallet = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      alert("Wallet disconnected!");
      return;
    }
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as Address[];
      if (accounts.length > 0) {
        await initializeProvider(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet Error:", err);
    }
  }, [initializeProvider, getProvider]);

  // checks initial connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        const provider = getProvider();
        if (provider) {
          const accounts = (await provider.request({
            method: "eth_accounts",
          })) as Address[];

          if (accounts.length > 0) {
            await initializeProvider(accounts[0]);
          } else {
            setWeb3State((prev) => ({ ...prev, isLoading: false }));
          }
        } else {
          setWeb3State((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error checking connection:", error);
        setWeb3State((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkExistingConnection();
  }, [initializeProvider, getProvider]);

  // handles account change
  useEffect(() => {
    // this is not async cuz functionally it does not matter to await initializeProvider
    // cuz it has its error handling unless anything runs after it
    const handleAccountsChanged = (accounts: string[]) => {
      socket.emit("disconnect_account", web3State.account);
      console.log("disconnect account emitted", web3State.account);
      if (accounts.length > 0) {
        initializeProvider(accounts[0] as Address);
      } else {
        setWeb3State({ ...INITIAL_STATE, isLoading: false });
      }
    };

    const handleChainChanged = () => window.location.reload();

    const provider = getProvider();
    if (provider?.on) {
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (provider?.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [initializeProvider, getProvider, web3State.account]);

  const contextValues: Web3ContextType = {
    ...web3State,
    connectWallet,
  };

  return (
    <Web3Context.Provider value={contextValues}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
