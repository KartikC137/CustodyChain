"use client";

import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { useState, useEffect } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { useActivities } from "@/src/context-and-hooks/ActivitiesContext";
import {
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  BaseError,
} from "viem";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";
import { ActivityInfoForPanel } from "@/src/lib/types/activity.types";
import { evidenceAbi } from "@/src/lib/contracts/chain-of-custody-abi";
import { insertClientActivity } from "@/src/api/activities/insertClientActivity";
import { validAddressCheck } from "@/src/lib/util/helpers";

interface TransferOwnershipFormProps {
  contractAddress: Address;
  isActive: boolean;
  currentOwner: Address;
  evidenceId: Bytes32;
  onTransferFormSuccess: (success: boolean) => void;
}

export default function TransferOwnershipForm({
  contractAddress,
  isActive,
  currentOwner,
  evidenceId,
  onTransferFormSuccess,
}: TransferOwnershipFormProps) {
  const { account, chain, walletClient, publicClient } = useWeb3();
  const { addPendingActivity } = useActivities();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nextOwner, setNextOwner] = useState<string | "">("");

  const [inputStatus, setInputStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nextOwner) {
      setInputStatus("Enter New Owner address");
    } else {
      const addressResult = validAddressCheck(nextOwner);
      setInputStatus(addressResult);
    }
  }, [nextOwner]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!publicClient || !walletClient || !account || !chain) {
      setError("Wallet has been disconnected");
      onTransferFormSuccess(false);
      return;
    }

    if (!isActive) {
      setError("This evidence is not active!");
      onTransferFormSuccess(false);
      return;
    }

    if (!nextOwner) {
      setError("Invalid next owner address");
      onTransferFormSuccess(false);
      return;
    }

    if (!currentOwner || account.toLowerCase() !== currentOwner.toLowerCase()) {
      setError("Invalid current owner address");
      onTransferFormSuccess(false);
      return;
    }

    if (account.toLowerCase() === nextOwner.toLowerCase()) {
      setError("You are the Current Owner!");
      onTransferFormSuccess(false);
      return;
    }

    setIsLoading(true);

    try {
      const txHash = await walletClient.writeContract({
        address: contractAddress as `0x${string}}`,
        chain: chain,
        abi: evidenceAbi,
        functionName: "transferOwnership",
        args: [nextOwner],
        account,
        gas: 1_200_000n,
      });

      const pendingActivity: ActivityInfoForPanel = {
        id: BigInt("-1"), //Temporary placeholder
        status: "pending",
        type: "transfer",
        actor: account,
        owner: account,
        tx_hash: txHash,
        updated_at: null,
        evidence_id: evidenceId,
        to_addr: nextOwner,
      };
      addPendingActivity(pendingActivity);

      // DB
      await insertClientActivity({
        contractAddress: contractAddress,
        evidenceId: evidenceId,
        actor: account,
        type: "transfer",
        txHash: txHash,
        from: account,
        to: nextOwner,
      });

      onTransferFormSuccess(true);
    } catch (err) {
      //todo: expect more errors
      if (err instanceof BaseError) {
        const isUserRejection = err.walk(
          (err) => err instanceof UserRejectedRequestError,
        );
        if (isUserRejection) {
          setError("User rejected the transaction");
          return;
        }
      }
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
        setError("An unexpected contract error occured");
      }
      onTransferFormSuccess(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-6 rounded-sm bg-green-50 border-2 rounded-md border-2  ${error ? "border-red-600 bg-red-50" : "bg-green-50 border-green-700"}`}
    >
      <h2 className="font-sans font-[600] text-2xl text-orange-700">
        Transfer Ownership
      </h2>
      <div className="pl-1 pt-1 font-mono font-semibold text-lg text-red-600">
        {error}
      </div>
      <Input
        id="newOwnerAddress"
        label={`${inputStatus ? (inputStatus === "valid" ? "Next Owner address" : inputStatus) : "Enter Next Owner address"}`}
        labelStyle={`text-md font-semibold ${inputStatus === "valid" ? "text-green-900" : "text-orange-700"}`}
        type="text"
        value={nextOwner}
        onChange={(e) => {
          setNextOwner(e.target.value);
          setError(null);
        }}
        placeholder="0x..."
        required
      />
      <Button
        type="submit"
        variant="warning"
        isLoading={isLoading}
        loadingText="Transferring Ownership..."
        className="mt-3"
        disabled={!!error || !nextOwner || inputStatus !== "valid"}
      >
        Transfer Ownership
      </Button>
    </form>
  );
}
