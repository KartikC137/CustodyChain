"use client";

import { useState } from "react";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import { evidenceAbi } from "@/lib/constants/abi/chain-of-custody-abi";
import {
  type Address,
  isAddress,
  ContractFunctionRevertedError,
  decodeEventLog,
} from "viem";
import MockEvidenceDataManager, {
  type Evidence,
} from "../../app/api/dev/MockEvidenceDataManager";
import Button from "@/components/Button";

interface DiscontinueEvidenceProps {
  evidenceContractAddress: Address;
  evidenceId: `0x${string}`;
  isActive: boolean;
  creator: Address;
  onDiscontnueEvidenceComplete: (result: DiscontinueEvidenceResult) => void;
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
  onDiscontnueEvidenceComplete,
}: DiscontinueEvidenceProps) {
  const { account, chain, publicClient, walletClient } = useWeb3();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  let errorMessage: string;
  let warningMessage: string;

  async function handleOnClick() {
    if (!publicClient || !walletClient || !account || !chain) {
      errorMessage = "Please connect your wallet first.";
      onDiscontnueEvidenceComplete({ error: errorMessage });
      return;
    }

    if (!isActive) {
      errorMessage = "This Evidence is not Active";
      onDiscontnueEvidenceComplete({ error: errorMessage });
      return;
    }

    if (
      !creator ||
      !isAddress(creator) ||
      account.toLowerCase() != creator.toLowerCase()
    ) {
      errorMessage = "Only Creator Can Discontinue Evidence";
      onDiscontnueEvidenceComplete({ error: errorMessage });
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

      // Database

      const description = publicClient.readContract({
        address: evidenceContractAddress,
        abi: evidenceAbi,
        functionName: "getEvidenceDescription",
      }) as Promise<string>;

      // Database write

      try {
        const description = (await publicClient.readContract({
          address: evidenceContractAddress,
          abi: evidenceAbi,
          functionName: "getEvidenceDescription",
        })) as string;

        const newEvidence: Evidence = {
          isActive: true,
          evidenceId: evidenceId,
          description: description,
          creator: account,
          currentOwner: account,
        };

        const DbSuccess = await MockEvidenceDataManager({
          account: account,
          accountType: "creator",
          evidence: newEvidence,
          call: "discontinue",
        });
      } catch (err) {
        console.error("Couldnt Interact with DB: ", err);
      }

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
        if (emittedId != evidenceId) {
          warningMessage = "Evidence ID from Contract Event does not Match";
        }
      } else {
        warningMessage =
          "Evidence Discontinue, but the EvidenceDiscontinued event was not found";
      }
      onDiscontnueEvidenceComplete({ hash, warning: warningMessage });
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
      onDiscontnueEvidenceComplete({ error: errorMessage });
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
