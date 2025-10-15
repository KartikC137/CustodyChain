"use client";

import { useState } from "react";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import { type Address, isAddressEqual } from "viem";

import {
  evidenceLedgerAbi,
  evidenceLedgerAddress,
} from "@/lib/constants/abi/evidence-ledger-abi";
import { evidenceAbi } from "@/lib/constants/abi/chain-of-custody-abi";

interface EvidenceDetails {
  creator: Address;
  currentOwner: Address;
  description: string;
  chainOfCustody: Address[];
  isActive: boolean;
}

export default function GetEvidenceInfo() {
  const { publicClient } = useWeb3();

  const [evidenceId, setEvidenceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDetails, setEvidenceDetails] =
    useState<EvidenceDetails | null>(null);

  const handleFetchEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
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
      const evidenceContractAddress = (await publicClient.readContract({
        address: evidenceLedgerAddress,
        abi: evidenceLedgerAbi,
        functionName: "getEvidenceContractAddress",
        args: [evidenceId as `0x${string}`],
      })) as Address;

      if (
        isAddressEqual(
          evidenceContractAddress,
          "0x0000000000000000000000000000000000000000"
        )
      ) {
        throw new Error("Evidence with this ID not found.");
      }

      // Step 2: Fetch all details from the specific Evidence contract in parallel
      const [creator, currentOwner, description, chainOfCustody, isActive] =
        await Promise.all([
          publicClient.readContract({
            address: evidenceContractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceCreator",
          }) as Promise<Address>,
          publicClient.readContract({
            address: evidenceContractAddress,
            abi: evidenceAbi,
            functionName: "getCurrentOwner",
          }) as Promise<Address>,
          publicClient.readContract({
            address: evidenceContractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceDescription",
          }) as Promise<string>,
          publicClient.readContract({
            address: evidenceContractAddress,
            abi: evidenceAbi,
            functionName: "getChainOfCustody",
          }) as Promise<Address[]>,
          publicClient.readContract({
            address: evidenceContractAddress,
            abi: evidenceAbi,
            functionName: "getEvidenceState",
          }) as Promise<boolean>,
        ]);

      setEvidenceDetails({
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

  return (
    <div className="p-6 border rounded-lg space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold">Get Evidence Information</h2>
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
        <div className="p-4 mt-4 space-y-2 bg-gray-50 border rounded-md">
          <h3 className="text-lg font-semibold">Evidence Details</h3>
          <p className="font-mono text-sm">
            <strong>Description:</strong> {evidenceDetails.description}
          </p>
          <p className="font-mono text-sm">
            <strong>Creator:</strong> {evidenceDetails.creator}
          </p>
          <p className="font-mono text-sm">
            <strong>Current Owner:</strong> {evidenceDetails.currentOwner}
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
    </div>
  );
}
