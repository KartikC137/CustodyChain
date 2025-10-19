"use client";

import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import {
  keccak256,
  toHex,
  encodeAbiParameters,
  parseAbiParameters,
  type Address,
  ContractFunctionRevertedError,
  decodeEventLog,
} from "viem";
import { evidenceLedgerAbi } from "@/lib/constants/abi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "@/lib/constants/evidence-ledger-address";
import { useState } from "react";

export default function CreateEvidenceForm() {
  const { account, chain, walletClient, publicClient } = useWeb3();
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setWarning(null);
    setTransactionHash(null);

    if (!publicClient || !walletClient || !account || !chain) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!evidenceLedgerAddress) {
      setError("Evidence Ledger contract is not deployed on this chain");
    }
    if (!description) {
      setError("Please provide a description.");
      return;
    }

    setIsLoading(true);

    try {
      // Auto-generate evidence ID based on description and evidence ledger contract address
      const encodedData = encodeAbiParameters(
        parseAbiParameters("string, address"),
        [description, evidenceLedgerAddress]
      );
      const evidenceId: Address = keccak256(encodedData);
      console.log(
        "Initiate Evidence Creation\n",
        "EvidenceLedger Address: ",
        evidenceLedgerAddress,
        "\nEvidence ID : ",
        evidenceId,
        "\nDescription : ",
        description
      );

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
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Check if event output matches correct addresses
      const eventLog = receipt.logs
        .map((log) => {
          try {
            return decodeEventLog({ abi: evidenceLedgerAbi, ...log });
          } catch {
            return null;
          }
        })
        .find((log) => log?.eventName === "EvidenceCreated");
      if (eventLog) {
        console.log("Event decoded:", eventLog.args);
        const {
          creator: emittedCreator,
          evidenceId: emittedId,
          description: emittedDesc,
        } = eventLog.args as unknown as {
          creator: Address;
          evidenceId: `0x${string}`;
          description: string;
        };
        if (emittedCreator.toLowerCase() !== account.toLowerCase()) {
          setWarning(
            "Evidence Creator from contract event does not match your account"
          );
        }
        if (emittedId.toLowerCase() !== evidenceId.toLowerCase()) {
          setWarning("Evidence ID from contract event does not match");
        }
        if (
          emittedDesc.toLowerCase() !==
          keccak256(toHex(description)).toLowerCase()
        ) {
          setWarning("Evidence Description from contract event does not match");
        }
      } else {
        setWarning(
          "Evidence Created, but the CreateEvidence event from contract was not found"
        );
      }
    } catch (err) {
      console.error("Transaction failed:", err);
      if (err instanceof ContractFunctionRevertedError) {
        const errorName = err.shortMessage
          .split("\n")[0]
          .replace("Error: ", "");
        if (errorName.startsWith("UnauthorizedDeployment")) {
          setError("This Deployement is Not Authorized");
        } else if (errorName.startsWith("CreatorIsNotInitialOwner")) {
          setError("The Evidence Creator was not found to be Initial Owner");
        } else if (errorName.startsWith("CallerIsNotCurrentOwner")) {
          setError("Only Current Owner can perform this action");
        } else {
          setError(`Contract Error: ${errorName}`);
        }
      } else {
        setError("An unexpected error occured. See console for details.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
      {warning && (
        <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
          Warning: {warning}, Please ensure it is correct.
        </div>
      )}
    </form>
  );
}
