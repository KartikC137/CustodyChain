"use client";

import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  type Address,
} from "viem";
import {
  evidenceLedgerAddress,
  evidenceLedgerAbi,
} from "@/lib/constants/abi/evidence-ledger-abi";
import { useState } from "react";

export default function CreateEvidenceForm() {
  const { account, chain, walletClient } = useWeb3();
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setTransactionHash(null);

    if (!description) {
      setError("Please provide a description.");
      return;
    }
    if (!walletClient || !account || !chain) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsLoading(true);

    try {
      const encodedData = encodeAbiParameters(
        parseAbiParameters("string, address"),
        [description, evidenceLedgerAddress]
      );
      const evidenceId: `0x${string}` = keccak256(encodedData);
      console.log("EvidenceLedger Address: ", evidenceLedgerAddress);
      console.log("Evidence ID is: ", evidenceId);
      console.log("description is: ", description);
      const hash = await walletClient.writeContract({
        address: evidenceLedgerAddress,
        chain: chain,
        abi: evidenceLedgerAbi,
        functionName: "createEvidence",
        args: [evidenceId, description],
        account,
        gas: 1_200_000n,
      });

      setTransactionHash(hash);
    } catch (err) {
      console.error("Transaction failed:", err);
      setError("Transaction failed. See console for details.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-lg space-y-4">
      <h2 className="text-xl font-bold">Create New Evidence</h2>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Evidence Description
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Case File #123 Report"
          className="w-full p-2 mt-1 border rounded"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? "Submitting..." : "Create Evidence on-chain"}
      </button>

      {transactionHash && (
        <div className="p-2 text-sm text-green-700 bg-green-100 rounded">
          Success! Transaction Hash: {transactionHash}
        </div>
      )}
      {error && (
        <div className="p-2 text-sm text-red-700 bg-red-100 rounded">
          Error: {error}
        </div>
      )}
    </form>
  );
}
