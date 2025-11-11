"use client";

import { useState } from "react";
import {
  type Address,
  ContractFunctionRevertedError,
  decodeEventLog,
  isAddress,
} from "viem";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { evidenceAbi } from "@/lib/constants/abi/chain-of-custody-abi";
import { useActivityManager } from "@/lib/contexts/ActivityManagerContext";
import { type Evidence, useMockDb } from "@/lib/contexts/MockDBContext";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

interface TransferOwnershipFormProps {
  evidenceContractAddress: Address;
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
  evidenceContractAddress,
  isActive,
  currentOwner,
  evidenceId,
  onTransferComplete,
}: TransferOwnershipFormProps) {
  const { account, chain, walletClient, publicClient } = useWeb3();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nextOwner, setNextOwner] = useState<Address | "">("");

  const { dispatch: mockDbDispatch } = useMockDb();
  const { dispatch: activityManagerDispatch } = useActivityManager();

  const [error, setError] = useState<string | undefined>(undefined);
  const [txHash, setTxHash] = useState<string | null>(null);
  let errorMessage: string;
  let warningMessage: string;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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
      setError("You are the Current Owner");
      return;
    }

    setIsLoading(true);

    try {
      console.log(
        "Initiate Transfer Ownership\n",
        "Transferring from:  ",
        account,
        "\nTo New Owner : ",
        nextOwner
      );
      const hash = await walletClient.writeContract({
        address: evidenceContractAddress,
        chain: chain,
        abi: evidenceAbi,
        functionName: "transferOwnership",
        args: [nextOwner],
        account,
        gas: 1_200_000n,
      });

      setTxHash(hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const eventLog = receipt.logs
        .map((log) => {
          try {
            return decodeEventLog({ abi: evidenceAbi, ...log });
          } catch {
            return null;
          }
        })
        .find((log) => log?.eventName === "OwnershipTransferred");

      if (eventLog) {
        const { previousOwner, newOwner } = eventLog.args as unknown as {
          previousOwner: Address;
          newOwner: Address;
        };

        if (previousOwner.toLowerCase() !== account.toLowerCase()) {
          warningMessage =
            "The Contract Event's previous Owner does not match your account";
        }
        if (newOwner.toLowerCase() !== nextOwner.toLowerCase()) {
          warningMessage =
            "The Contract Event's New Owner does not match the intended address";
        }

        // Database

        try {
          const evidenceToTransfer: Evidence = {
            evidenceId: evidenceId,
            isActive: true,
            description: "",
            creator: "0x0",
            currentOwner: account,
          };

          mockDbDispatch({
            call: "transfer",
            account: account,
            accountType: "owner",
            evidence: evidenceToTransfer,
            accountTo: nextOwner,
          });
          console.log(
            "MockDBProvider: Dispatched 'transfer' action to Mock DB."
          );
        } catch (err) {
          warningMessage =
            "MockDBProvider: Couldnt dispatch transfer evidence. See console for details";
          console.error(
            "MockDBProvider: Couldnt dispatch transfer evidence",
            err
          );
        }

        // Activity Manager

        try {
          activityManagerDispatch({
            address: account,
            evidenceId: evidenceId,
            activityType: "transfer",
            transferredTo: nextOwner,
            time: new Date(),
          });

          console.log(
            "ActivityManagerProvider: Dispatched 'transfer' action to Mock DB.",
            txHash
          );
        } catch (err) {
          warningMessage =
            "ActivityManagerProvider: Couldnt dispatch transfer evidence. See console for details";
          console.error(
            "ActivityManagerProvider: Couldnt dispatch transfer evidence: ",
            err
          );
        }
      } else {
        warningMessage =
          "Transaction succeeded, but the OwnershipTransferred Event was not found, MockDB and Activity log is not updated";
      }

      onTransferComplete({ hash, warning: warningMessage });
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

      onTransferComplete({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-sm bg-green-50 border-2 border-green-700 text-green-800 space-y-3"
    >
      <h2 className="text-xl font-bold">Transfer Ownership</h2>
      <Input
        label="New Owner Address"
        id="newOwnerAddress"
        type="text"
        value={nextOwner as Address}
        onChange={(e) => setNextOwner(e.target.value as Address)}
        placeholder="0x..."
        required
      />
      <Button
        type="submit"
        variant="warning"
        isLoading={isLoading}
        loadingText="Transferring Ownership..."
      >
        Transfer Ownership
      </Button>
    </form>
  );
}
