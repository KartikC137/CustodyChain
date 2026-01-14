"use client";

import Button from "@/lib/UI/Button";
import Input from "@/lib/UI/Input";
import { evidenceLedgerAbi } from "../../../lib/contractAbi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "../../../lib/evidence-ledger-address";
import { useEffect, useState } from "react";
import { useWeb3 } from "../contexts/web3/Web3Context";
import { useActivities } from "../contexts/ActivitiesContext";
import {
  encodePacked,
  keccak256,
  zeroAddress,
  Address,
  UserRejectedRequestError,
  BaseError,
} from "viem";
import { insertClientActivity } from "../api/clientActivity/insertClientActivity";
import { ActivityInfoForPanel } from "@/lib/types/activity.types";
import { validHashCheck } from "@/lib/helpers";
import { isValidDesc } from "@/lib/helpers";
import Link from "next/link";

export default function CreateEvidenceForm() {
  const { addPendingActivity } = useActivities();
  const { account, chain, walletClient, publicClient } = useWeb3();
  const [metadataHash, setMetadataHash] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [contract, setContract] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hashStatus, setHashStatus] = useState<string | null>(null);
  const [descStatus, setDescStatus] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  useEffect(() => {
    if (!metadataHash && !description) {
      setHashStatus("Enter Evidence Metadata Hash");
      setDescStatus("Enter Evidence Description");
    } else {
      const hashResult = validHashCheck(metadataHash, "Metadata Hash");
      const descResult = isValidDesc(description);
      setHashStatus(hashResult);
      if (descResult) {
        setDescStatus("valid");
      } else {
        setDescStatus("Enter Evidence Description");
      }
    }
  }, [metadataHash, description]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!publicClient || !walletClient || !account || !chain) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!evidenceLedgerAddress) {
      setError("Evidence Ledger contract is not deployed on this chain.");
      return;
    }

    if (!metadataHash || !description) {
      setError("Missing required values!");
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

      const _newContractAddress = (await publicClient.readContract({
        address: evidenceLedgerAddress,
        abi: evidenceLedgerAbi,
        functionName: "getEvidenceContractAddress",
        args: [_evidenceId],
      })) as Address;

      // Panel
      const pendingActivity: ActivityInfoForPanel = {
        id: BigInt("-1"),
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
        contractAddress: _newContractAddress,
        evidenceId: _evidenceId,
        actor: account,
        type: "create",
        txHash: txHash,
      });

      setMetadataHash("");
      setDescription("");
      setError(null);
      setEvidenceId(_evidenceId);
      setContract(_newContractAddress);
      setTransactionHash(txHash);
    } catch (err) {
      //todo: test for more type of errors
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
      className={`p-10 w-full rounded-md border-2  ${error ? "border-red-600 bg-red-50" : "bg-green-50 border-green-700"}`}
    >
      <p className="font-sans font-[400] text-5xl text-orange-700">
        Create Evidence
      </p>
      <div className={`grid grid-cols-[1fr_0.5fr] gap-x-3`}>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="pl-1 pt-1 font-mono font-semibold text-2xl text-red-600">
            {error}
          </div>
          <Input
            id="metadataHash"
            label={`1. ${hashStatus ? (hashStatus === "valid" ? "Evidence Metadata Hash" : hashStatus) : "Enter Evidence Metadata Hash"}`}
            labelStyle={`text-xl font-medium ${hashStatus === "valid" ? "text-green-900" : "text-orange-700"}`}
            type="text"
            value={metadataHash}
            onChange={(e) => {
              setMetadataHash(e.target.value);
              setError(null);
            }}
            placeholder="0x..."
            required
          ></Input>
          <Input
            id="description"
            label={`2. ${descStatus ? (descStatus === "valid" ? "Description" : descStatus) : "Enter Evidence Description"}`}
            labelStyle={`text-xl font-medium ${descStatus === "valid" ? "text-green-900" : "text-orange-700"}`}
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            placeholder="e.g., Case File #123 Report"
            required
          />
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText="Creating Evidence..."
            disabled={
              !!error ||
              hashStatus !== "valid" ||
              descStatus !== "valid" ||
              metadataHash === "" ||
              description === ""
            }
          >
            Create Evidence
          </Button>
        </form>
        {transactionHash && evidenceId && contract && (
          <div
            className={
              "flex flex-col border-2 rounded-md border-green-800 bg-green-100"
            }
          >
            <p className="p-2 text-lg text-green-800 font-sans font-semibold">
              New Evidence Creation Success:
            </p>
            <div
              className="*:p-2 *:border-orange-700 
                flex-1 grid grid-rows-3 
                font-mono font-semibold text-green-800
                *:hover:bg-orange-100 *:hover:underline
              "
            >
              {/* //todo add a helper function for consistent slicing later */}
              <p className="border-t-2">
                Tx. Hash:<br></br>
                <span className="text-orange-700">
                  {transactionHash.slice(0, 16)}...
                  {transactionHash.slice(50, 66)}
                </span>
              </p>
              <Link href={`/evidence/${evidenceId}`} className="border-y-2">
                New Evidence ID:<br></br>
                <span className="text-orange-700">
                  {evidenceId.slice(0, 16)}...{evidenceId.slice(50, 66)}
                </span>
              </Link>
              <p className="rounded-b-md">
                Contract Address: <br></br>
                <span className="text-orange-700">{contract}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
