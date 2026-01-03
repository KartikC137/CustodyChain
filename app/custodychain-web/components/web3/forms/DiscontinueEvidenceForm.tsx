"use client";

import { useState } from "react";
import {
  type Address,
  ContractFunctionRevertedError,
  decodeEventLog,
  isAddress,
} from "viem";
import Button from "@/components/UI/Button";
import { evidenceAbi } from "../../../../lib/contractAbi/chain-of-custody-abi";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

interface DiscontinueEvidenceProps {
  evidenceContractAddress: Address;
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
  evidenceContractAddress,
  evidenceId,
  isActive,
  creator,
  onDiscontinueEvidenceComplete,
}: DiscontinueEvidenceProps) {
  const { account, chain, publicClient, walletClient } = useWeb3();
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
      const hash = await walletClient.writeContract({
        address: evidenceContractAddress,
        chain: chain,
        abi: evidenceAbi,
        functionName: "discontinueEvidence",
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const eventLog = receipt.logs
        .map((log) => {
          try {
            return decodeEventLog({ abi: evidenceAbi, ...log });
          } catch {
            return null;
          }
        })
        .find((log) => log?.eventName === "EvindenceDiscontinued");
      if (eventLog) {
        const { evidenceId: emittedId } = eventLog.args as unknown as {
          evidenceId: `0x${string}`;
        };
        if (emittedId !== evidenceId) {
          warningMessage = "Evidence ID from Contract Event does not Match";
        }
      } else {
        warningMessage =
          "Evidence Discontinue, but the EvidenceDiscontinued event was not found";
      }

      onDiscontinueEvidenceComplete({ hash, warning: warningMessage });
    } catch (err) {
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
