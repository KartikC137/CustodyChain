"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { fetchEvidencesByAccount } from "../api/evidences/fetchEvidence";
import { useWeb3 } from "./Web3Context";
import { Bytes32, Address } from "../lib/types/solidity.types";
import { ActivityTypeType } from "../lib/types/activity.types";
import { SocketEvidenceDetails } from "../lib/types/socketEvent.types";

type EvidenceContextType = {
  evidences: SocketEvidenceDetails[];
  isLoadingEvidences: boolean;
  refreshEvidences: () => void;
  insertEvidence: (evidence: SocketEvidenceDetails) => void;
  updateEvidence: (
    evidence: SocketEvidenceDetails,
    type: ActivityTypeType,
  ) => void;
  removeEvidence: (evidenceId: Bytes32) => void;
};

const EvidenceContext = createContext<EvidenceContextType | null>(null);

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const { account } = useWeb3();
  const [evidences, setEvidences] = useState<SocketEvidenceDetails[]>([]);
  const [isLoadingEvidences, setIsLoadingEvidences] = useState(false);

  const loadData = async () => {
    if (!account) return;
    setIsLoadingEvidences(true);
    try {
      const data = await fetchEvidencesByAccount(account);
      setEvidences(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingEvidences(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [account]);

  const insertEvidence = async (evidence: SocketEvidenceDetails) => {
    setEvidences((prev) => [evidence, ...prev]);
  };

  const updateEvidence = async (
    evidence: SocketEvidenceDetails,
    type: ActivityTypeType,
  ) => {
    if (type === "transfer") {
      setEvidences((prev) => {
        const index = prev.findIndex((e) => e.id === evidence.id);
        if (index === -1) return prev;
        const newArray = [...prev];
        newArray[index] = {
          ...newArray[index],
          currentOwner: evidence.currentOwner,
          transferredAt: evidence.transferredAt,
        };
        return newArray;
      });
    } else if (type === "discontinue" && evidence.status === "discontinued") {
      setEvidences((prev) => {
        const index = prev.findIndex((e) => e.id === evidence.id);
        if (index === -1) return prev;
        const newArray = [...prev];
        newArray[index] = {
          ...newArray[index],
          status: "discontinued",
          discontinuedAt: evidence.discontinuedAt,
        };
        return newArray;
      });
    } else {
      return;
    }
  };

  // only removes evidence if account is not the creator as well
  const removeEvidence = async (evidenceId: Bytes32) => {
    setEvidences((prev) => {
      const index = prev.findIndex((e) => e.id === evidenceId);
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  return (
    <EvidenceContext.Provider
      value={{
        evidences,
        isLoadingEvidences,
        refreshEvidences: loadData,
        insertEvidence,
        updateEvidence,
        removeEvidence,
      }}
    >
      {children}
    </EvidenceContext.Provider>
  );
}

export const useEvidences = () => {
  const context = useContext(EvidenceContext);
  if (!context)
    throw new Error("useGlobalEvidences must be used within EvidenceProvider");
  return context;
};
