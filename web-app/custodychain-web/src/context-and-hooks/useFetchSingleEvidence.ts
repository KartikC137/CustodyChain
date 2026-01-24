"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { type Address, zeroAddress } from "viem";
import { evidenceAbi } from "../lib/contracts/chain-of-custody-abi";
import { evidenceLedgerAbi } from "../lib/contracts/evidence-ledger-abi";
import { evidenceLedgerAddress } from "../lib/contracts/evidence-ledger-address";
import { useWeb3 } from "./Web3Context";
import { Bytes32 } from "@/src/lib/types/solidity.types";
import { EvidenceDetails, CustodyRecord } from "@/src/lib/types/evidence.types";
import { fetchSingleEvidence } from "../api/evidences/fetchEvidence";

/**
 * @notice 1. Primarily fetches data from DB but chain of custody requires , fallback is rpc calls to the contract.
 */
export default function useFetchSingleEvidence(evidenceId: Bytes32) {
  const { publicClient } = useWeb3();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDetails, setEvidenceDetails] =
    useState<EvidenceDetails | null>(null);
  const [dataSource, setDataSource] = useState<"DB" | "BLOCKCHAIN" | null>(
    null,
  );

  const fetchInFlightRef = useRef<string | null>(null);

  const fetchEvidenceData = useCallback(
    async (idToFetch: Bytes32) => {
      if (idToFetch && fetchInFlightRef.current === idToFetch) {
        console.log("Already fetching for: ", idToFetch);
        return;
      }

      if (idToFetch) fetchInFlightRef.current = idToFetch;

      setIsLoading(true);
      setError(null);
      setEvidenceDetails(null);

      try {
        console.log("Attempting DB fetch...");
        const dbData = await fetchSingleEvidence(idToFetch as `0x${string}`);

        if (dbData) {
          setEvidenceDetails(dbData);
          setDataSource("DB");
          setIsLoading(false);
          fetchInFlightRef.current = null;
          return;
        }
      } catch (dbErr) {
        console.warn("DB Fetch failed, falling back to blockchain...", dbErr);
      }

      if (!publicClient) {
        setError("Please connect your wallet first.");
        setIsLoading(false);
        return;
      }

      try {
        const contractAddress = (await publicClient.readContract({
          address: evidenceLedgerAddress,
          abi: evidenceLedgerAbi,
          functionName: "getEvidenceContractAddress",
          args: [idToFetch as `0x${string}`],
        })) as Address;

        if (!contractAddress || contractAddress === zeroAddress) {
          setError(`Evidence ID: ${idToFetch} not found on chain.`);
          setIsLoading(false);
          return;
        }

        const [
          id,
          creator,
          timeOfCreation,
          currentOwner,
          description,
          chainOfCustody,
          isActive,
          timeOfDiscontinuation,
        ] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceId",
          }) as Promise<`0x${string}`>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceCreator",
          }) as Promise<Address>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getTimeOfCreation",
          }) as Promise<bigint>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getCurrentOwner",
          }) as Promise<Address>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceDescription",
          }) as Promise<string>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getChainOfCustody",
          }) as Promise<CustodyRecord[]>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceState",
          }) as Promise<boolean>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getTimeOfDiscontinuation",
          }) as Promise<bigint>,
        ]);

        setEvidenceDetails({
          id,
          contractAddress,
          creator,
          timeOfCreation,
          currentOwner,
          description,
          chainOfCustody,
          isActive,
          timeOfDiscontinuation,
        });
        setDataSource("BLOCKCHAIN");
      } catch (err) {
        console.error("Failed to fetch evidence details:", err);
        setError("Fetch Evidence: Unknown Error occured.");
      } finally {
        setIsLoading(false);
        if (fetchInFlightRef.current === idToFetch)
          fetchInFlightRef.current = null;
      }
    },
    [publicClient],
  );

  useEffect(() => {
    if (evidenceId && publicClient) {
      fetchEvidenceData(evidenceId);
    } else if (!publicClient) {
      setIsLoading(true);
    }
  }, [evidenceId, fetchEvidenceData, publicClient]);

  return { dataSource, isLoading, error, evidenceDetails, fetchEvidenceData };
}
