"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  http,
  createPublicClient,
  createWalletClient,
  custom,
  type Address,
  type Chain,
  type EIP1193Provider,
  type PublicClient,
  type WalletClient,
} from "viem";
import { supportedChains } from "../lib/util/supportedChains";
import { getSocket } from "../configs/socketConfig";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

interface WalletState {
  isWalletLoading: boolean;
  account: Address | null;
  chain: Chain | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient | null;
  isUnsupportedChain: boolean;
}

//add disconnect wallet
interface WalletContextType extends WalletState {
  connectWallet: (_chainId?: string, _account?: Address) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const INITIAL_STATE: WalletState = {
  isWalletLoading: true,
  account: null,
  chain: null,
  publicClient: null,
  walletClient: null,
  isUnsupportedChain: false,
};

/**
 *
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);
  const getProvider = useCallback((): EIP1193Provider | undefined => {
    return typeof window !== "undefined" ? window.ethereum : undefined;
  }, []);

  const socket = getSocket();

  const connectWallet = useCallback(
    async (_chainId?: string, _account?: Address) => {
      const provider = getProvider();
      if (!provider) {
        throw new Error("provider was not found");
      }
      let validChain;
      if (!_chainId) {
        const hexChainId = await provider.request({ method: "eth_chainId" });
        validChain = supportedChains[parseInt(hexChainId)];
      } else {
        validChain = supportedChains[parseInt(_chainId)];
      }
      if (!validChain) {
        setWalletState((prev) => ({
          ...prev,
          isUnsupportedChain: true,
          isLoading: false,
        }));
        return;
      }

      let currentAccount;
      if (!_account) {
        currentAccount = (
          await provider.request({
            method: "eth_requestAccounts",
          })
        )[0];
      } else {
        currentAccount = _account;
      }

      if (!currentAccount) {
        setWalletState((prev) => ({
          ...prev,
          account: null,
          isLoading: false,
        }));
        return;
      }

      try {
        const _walletClient = createWalletClient({
          account: currentAccount,
          chain: validChain,
          transport: custom(provider),
        });

        const _publicClient = createPublicClient({
          chain: validChain,
          transport: http(),
        });

        socket.emit("connect_account", currentAccount);
        console.log("account connected: ", currentAccount);

        setWalletState({
          isWalletLoading: false,
          account: currentAccount,
          chain: validChain,
          publicClient: _publicClient,
          walletClient: _walletClient,
          isUnsupportedChain: false,
        });
      } catch (error) {
        console.error("Failed to Connect Wallet", error);
        socket.emit("disconnect_account", currentAccount);
        setWalletState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [getProvider],
  );

  // checks initial connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      await connectWallet();
    };
    checkExistingConnection();
  }, [connectWallet, getProvider]);

  const handleAccountsChanged = (accounts: string[]) => {
    socket.emit("disconnect_account", accounts[1]);
    console.log("account disconnected: ", accounts[1]);
    connectWallet(undefined, accounts[0] as Address);
  };

  // account and chain change listeners
  useEffect(() => {
    const provider = getProvider();

    if (provider?.on) {
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", connectWallet);
    }

    return () => {
      if (provider?.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", connectWallet);
      }
    };
  }, [connectWallet, getProvider]);

  if (walletState.isUnsupportedChain) {
    return (
      <div className="font-sans text-red-600 text-5xl text-center">
        Unsupported chain
      </div>
    );
  }

  const contextValues: WalletContextType = {
    ...walletState,
    connectWallet,
  };

  return (
    <WalletContext.Provider value={contextValues}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
