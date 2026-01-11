"use client";

import { useState } from "react";
import { type Address, ContractFunctionRevertedError, isAddress } from "viem";
import Button from "@/components/UI/Button";
import { evidenceAbi } from "../../../../lib/contractAbi/chain-of-custody-abi";
import { useWeb3 } from "@/contexts/web3/Web3Context";
import { useActivities } from "@/contexts/ActivitiesContext";
import { insertClientActivity } from "@/app/api/clientActivity/insertClientActivity";
import { ActivityInfoForPanel } from "@/lib/types/activity.types";

interface DiscontinueEvidenceProps {
  contractAddress: Address;
  evidenceId: `0x${string}`;
  isActive: boolean;
  creator: Address;
  onDiscontinueEvidenceComplete: (result: DiscontinueEvidenceResult) => void;
}

export interface DiscontinueEvidenceResult {
  hash?: string;
  warning?: string;
  error?: string;
}

export default function DiscontinueEvidence({
  contractAddress,
  evidenceId,
  isActive,
  creator,
  onDiscontinueEvidenceComplete,
}: DiscontinueEvidenceProps) {
  const { account, chain, publicClient, walletClient } = useWeb3();
  const { addPendingActivity } = useActivities();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  let errorMessage: string;
  let warningMessage: string;

  async function handleOnClick() {
    if (!publicClient || !walletClient || !account || !chain) {
      errorMessage = "Please connect your wallet first.";
      onDiscontinueEvidenceComplete({ error: errorMessage });
      return;
    }

    if (!isActive) {
      errorMessage = "This Evidence is not Active";
      onDiscontinueEvidenceComplete({ error: errorMessage });
      return;
    }

    if (
      !creator ||
      !isAddress(creator) ||
      account.toLowerCase() !== creator.toLowerCase()
    ) {
      errorMessage = "Only Creator Can Discontinue Evidence";
      onDiscontinueEvidenceComplete({ error: errorMessage });
      return;
    }

    setIsLoading(true);

    try {
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        chain: chain,
        abi: evidenceAbi,
        functionName: "discontinueEvidence",
        account,
      });

      onDiscontinueEvidenceComplete({ hash: txHash });
      const pendingActivity: ActivityInfoForPanel = {
        id: BigInt("-1"), //Temporary placeholder
        status: "pending",
        type: "discontinue",
        actor: account,
        tx_hash: txHash,
        updated_at: null,
        evidence_id: evidenceId,
      };
      addPendingActivity(pendingActivity);

      // DB
      await insertClientActivity({
        contractAddress: contractAddress,
        evidenceId: evidenceId,
        actor: account,
        type: "discontinue",
        txHash: txHash,
      });
    } catch (err) {
      // todo fix errors
      console.error("Transaction failed:", err);
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
      onDiscontinueEvidenceComplete({ error: errorMessage });
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
      Discontinue Evidence
    </Button>
  );
}
