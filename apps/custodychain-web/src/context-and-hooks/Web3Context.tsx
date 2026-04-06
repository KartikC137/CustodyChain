"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useMemo,
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
import { getSocket } from "../configs/socketConfig";
import { LedgerIdSchema } from "../lib/types/ledger.types";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

interface Web3State {
  isLoading: boolean;
  account: Address | null;
  walletClient: WalletClient | null;
  isWrongChain: boolean;
}

interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<void>;
  ledgerId: string;
  ledgerAddress: Address;
  chain: Chain;
  chainId: number;
  publicClient: PublicClient;
}

const Web3Context = createContext<Web3ContextType | null>(null);

const supportedChains: Record<number, Chain> = {
  [anvil.id]: anvil,
  [sepolia.id]: sepolia,
};

const INITIAL_STATE: Web3State = {
  isLoading: true,
  account: null,
  walletClient: null,
  isWrongChain: false,
};

/**
 * @todo replace the alerts with ui errors
 * @notice the _ledgerId is from url which has %3A instead of :
 */
export function Web3Provider({
  children,
  _ledgerId,
}: {
  children: ReactNode;
  _ledgerId: string;
}) {
  const [web3State, setWeb3State] = useState<Web3State>(INITIAL_STATE);
  console.log("the current web3 state", web3State);
  const getProvider = useCallback((): EIP1193Provider | undefined => {
    return typeof window !== "undefined" ? window.ethereum : undefined;
  }, []);

  const socket = getSocket();

  const ledgerInfo = useMemo(() => {
    const parsed = LedgerIdSchema.safeParse(_ledgerId);
    if (!parsed.success) return null;

    const chain = supportedChains[parsed.data.chainId];
    return chain ? { ...parsed.data, chain } : null;
  }, [_ledgerId]);

  if (!ledgerInfo) {
    return <div className="p-4 text-red-500">Invalid Ledger ID in URL.</div>;
  }

  const publicClient = useMemo(() => {
    if (!ledgerInfo) return null;
    return createPublicClient({
      chain: ledgerInfo.chain,
      transport: http(),
    });
  }, [ledgerInfo]);

  if (!publicClient) {
    return (
      <div className="p-4 text-red-500">
        Error connecting to wallet with valid chain, try again.
      </div>
    );
  }

  const initializeProvider = useCallback(
    async (connectedAccount: Address) => {
      try {
        const provider = getProvider();
        if (!provider) {
          return (
            <div>
              Metamask was disconnected. Please check the wallet connection.
            </div>
          );
        }

        const walletClient = createWalletClient({
          account: connectedAccount,
          chain: ledgerInfo.chain,
          transport: custom(provider),
        });

        socket.emit("connect_account", connectedAccount);
        console.log("account connected", connectedAccount);

        setWeb3State({
          isLoading: false,
          account: connectedAccount,
          walletClient: walletClient,
          isWrongChain: false,
        });
        console.log(
          `Provider initialized for ledger id: ${ledgerInfo.raw} account connected: ${connectedAccount}`,
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
      throw new Error("Metamask was disconnected.");
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

          const hexChainId = await provider?.request({
            method: "eth_chainId",
          });

          const decimalChainId = parseInt(hexChainId, 16);
          if (ledgerInfo.chainId !== decimalChainId) {
            setWeb3State((prev) => ({ ...prev, isWrongChain: true }));
          } else {
            if (accounts.length > 0) {
              await initializeProvider(accounts[0]);
            } else {
              setWeb3State((prev) => ({ ...prev, isLoading: false }));
            }
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
  }, [initializeProvider, getProvider, web3State.isWrongChain]);

  const handleChainChanged = (hexChainId: string) => {
    const decimalChainId = parseInt(hexChainId, 16);
    if (ledgerInfo.chainId !== decimalChainId) {
      setWeb3State((prev) => ({ ...prev, isWrongChain: true }));
    } else {
      setWeb3State((prev) => ({ ...prev, isWrongChain: false }));
    }
  };

  // handles account change
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      socket.emit("disconnect_account", web3State.account);
      console.log("disconnect account emitted", web3State.account);
      if (accounts.length > 0) {
        initializeProvider(accounts[0] as Address);
      } else {
        setWeb3State({ ...INITIAL_STATE, isLoading: false });
      }
    };
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
    ledgerId: ledgerInfo.raw.replaceAll("%3A", ":"),
    ledgerAddress: ledgerInfo.address as Address,
    chain: ledgerInfo.chain,
    chainId: ledgerInfo.chainId,
    publicClient: publicClient,
    connectWallet,
  };

  if (web3State.isWrongChain) {
    return (
      <div className="flex items-center justify-center bg-black/90">
        <div className="p-8 text-center bg-red-950 border border-red-500 rounded-xl">
          <h2 className="text-3xl font-mono text-red-500 mb-4">
            Wrong Network Detected
          </h2>
          <p className="text-white font-mono">
            Please open your wallet and switch to Chain ID: {ledgerInfo.chainId}
          </p>
        </div>
      </div>
    );
  }
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
