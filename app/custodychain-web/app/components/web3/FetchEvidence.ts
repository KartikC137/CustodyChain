"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { type Address, zeroAddress } from "viem";
import { evidenceAbi } from "../../../../lib/contractAbi/chain-of-custody-abi";
import { evidenceLedgerAbi } from "../../../../lib/contractAbi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "../../../../lib/evidence-ledger-address";
import { useWeb3 } from "../../contexts/web3/Web3Context";
import { Bytes32, Bytes32Schema } from "@/lib/types/solidity.types";
import { EvidenceDetails, CustodyRecord } from "@/lib/types/evidence.types";

export default function useFetchEvidence(evidenceId: Bytes32) {
  const { publicClient } = useWeb3();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDetails, setEvidenceDetails] =
    useState<EvidenceDetails | null>(null);

  const fetchInFlightRef = useRef<string | null>(null);

  const fetchEvidenceData = useCallback(
    async (idToFetch: string | undefined | null) => {
      if (!fetchInFlightRef.current) {
      }

      if (!publicClient) {
        setError("Please connect your wallet first.");
        setIsLoading(false);
        return;
      }
      if (Bytes32Schema.safeParse(idToFetch).success !== true) {
        setError("Invalid evidence ID.");
        setIsLoading(false);
        return;
      }

      if (idToFetch && fetchInFlightRef.current === idToFetch) {
        console.log("Already fetching for: ", idToFetch);
        return;
      }

      if (idToFetch) fetchInFlightRef.current = idToFetch;

      setIsLoading(true);
      setError(null);
      setEvidenceDetails(null);

      try {
        const contractAddress = (await publicClient.readContract({
          address: evidenceLedgerAddress,
          abi: evidenceLedgerAbi,
          functionName: "getEvidenceContractAddress",
          args: [idToFetch as `0x${string}`],
        })) as Address;

        if (!contractAddress || contractAddress === zeroAddress) {
          setError(`Evidence with this ID: ${idToFetch} not found.`);
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
      } catch (err) {
        console.error("Failed to fetch evidence details:", err);
        setError("Fetch Evidence: Unknown Error occured.");
      } finally {
        setIsLoading(false);
        if (fetchInFlightRef.current === idToFetch)
          fetchInFlightRef.current = null;
      }
    },
    [publicClient]
  );

  useEffect(() => {
    if (evidenceId && publicClient) {
      fetchEvidenceData(evidenceId);
    } else if (!publicClient) {
      setIsLoading(true);
    }
  }, [evidenceId, fetchEvidenceData, publicClient]);

  return { isLoading, error, evidenceDetails, fetchEvidenceData };
}
