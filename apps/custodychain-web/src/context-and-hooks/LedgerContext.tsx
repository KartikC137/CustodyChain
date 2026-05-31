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
import { type Address } from "viem";
import {
  LedgerIdURLSchema,
  LedgerInfo,
  DbRoleFlags,
} from "../lib/types/ledger.types";
import WrongChainConnected from "../components/layout/error/WrongChainConnected";

import { fetchLedgerById } from "../api/ledgers/fetchLedgers";
import { fetchRolesForAccount } from "../api/ledgers/fetchRoles";
import { useWallet } from "./WalletContext";

interface LedgerContextType {
  isLedgerLoading: boolean;
  ledgerName: string;
  ledgerId: string;
  ledgerIdDb: number;
  ledgerAddress: Address;
  ledgerChainId: number;
  creator: Address;
  roles: DbRoleFlags;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export function LedgerProvider({
  children,
  ledgerIdUrl,
}: {
  children: ReactNode;
  ledgerIdUrl: string;
}) {
  const { account, chain, isUnsupportedChain, isWalletLoading } = useWallet();
  const [isLedgerLoading, setIsLedgerLoading] = useState<boolean>(false);
  const [ledgerFetchError, setLedgerFetchError] = useState<boolean>(false);
  const [ledgerData, setLedgerData] = useState<LedgerInfo>();
  const [accountRoles, setAccountRoles] = useState<DbRoleFlags | {}>({});

  const ledgerIdParsed = useMemo(() => {
    const parsed = LedgerIdURLSchema.safeParse(ledgerIdUrl);
    if (!parsed.success) return null;
    return { ...parsed.data };
  }, [ledgerIdUrl]);

  useEffect(() => {
    if (!ledgerIdParsed) return;

    const loadLedger = async () => {
      try {
        setIsLedgerLoading(true);
        setLedgerFetchError(false);
        const _ledgerData = await fetchLedgerById(ledgerIdParsed.raw);
        setLedgerData(_ledgerData);
      } catch (err) {
        console.error("LedgerProvider: db error couldn't fetch ledger", err);
        setLedgerFetchError(true);
      } finally {
        setIsLedgerLoading(false);
      }
    };

    loadLedger();
  }, [ledgerIdParsed]);

  useEffect(() => {
    if (!ledgerData?.dbId) {
      setAccountRoles({});
      return;
    }

    if (!account) {
      setAccountRoles({});
      return;
    }

    const loadRoles = async () => {
      try {
        const _roles = await fetchRolesForAccount(
          account as Address,
          ledgerData.dbId,
        );
        setAccountRoles(_roles);
      } catch (err) {
        console.error("LedgerProvider: db error couldn't fetch roles", err);
      }
    };

    loadRoles();
  }, [account, ledgerData?.dbId]);

  if (isWalletLoading) {
    return <div>Connecting Wallet...</div>;
  }

  if (!ledgerIdParsed) {
    return <div className="p-4 text-red-500">Invalid Ledger ID in URL.</div>;
  }

  // put the ledger app skeleton here
  if (isLedgerLoading) {
    return <div>Loading Ledger...</div>;
  }

  if (ledgerFetchError || !ledgerData) {
    return (
      <div className="p-4 text-red-500">
        Ledger not found or database error.
      </div>
    );
  }

  if (ledgerData.status === "inactive") {
    return <div className="p-4 text-red-500">This Ledger is Inactive.</div>;
  }

  if (isUnsupportedChain || (chain && ledgerIdParsed.chainId !== chain.id)) {
    return <WrongChainConnected correctChainId={ledgerIdParsed.chainId} />;
  }

  const contextValues: LedgerContextType = {
    isLedgerLoading,
    ledgerName: ledgerData?.name as string,
    ledgerId: ledgerIdParsed.raw,
    ledgerIdDb: ledgerData?.dbId as number,
    ledgerAddress: ledgerIdParsed.address.toLowerCase() as Address,
    ledgerChainId: ledgerIdParsed.chainId,
    roles: accountRoles as DbRoleFlags,
    creator: ledgerData?.creator.toLowerCase() as Address,
  };
  return (
    <LedgerContext.Provider value={contextValues}>
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
}
