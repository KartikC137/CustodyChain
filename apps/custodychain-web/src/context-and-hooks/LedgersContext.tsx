"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { LedgersInfo } from "../lib/types/ledger.types";
import { fetchLedgersByCreator } from "../api/ledgers/fetchLedgers";
import { useWallet } from "./WalletContext";
import { getSocket } from "../configs/socketConfig";

interface LedgersContextType {
  isLoadingLedgers: boolean;
  addPendingLedger: (newLedger: LedgersInfo) => void;
  ledgers: LedgersInfo[];
}

const LedgersContext = createContext<LedgersContextType | null>(null);

export function LedgersProvider({ children }: { children: ReactNode }) {
  const [ledgers, setLedgers] = useState<LedgersInfo[]>([]);
  const [isLoadingLedgers, setIsLoadingLedgers] = useState<boolean>(false);
  const { account } = useWallet();

  const loadLedgers = async () => {
    console.log("load ledgers");
    if (!account) return;
    setIsLoadingLedgers(true);
    try {
      const data = await fetchLedgersByCreator(account);
      setLedgers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLedgers(false);
    }
  };

  useEffect(() => {
    loadLedgers();
  }, [account]);

  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = (ledgerUpdate: any) => {
      console.info("Ledger Update Parsed:", ledgerUpdate);

      setLedgers((prev) => {
        const targetIndex = prev.findIndex(
          (l) =>
            l.status === "pending" &&
            ledgerUpdate.txHash &&
            l.txHash &&
            l.txHash.toLowerCase() === ledgerUpdate.txHash,
        );
        if (targetIndex === -1) {
          return prev;
        }
        const updatedLedgers = [...prev];
        updatedLedgers[targetIndex] =
          ledgerUpdate.status === "active"
            ? {
                ...updatedLedgers[targetIndex],
                status: "active",
                id: ledgerUpdate.id,
                creator: ledgerUpdate.creator,
                createdAt: ledgerUpdate.createdAt,
                address: ledgerUpdate.address,
              }
            : {
                ...updatedLedgers[targetIndex],
                status: "inactive",
              };
        return updatedLedgers;
      });
    };

    socket.on("ledger_update", handleUpdate);

    return () => {
      socket.off("ledger_update", handleUpdate);
    };
  }, [account]);

  const addPendingLedger = (newLedger: LedgersInfo) => {
    if (newLedger.status !== "pending") return;
    setLedgers((prev) => [newLedger, ...prev]);
  };

  return (
    <LedgersContext.Provider
      value={{ isLoadingLedgers, addPendingLedger, ledgers }}
    >
      {children}
    </LedgersContext.Provider>
  );
}

export function useLedgers() {
  const context = useContext(LedgersContext);
  if (!context) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
}
