"use client";

import { useState } from "react";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import { type Address, isAddressEqual } from "viem";

import { evidenceLedgerAbi } from "@/lib/constants/abi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "@/lib/constants/evidence-ledger-address";

import { evidenceAbi } from "@/lib/constants/abi/chain-of-custody-abi";
import TransferOwnershipForm, {
  type TransferResult,
} from "./TransferOwnership";
import DiscontinueEvidence, {
  DiscontinueEvidenceResult,
} from "./DiscontinueEvidence";

interface EvidenceDetails {
  id: Address;
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

export default function FetchEvidence() {
  const { account, publicClient } = useWeb3();

  const [evidenceId, setEvidenceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDetails, setEvidenceDetails] =
    useState<EvidenceDetails | null>(null);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(
    null
  );
  const [discontinueResult, setDiscontinueResult] =
    useState<DiscontinueEvidenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");

  const handleFetchEvidence = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    if (!publicClient) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!evidenceId.startsWith("0x") || evidenceId.length !== 66) {
      setError("Please enter a valid bytes32 Evidence ID (0x...).");
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
        args: [evidenceId as `0x${string}`],
      })) as Address;

      if (
        isAddressEqual(
          contractAddress,
          "0x0000000000000000000000000000000000000000"
        )
      ) {
        setError("Evidence with this ID not found.");
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
        }) as Promise<Address>,
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

      setEvidenceId("");
    } catch (err) {
      console.error("Failed to fetch evidence details:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferComplete = (result: TransferResult) => {
    setTransferResult(result);
    handleFetchEvidence();
  };

  const handleEvidenceDiscontinued = (result: DiscontinueEvidenceResult) => {
    setDiscontinueResult(result);
    handleFetchEvidence();
  };

  const formatTimestamp = (rawTimeStamp: bigint) => {
    const date = new Date(Number(rawTimeStamp) * 1000);
    const formattedTimestamp = date.toLocaleString();
    return formattedTimestamp;
  };

  return (
    <div className="p-6 space-y-4 mx-auto">
      <h2 className="text-xl font-bold">Fetch Evidence</h2>
      <form
        onSubmit={handleFetchEvidence}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          value={evidenceId}
          onChange={(e) => setEvidenceId(e.target.value)}
          placeholder="Enter Evidence ID (0x...)"
          className="w-full p-2 font-mono border rounded"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? "Fetching..." : "Fetch"}
        </button>
      </form>

      {error && (
        <div className="p-2 text-sm text-red-700 bg-red-100 rounded">
          Error: {error}
        </div>
      )}

      {/* Evidence Details */}

      {evidenceDetails && (
        <div
          className={`p-4 mt-2 space-y-2 ${
            evidenceDetails.isActive
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          } rounded-md`}
        >
          <h3 className="-mt-1 text-lg font-semibold">
            {evidenceDetails.isActive
              ? "Evidence Details"
              : "Archived Evidence"}
            <p className="-mt-1 text-xs font-mono font-semibold">
              {evidenceDetails.id}
            </p>
          </h3>
          <p className="font-mono text-sm">
            <strong>Description:</strong> {evidenceDetails.description}
          </p>
          <p className="font-mono text-sm">
            <strong>Creator:</strong> {evidenceDetails.creator} :{" "}
            {formatTimestamp(evidenceDetails.timeOfCreation)}
          </p>
          <p className="font-mono text-sm">
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
          {/* View Select Tabs*/}
          <div className="mb-4">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("list")}
                className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === "list"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === "timeline"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Timeline View
              </button>
            </nav>
          </div>

          {/* Chain Of Custody*/}

          {activeTab === "list" ? (
            <div>
              <p className="font-mono text-sm">
                <strong>Chain of Custody List:</strong>
              </p>
              <ul className="mt-2 pl-5 list-decimal list-inside">
                {evidenceDetails.chainOfCustody.map((record, index) => {
                  return (
                    <li key={index} className="font-mono text-xs">
                      {record.owner} : {formatTimestamp(record.timestamp)}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div>
              <p className="font-mono text-sm font-semibold mt-4">
                Chain of Custody Timeline:
              </p>
              <div className="mt-4 flex flex-col items-center">
                {evidenceDetails.chainOfCustody.map((record, index) => {
                  const isLastItem =
                    index === evidenceDetails.chainOfCustody.length - 1;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center w-full max-w-md"
                    >
                      <div className="bg-gray-100 p-2 rounded-md shadow-sm w-full text-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {index === 0 ? "Created by" : `Owner #${index + 1}`}
                        </h3>
                        <time className="block mb-1 text-xs font-normal leading-none text-gray-500">
                          {formatTimestamp(record.timestamp)}
                        </time>
                        <p className="text-xs font-mono break-all">
                          {record.owner}
                        </p>
                      </div>
                      {!isLastItem && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5 text-gray-400 mb-2"
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
      {evidenceDetails &&
        evidenceDetails.isActive &&
        account?.toLowerCase() ===
          evidenceDetails.currentOwner.toLowerCase() && (
          <TransferOwnershipForm
            evidenceContractAddress={
              evidenceDetails?.contractAddress as Address
            }
            isActive={evidenceDetails?.isActive as boolean}
            currentOwner={evidenceDetails?.currentOwner as Address}
            onTransferComplete={handleTransferComplete}
          />
        )}
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
          Warning: {discontinueResult.error}
        </div>
      )}
    </div>
  );
}
