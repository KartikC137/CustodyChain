"use client";

import { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import { type Address, isAddressEqual } from "viem";

import { evidenceLedgerAbi } from "@/lib/constants/abi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "@/lib/constants/evidence-ledger-address";

import { evidenceAbi } from "@/lib/constants/abi/chain-of-custody-abi";

export interface CustodyRecord {
  owner: Address;
  timestamp: bigint;
}

export interface EvidenceDetails {
  id: `0x${string}`;
  contractAddress: Address;
  creator: Address;
  timeOfCreation: bigint;
  currentOwner: Address;
  description: string;
  chainOfCustody: CustodyRecord[];
  isActive: boolean;
  timeOfDiscontinuation: bigint;
}

export default function fetchEvidence(evidenceId: `0x${string}`) {
  const { account, publicClient } = useWeb3();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDetails, setEvidenceDetails] =
    useState<EvidenceDetails | null>(null);

  const fetchEvidenceData = useCallback(
    async (idToFetch: string | undefined | null) => {
      if (!publicClient) {
        setError("Please connect your wallet first.");
        setIsLoading(false);
        return;
      }
      if (!idToFetch?.startsWith("0x") || idToFetch.length !== 66) {
        setError("Please enter a valid bytes32 Evidence ID (0x...).");
        setIsLoading(false);
        return;
      }

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

        if (
          isAddressEqual(
            contractAddress,
            "0x0000000000000000000000000000000000000000"
          )
        ) {
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
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setIsLoading(false);
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
