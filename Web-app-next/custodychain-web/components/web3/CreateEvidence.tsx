"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type Address,
  ContractFunctionRevertedError,
  decodeEventLog,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  toHex,
} from "viem";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { evidenceLedgerAbi } from "@/lib/constants/abi/evidence-ledger-abi";
import { evidenceLedgerAddress } from "@/lib/constants/evidence-ledger-address";
import { useActivityManager } from "@/lib/contexts/ActivityManagerContext";
import { type Evidence, useMockDb } from "@/lib/contexts/MockDBContext";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

export default function CreateEvidenceForm() {
  const { account, chain, walletClient, publicClient } = useWeb3();
  const [evidenceId, setEvidenceId] = useState<`0x${string}` | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { dispatch: mockDbDispatch } = useMockDb();
  const { dispatch: activityManagerDispatch } = useActivityManager();

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
    }
    if (!description) {
      setError("Please provide a description.");
      return;
    }

    setIsLoading(true);

    try {
      // Auto-generate evidence ID based on description and evidence ledger contract address and time of creation
      const currentTime = Date.now();
      const encodedData = encodeAbiParameters(
        parseAbiParameters("string, address, uint256"),
        [description, evidenceLedgerAddress, BigInt(currentTime)]
      );
      const evidenceId: `0x${string}` = keccak256(encodedData);
      const hash = await walletClient.writeContract({
        address: evidenceLedgerAddress,
        chain: chain,
        abi: evidenceLedgerAbi,
        functionName: "createEvidence",
        args: [evidenceId, description],
        account,
        gas: 1_200_000n,
      });

      setDescription("");
      setEvidenceId(evidenceId);
      setTransactionHash(hash);

      console.log("Evidence Created. Tx Hash: ", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const eventLog = receipt.logs
        .map((log) => {
          try {
            return decodeEventLog({ abi: evidenceLedgerAbi, ...log });
          } catch {
            return null;
          }
        })
        .find((log) => log?.eventName === "EvidenceCreated");

      if (eventLog) {
        console.log("Event decoded:", eventLog.args);
        const {
          creator: emittedCreator,
          evidenceId: emittedId,
          description: emittedDesc,
        } = eventLog.args as unknown as {
          creator: Address;
          evidenceId: `0x${string}`;
          description: string;
        };

        // Database
        try {
          const newEvidence: Evidence = {
            isActive: true,
            evidenceId: emittedId,
            description: description,
            creator: emittedCreator,
            currentOwner: emittedCreator,
          };

          mockDbDispatch({
            call: "create",
            account: emittedCreator,
            accountType: "creator",
            evidence: newEvidence,
          });

          console.log("MockDBProvider: Dispatched 'create' action to Mock DB.");
        } catch (err) {
          console.error(
            "MockDBProvider: Couldnt dispatch create evidence: ",
            err
          );
        }

        // Activity Manager

        try {
          activityManagerDispatch({
            address: account,
            evidenceId: emittedId,
            activityType: "create",
            transferredTo: null,
            time: new Date(),
          });

          console.log(
            "ActivityManagerProvider: Dispatched 'create' action to Mock DB."
          );
        } catch (err) {
          console.error(
            "ActivityManagerProvider: Couldnt dispatch create evidence: ",
            err
          );
        }

        if (emittedCreator.toLowerCase() !== account.toLowerCase()) {
          setWarning(
            "Evidence Creator from contract event does not match your account"
          );
        }
        if (emittedId.toLowerCase() !== evidenceId.toLowerCase()) {
          setWarning("Evidence ID from contract event does not match");
        }
        if (
          emittedDesc.toLowerCase() !==
          keccak256(toHex(description)).toLowerCase()
        ) {
          setWarning("Evidence Description from contract event does not match");
        }
      } else {
        setWarning(
          "Evidence Created, but the CreateEvidence event from contract was not found"
        );
      }
    } catch (err) {
      console.error("Transaction failed:", err);
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
        setError("An unexpected error occured. See console for details.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`p-10 w-200 rounded-md border-2 bg-green-50 ${!error ? "border-green-700" : "border-red-500"}`}
    >
      <p className="font-sans font-[400] text-5xl text-orange-700">
        Enter Evidence Description
      </p>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="h-5">
          {error && (
            <span className="ml-1 block text-xl text-red-700 leading-none">
              {error}
            </span>
          )}
        </div>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

        {warning && (
          <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
            Warning: {warning}, Please ensure it is correct.
          </div>
        )}
      </form>
    </div>
  );
}
