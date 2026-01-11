"use client";

import { useState, useEffect } from "react";
import { type Address, ContractFunctionRevertedError, isAddress } from "viem";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import { evidenceAbi } from "../../../../lib/contractAbi/chain-of-custody-abi";
import { useWeb3 } from "@/contexts/web3/Web3Context";
import { useActivities } from "@/contexts/ActivitiesContext";
import { insertClientActivity } from "@/app/api/clientActivity/insertClientActivity";
import { ActivityInfoForPanel } from "@/lib/types/activity.types";
import { validAddressCheck } from "@/lib/helpers";

interface TransferOwnershipFormProps {
  contractAddress: Address;
  isActive: boolean;
  currentOwner: Address;
  evidenceId: `0x${string}`;
  onTransferComplete: (result: TransferResult) => void;
}

export interface TransferResult {
  hash?: string;
  warning?: string;
  error?: string;
}

export default function TransferOwnershipForm({
  contractAddress,
  isActive,
  currentOwner,
  evidenceId,
  onTransferComplete,
}: TransferOwnershipFormProps) {
  const { account, chain, walletClient, publicClient } = useWeb3();
  const { addPendingActivity } = useActivities();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nextOwner, setNextOwner] = useState<string | "">("");

  const [inputStatus, setInputStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  let errorMessage: string;

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
      errorMessage = "Please connect your wallet first.";
      onTransferComplete({ error: errorMessage });
      return;
    }

    if (!isActive) {
      errorMessage = "This Evidence is not Active";
      onTransferComplete({ error: errorMessage });
      return;
    }

    if (!nextOwner || !isAddress(nextOwner)) {
      setError("Please enter a valid Ethereum address. (Begin with 0x)");
      return;
    }

    if (
      !currentOwner ||
      !isAddress(currentOwner) ||
      account.toLowerCase() !== currentOwner.toLowerCase()
    ) {
      setError("Only Current Owner Can Transfer Ownership");
      return;
    }

    if (account.toLowerCase() === nextOwner.toLowerCase()) {
      setError("You are the Current Owner!");
      return;
    }

    setIsLoading(true);

    try {
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        chain: chain,
        abi: evidenceAbi,
        functionName: "transferOwnership",
        args: [nextOwner],
        account,
        gas: 1_200_000n,
      });

      onTransferComplete({ hash: txHash });

      const pendingActivity: ActivityInfoForPanel = {
        id: BigInt("-1"), //Temporary placeholder
        status: "pending",
        type: "transfer",
        actor: account,
        tx_hash: txHash,
        updated_at: null,
        evidence_id: evidenceId,
        from_addr: account,
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
    } catch (err) {
      console.error("Transaction failed:", err);
      //todo fix checking for errors
      if (err instanceof ContractFunctionRevertedError) {
        const errorName = err.shortMessage
          .split("\n")[0]
          .replace("Error: ", "");
        if (errorName.startsWith("UnauthorizedDeployment")) {
          errorMessage = "This Deployement is Not Authorized";
        } else if (errorName.startsWith("CreatorIsNotInitialOwner")) {
          errorMessage =
            "The Evidence Creator was not found to be Initial Owner";
        } else if (errorName.startsWith("CallerIsNotCurrentOwner")) {
          errorMessage = "Only Current Owner can perform this action";
        } else {
          errorMessage = `Contract Error: ${errorName}`;
        }
      } else {
        errorMessage = "An unexpected error occured. See console for details.";
      }
      setError(errorMessage);
      onTransferComplete({ error: errorMessage });
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
