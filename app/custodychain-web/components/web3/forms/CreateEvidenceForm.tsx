"use client";

import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import { evidenceLedgerAbi } from "../../../../lib/contractAbi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "../../../../lib/evidence-ledger-address";
import { useState } from "react";
import { useWeb3 } from "@/contexts/web3/Web3Context";
import { useActivities } from "@/contexts/ActivitiesContext";
import {
  encodePacked,
  keccak256,
  zeroAddress,
  Address,
  UserRejectedRequestError,
  BaseError,
} from "viem";
import { insertClientActivity } from "../../../app/api/clientActivity/insertClientActivity";
import { ActivityInfoForPanel } from "@/lib/types/activity.types";

export default function CreateEvidenceForm() {
  const { addPendingActivity } = useActivities();
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
      return;
    }

    if (!description) {
      setError("Please provide a description.");
      return;
    }

    setIsLoading(true);

    try {
      const _evidenceId = keccak256(
        encodePacked(
          ["address", "bytes32", "uint256"],
          [
            account as `0x${string}`,
            metadataHash as `0x${string}`,
            chain.id as unknown as bigint,
          ]
        )
      );

      const _contractAddress = await publicClient.readContract({
        address: evidenceLedgerAddress,
        abi: evidenceLedgerAbi,
        functionName: "getEvidenceContractAddress",
        args: [_evidenceId],
      });

      if (_contractAddress !== zeroAddress) {
        setError("Evidence with this ID already exist!");
        return;
      }

      const txHash = await walletClient.writeContract({
        address: evidenceLedgerAddress,
        chain: chain,
        abi: evidenceLedgerAbi,
        functionName: "createEvidence",
        args: [metadataHash, description],
        account,
        gas: 1_200_000n,
      });

      const pendingActivity: ActivityInfoForPanel = {
        id: BigInt("-1"), //Temporary placeholder
        status: "pending",
        type: "create",
        actor: account as Address,
        tx_hash: txHash,
        updated_at: null,
        evidence_id: _evidenceId,
      };
      addPendingActivity(pendingActivity);

      // DB
      await insertClientActivity({
        contractAddress: _contractAddress,
        evidenceId: _evidenceId,
        actor: account,
        type: "create",
        txHash: txHash,
      });

      setMetadataHash("");
      setDescription("");
      setTransactionHash(txHash);
    } catch (err) {
      //todo: test for errors
      if (err instanceof BaseError) {
        const isUserRejection = err.walk(
          (err) => err instanceof UserRejectedRequestError
        );

        if (isUserRejection) {
          setError("User rejected the transaction.");
          return;
        }
      }
      console.error("CreateEvidenceForm Error:", err);
      setError("An unexpected error occured. See console for details.");
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
            // setMetadataHash("");
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
            {/* todo: link to evidence page and other info*/}
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
