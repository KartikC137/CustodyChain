"use client";

import Button from "../../ui/Button";
import { evidenceAbi } from "@/src/lib/contracts/chain-of-custody-abi";
import { useState } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { insertClientActivity } from "@/src/api/activities/insertClientActivity";
import { useActivities } from "@/src/context-and-hooks/ActivitiesContext";
import {
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  BaseError,
} from "viem";
import { Address } from "@/src/lib/types/solidity.types";
import { ActivityInfoForPanel } from "@/src/lib/types/activity.types";
import { Bytes32 } from "@/src/lib/types/solidity.types";

interface DiscontinueEvidenceProps {
  contractAddress: Address;
  evidenceId: Bytes32;
  isActive: boolean;
  creator: Address;
  onDiscontinueFormSuccess: (success: boolean) => void;
}
// todo : change UI
export default function DiscontinueEvidence({
  contractAddress,
  evidenceId,
  isActive,
  creator,
  onDiscontinueFormSuccess,
}: DiscontinueEvidenceProps) {
  const { account, chain, publicClient, walletClient } = useWeb3();
  const { addPendingActivity } = useActivities();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOnClick() {
    setError(null);

    if (!publicClient || !walletClient || !account || !chain) {
      setError("Wallet has been disconnected");
      onDiscontinueFormSuccess(false);
      return;
    }

    if (!isActive) {
      setError("This evidence is already discontinued!");
      onDiscontinueFormSuccess(false);
      return;
    }

    if (!creator || account.toLowerCase() !== creator.toLowerCase()) {
      setError("Invalid creator address");
      onDiscontinueFormSuccess(false);
      return;
    }

    setIsLoading(true);

    try {
      let initializedAt = new Date();

      const txHash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        chain: chain,
        abi: evidenceAbi,
        functionName: "discontinueEvidence",
        account,
      });

      // Activity
      const pendingActivity: ActivityInfoForPanel = {
        id: "-1", //Temporary placeholder
        status: "pending",
        type: "discontinue",
        actor: account,
        owner: account,
        txHash: txHash,
        updatedAt: initializedAt,
        evidenceId: evidenceId,
      };
      addPendingActivity(pendingActivity);

      // DB
      await insertClientActivity({
        evidenceId: evidenceId,
        actor: account,
        owner: account,
        type: "discontinue",
        txHash: txHash,
        initializedAt: initializedAt,
      });

      onDiscontinueFormSuccess(true);
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
        setError("An unexpected error occured");
      }
      onDiscontinueFormSuccess(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleOnClick}
      variant="alert"
      isLoading={isLoading}
      loadingText="Discontinuing Evidence..."
    >
      {error ? error + ". Try again?" : "Discontinue Evidence"}
    </Button>
  );
}
