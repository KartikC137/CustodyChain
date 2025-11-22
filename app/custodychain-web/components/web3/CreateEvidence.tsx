"use client";

import { useState } from "react";
import {
  type Address,
  ContractFunctionRevertedError,
  decodeEventLog,
} from "viem";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { evidenceLedgerAbi } from "../../../lib/contractAbi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "@/lib/evidence-ledger-address";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

export default function CreateEvidenceForm() {
  const { account, chain, walletClient, publicClient } = useWeb3();
  const [metadataHash, setMetadataHash] = useState<string>("");
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
    if (!metadataHash.startsWith("0x") || metadataHash.length !== 66) {
      setError(
        "Invalid Evidence MetadataHash. Must be start with 0x... and have a length of 66"
      );
    }
    if (!description) {
      setError("Please provide a description.");
      return;
    }

    setIsLoading(true);

    try {
      const hash = await walletClient.writeContract({
        address: evidenceLedgerAddress,
        chain: chain,
        abi: evidenceLedgerAbi,
        functionName: "createEvidence",
        args: [metadataHash, description],
        account,
        gas: 1_200_000n,
      });

      setMetadataHash("");
      setDescription("");
      setTransactionHash(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
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
        const {
          creator: emittedCreator,
          evidenceId: emittedId,
          metadataHash: emittedMetadataHash,
        } = eventLog.args as unknown as {
          creator: Address;
          evidenceId: `0x${string}`;
          metadataHash: `0x${string}`;
        };

        console.log("Create evidence ID: ", emittedId);

        if (emittedCreator.toLowerCase() !== account.toLowerCase()) {
          setWarning(
            "Evidence Creator from contract event does not match your account"
          );
        }

        if (emittedMetadataHash !== metadataHash) {
          setWarning(
            "Evidence Metadata Hash from contract event does not match"
          );
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
        console.log("CreateEvidenceForm Error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`p-10 w-200 rounded-md border-2 bg-green-50 ${!error ? "border-green-700" : "border-red-500"}`}
    >
      <p className="mb-2 font-sans font-[400] text-5xl text-orange-700">
        Create Evidence
      </p>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="h-5">
          {error && (
            <span className="ml-1 font-mono block text-xl text-red-700 leading-none">
              {error}
            </span>
          )}
        </div>
        <Input
          id="metadataHash"
          label="1. Enter Evidence Metadata Hash"
          type="text"
          value={metadataHash}
          onChange={(e) => setMetadataHash(e.target.value)}
          onClick={() => {
            setError(null);
            setMetadataHash("");
          }}
          placeholder="0x..."
          required
        ></Input>
        <Input
          id="description"
          label="2. Enter Evidence Description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onClick={(e) => {
            setError(null);
            setTransactionHash(null);
          }}
          placeholder="e.g., Case File #123 Report"
          required
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          loadingText="Creating Evidence..."
        >
          Create Evidence
        </Button>
        {transactionHash && (
          <div className="p-2 font-mono text-sm text-orange-700 bg-green-100 rounded">
            <span className="text-green-700">Success,</span> Tx. Hash:{" "}
            {transactionHash}
          </div>
        )}
        {warning && (
          <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
            Warning: {warning}, Please ensure it is correct.
          </div>
        )}
      </form>
    </div>
  );
}
