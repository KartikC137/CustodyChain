"use client";

import { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import { type Address, isAddressEqual } from "viem";

import { evidenceLedgerAbi } from "@/lib/constants/abi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "@/lib/constants/evidence-ledger-address";

import { evidenceAbi } from "@/lib/constants/abi/chain-of-custody-abi";

import TransferOwnershipForm, {
  type TransferResult,
} from "@/components/web3/TransferOwnership";
import DiscontinueEvidence, {
  DiscontinueEvidenceResult,
} from "@/components/web3/DiscontinueEvidence";

interface EvidenceDetails {
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

interface CustodyRecord {
  owner: Address;
  timestamp: bigint;
}

interface FetchEvidenceProps {
  evidenceId: `0x${string}`; // Receive the ID as a prop
}

export default function FetchEvidence({ evidenceId }: FetchEvidenceProps) {
  const { account, publicClient } = useWeb3();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDetails, setEvidenceDetails] =
    useState<EvidenceDetails | null>(null);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(
    null
  );
  const [discontinueResult, setDiscontinueResult] =
    useState<DiscontinueEvidenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("timeline");

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
      setTransferResult(null);
      setDiscontinueResult(null);

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
  }, [evidenceId, publicClient]);

  const handleTransferComplete = (result: TransferResult) => {
    setTransferResult(result);
    if (!result.error) {
      fetchEvidenceData(evidenceId);
    }
  };

  const handleEvidenceDiscontinued = (result: DiscontinueEvidenceResult) => {
    setDiscontinueResult(result);
    if (!result.error) {
      fetchEvidenceData(evidenceId);
    }
  };

  const formatTimestamp = (rawTimeStamp: bigint) => {
    if (rawTimeStamp === 0n) return "N/A";
    const date = new Date(Number(rawTimeStamp) * 1000);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        Loading evidence details for ID: {evidenceId}...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  if (!evidenceDetails) {
    return (
      <div className="p-6 text-center">
        Could not load evidence data for ID: {evidenceId}. Please check the ID
        and try again.
      </div>
    );
  }

  return (
    <div>
      {/* Evidence Details */}

      {evidenceDetails && (
        <div
          className={`p-4 mt-2 space-y-2 ${
            evidenceDetails.isActive
              ? "bg-orange-50 border border-orange-700"
              : "bg-gray-50 border border-gray-400"
          } rounded-md`}
        >
          <h3
            className={`text-lg font-semibold ${
              evidenceDetails.isActive ? "text-green-900" : "text-orange-900"
            }`}
          >
            {evidenceDetails.isActive
              ? "Evidence Details"
              : "Archived Evidence"}
            <p className="-mt-1 text-sm font-mono font-semibold">
              ID: {evidenceDetails.id}
            </p>
          </h3>
          <p className="font-mono text-sm text-orange-900">
            <strong>Description:</strong> {evidenceDetails.description}
          </p>
          <p className="font-mono text-sm text-orange-900">
            <strong>Creator:</strong> {evidenceDetails.creator} :{" "}
            {formatTimestamp(evidenceDetails.timeOfCreation)}
          </p>
          <p className="font-mono text-sm text-orange-900">
            <strong>
              {evidenceDetails.isActive ? "Current Owner: " : "Last Owner: "}
            </strong>
            {evidenceDetails.currentOwner} :{" "}
            {formatTimestamp(
              evidenceDetails.chainOfCustody[
                evidenceDetails.chainOfCustody.length - 1
              ].timestamp
            )}
          </p>

          {/* Chain Of Custody*/}

          <p className="font-mono text-sm text-orange-900">
            <strong>Chain of Custody List:</strong>
          </p>

          {/* View Select Tabs*/}

          <div className="mb-4">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("list")}
                className={`whitespace-nowrap py-2 px-3 border-1 rounded-md font-medium text-sm ${
                  activeTab === "list"
                    ? "border-orange-500 text-orange-700"
                    : "border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-500"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`whitespace-nowrap py-2 px-3 border-1 rounded-md font-medium text-sm ${
                  activeTab === "timeline"
                    ? "border-orange-500 text-orange-700"
                    : "border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-500"
                }`}
              >
                Timeline View
              </button>
            </nav>
          </div>

          {activeTab === "list" ? (
            <div className="space-y-2">
              <ul className="list-decimal list-inside">
                {evidenceDetails.chainOfCustody.map((record, index) => {
                  return (
                    <li
                      key={index}
                      className="font-mono font-semibold text-sm text-green-900 pt-1 pl-1"
                    >
                      <span className="font-medium text-red-900">
                        {record.owner}
                      </span>{" "}
                      :{" "}
                      <span className="font-medium text-red-900">
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div>
              <div className="mt-4 flex flex-col items-center">
                {evidenceDetails.chainOfCustody.map((record, index) => {
                  const isLastItem =
                    index === evidenceDetails.chainOfCustody.length - 1;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center w-full max-w-md"
                    >
                      <div className="relative w-full mb-1 border border-green-700 rounded-md bg-green-50 p-2 shadow-sm">
                        <h3 className="text-sm font-mono font-semibold text-green-900">
                          {evidenceDetails.isActive
                            ? index === 0 && isLastItem
                              ? "Creator / Current Owner"
                              : index === 0
                              ? "Creator"
                              : isLastItem
                              ? "Current Owner"
                              : "Owner"
                            : index === 0 && isLastItem
                            ? "Creator / Last Owner"
                            : index === 0
                            ? "Creator"
                            : isLastItem
                            ? "Last Owner"
                            : "Owner"}
                        </h3>
                        <div className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 border border-orange-900 rounded-tr-md font-mono text-sm text-orange-900">
                          {index + 1}
                        </div>
                        <time className="block text-sm text-red-900 font-mono leading-none">
                          {formatTimestamp(record.timestamp)}
                        </time>
                        <p className="text-sm text-red-900 font-mono break-all">
                          {record.owner}
                        </p>
                      </div>
                      {!isLastItem && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5 text-red-900 mb-2"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a.75.75 0 01.75.75v10.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3.75A.75.75 0 0110 3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transfer Ownership*/}

      {evidenceDetails &&
        evidenceDetails.isActive &&
        account?.toLowerCase() ===
          evidenceDetails.currentOwner.toLowerCase() && (
          <TransferOwnershipForm
            evidenceContractAddress={evidenceDetails.contractAddress as Address}
            isActive={evidenceDetails.isActive as boolean}
            currentOwner={evidenceDetails.currentOwner as Address}
            evidenceId={evidenceDetails.id as `0x${string}`}
            onTransferComplete={handleTransferComplete}
          />
        )}

      {/* Discontinue Evidence*/}

      {evidenceDetails &&
        evidenceDetails.isActive &&
        account?.toLowerCase() === evidenceDetails.creator.toLowerCase() && (
          <DiscontinueEvidence
            evidenceContractAddress={evidenceDetails.contractAddress as Address}
            evidenceId={evidenceDetails.id as `0x${string}`}
            isActive={evidenceDetails.isActive as boolean}
            creator={evidenceDetails.creator as Address}
            onDiscontnueEvidenceComplete={handleEvidenceDiscontinued}
          />
        )}

      {/* LOGS */}

      {transferResult?.hash && (
        <div className="p-2 text-sm text-green-700 bg-green-100 rounded">
          Ownership Transferred. Tx. Hash: {transferResult.hash}
        </div>
      )}
      {discontinueResult?.hash && (
        <div className="p-2 text-sm text-green-700 bg-green-100 rounded">
          Evidence is now Discontinued. Tx. Hash: {discontinueResult.hash}
        </div>
      )}
      {transferResult?.warning && (
        <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
          Warning: {transferResult.warning}
        </div>
      )}
      {discontinueResult?.warning && (
        <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
          Warning: {discontinueResult.warning}
        </div>
      )}
      {transferResult?.error && (
        <div className="p-2 text-sm text-red-700 bg-red-100 rounded">
          Error: {transferResult.error}
        </div>
      )}
      {discontinueResult?.error && (
        <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
          Error: {discontinueResult.error}
        </div>
      )}
    </div>
  );
}
