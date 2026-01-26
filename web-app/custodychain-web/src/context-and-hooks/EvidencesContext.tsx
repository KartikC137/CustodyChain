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
import { EvidenceRow } from "../lib/types/evidence.types";
import { Bytes32, Address } from "../lib/types/solidity.types";
import { ActivityTypeType } from "../lib/types/activity.types";

type EvidenceContextType = {
  allEvidences: EvidenceRow[];
  isLoading: boolean;
  refreshEvidences: () => void;
  updateEvidence: (
    id: Bytes32,
    type: ActivityTypeType,
    updatedAt: Date,
    to?: Address,
    createdAt?: Date,
  ) => void;
  insertEvidence: (newEvidence: EvidenceRow) => void;
};

const EvidenceContext = createContext<EvidenceContextType | null>(null);

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const { account } = useWeb3();
  const [allEvidences, setAllEvidences] = useState<EvidenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    if (!account) return;
    setIsLoading(true);
    try {
      const data = await fetchEvidencesByAccount(account);
      setAllEvidences(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [account]);

  const insertEvidence = (newEvidence: EvidenceRow) => {
    setAllEvidences((prev) => [...prev, newEvidence]);
  };

  const updateEvidence = (
    id: Bytes32,
    type: ActivityTypeType,
    updatedAt: Date,
    to?: Address,
  ) => {
    if (type === "transfer") {
      setAllEvidences((prev) =>
        prev.map((evidence) => {
          if (evidence.evidence_id === id) {
            return {
              ...evidence,
              current_owner: to as Address,
              updated_at: updatedAt,
            };
          }
          return evidence;
        }),
      );
    } else if (type === "discontinue") {
      setAllEvidences((prev) =>
        prev.map((evidence) => {
          if (evidence.evidence_id === id) {
            return {
              ...evidence,
              status: "discontinued",
              updated_at: updatedAt,
            };
          }
          return evidence;
        }),
      );
    } else {
      // dont do anything on fetch or create
      return;
    }
  };

  return (
    <EvidenceContext.Provider
      value={{
        allEvidences,
        isLoading,
        refreshEvidences: loadData,
        updateEvidence,
        insertEvidence,
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
