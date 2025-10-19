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
  currentOwner: Address;
  description: string;
  chainOfCustody: Address[];
  isActive: boolean;
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

      const [id, creator, currentOwner, description, chainOfCustody, isActive] =
        await Promise.all([
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
          }) as Promise<Address[]>,
          publicClient.readContract({
            address: contractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceState",
          }) as Promise<boolean>,
        ]);

      setEvidenceDetails({
        id,
        contractAddress,
        creator,
        currentOwner,
        description,
        chainOfCustody,
        isActive,
      });
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

      {evidenceDetails && (
        <div
          className={`p-4 mt-2 space-y-2 ${
            evidenceDetails.isActive
              ? "border"
              : "border-solid border-2 border-gray-400 text-gray-600"
          } rounded-md`}
        >
          <h3 className="-mt-1 text-lg font-semibold">
            {evidenceDetails.isActive
              ? "Evidence Details"
              : "Archived Evidence"}
            <p className="-mt-1 text-xs font-semibold">{evidenceDetails.id}</p>
          </h3>
          <p className="font-mono text-sm">
            <strong>Description:</strong> {evidenceDetails.description}
          </p>
          <p className="font-mono text-sm">
            <strong>Creator:</strong> {evidenceDetails.creator}
          </p>
          <p className="font-mono text-sm">
            <strong>
              {evidenceDetails.isActive ? "Current Owner:" : "Last Owner"}
            </strong>{" "}
            {evidenceDetails.currentOwner}
          </p>
          <p className="font-mono text-sm">
            <strong>Status:</strong>{" "}
            {evidenceDetails.isActive ? "Active" : "Discontinued"}
          </p>
          <div>
            <p className="font-mono text-sm">
              <strong>Chain of Custody:</strong>
            </p>
            <ul className="pl-5 list-decimal list-inside">
              {evidenceDetails.chainOfCustody.map((owner, index) => (
                <li key={index} className="font-mono text-xs">
                  {owner}
                </li>
              ))}
            </ul>
          </div>
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
