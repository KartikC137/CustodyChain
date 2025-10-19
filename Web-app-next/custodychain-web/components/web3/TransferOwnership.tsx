"use client";

import { useState } from "react";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import {
  type Address,
  isAddress,
  ContractFunctionRevertedError,
  decodeEventLog,
} from "viem";
import { evidenceAbi } from "@/lib/constants/abi/chain-of-custody-abi";

interface TransferOwnershipFormProps {
  evidenceContractAddress: Address;
  isActive: boolean;
  currentOwner: Address;
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
  onTransferComplete,
}: TransferOwnershipFormProps) {
  const { account, chain, walletClient, publicClient } = useWeb3();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nextOwner, setNextOwner] = useState<Address | "">("");

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
      errorMessage = "Please enter a valid Ethereum address. (Begin with 0x)";
      onTransferComplete({ error: errorMessage });
      return;
    }

    if (
      !currentOwner ||
      !isAddress(currentOwner) ||
      account.toLowerCase() != currentOwner.toLowerCase()
    ) {
      errorMessage = "Only Current Owner Can Transfer Ownership";
      onTransferComplete({ error: errorMessage });
      return;
    }

    if (account.toLowerCase() == nextOwner.toLowerCase()) {
      errorMessage = "You are the Current Owner!";
      onTransferComplete({ error: errorMessage });
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
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      // Check if event output matches correct addresses
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
      } else {
        warningMessage =
          "Transaction succeeded, but the OwnershipTransferred event was not found";
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
    <form onSubmit={handleSubmit} className="p-6 border rounded-lg space-y-4">
      <h2 className="text-xl font-bold">Transfer Ownership</h2>
      <div>
        <label htmlFor="newOwnerAddress" className="block text-sm font-medium">
          Enter address of New Owner
        </label>
        <input
          id="newOwnerAddress"
          type="text"
          value={nextOwner as Address}
          onChange={(e) => setNextOwner(e.target.value as Address)}
          placeholder="0x..."
          className="w-full p-2 mt-1 border rounded"
          required
        ></input>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? "Transferring..." : "Transfer Ownership"}
      </button>
    </form>
  );
}
