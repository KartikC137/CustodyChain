"use client";

import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { useRouter } from "next/navigation"; //replace this later
import { useState, useEffect } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { evidenceLedgerAbi } from "@/src/lib/contracts/evidence-ledger-abi";
import { zeroAddress } from "viem";
import { validHashCheck } from "@/src/lib/util/helpers";

export default function FetchEvidenceForm() {
  const [evidenceId, setEvidenceId] = useState<string>("");
  const [hashStatus, setHashStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { publicClient, ledgerAddress } = useWeb3();

  useEffect(() => {
    if (!evidenceId) {
      setHashStatus("Enter Evidence ID");
    } else {
      const hashResult = validHashCheck(evidenceId, "ID");
      setHashStatus(hashResult);
    }
  }, [evidenceId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setError(null);
      setIsLoading(true);

      if (!evidenceId) {
        setError("Evidence ID is required!");
        return;
      }

      if (!publicClient || !ledgerAddress) {
        return;
      }

      const contract = await publicClient.readContract({
        address: ledgerAddress,
        abi: evidenceLedgerAbi,
        functionName: "getEvidenceContractAddress",
        args: [evidenceId],
      });

      if (!contract || contract === zeroAddress) {
        setError("Evidence with this ID does not exist!");
        return;
      }
      router.push(`/evidence/${evidenceId}`);
      setEvidenceId("");
    } catch (err) {
      console.error("Fetch Evidence Form error:", err);
      setError("Unknown error occured. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`p-10 mx-5 mt-5 rounded-md border-2  ${error ? "border-red-600 bg-red-50" : "bg-green-50 border-green-700"}`}
    >
      <p className="font-sans font-[400] text-5xl text-orange-700">
        Fetch Evidence
      </p>
      <form onSubmit={handleSubmit} className="max-w-[800px] grid gap-3">
        <div className="pl-1 pt-1 font-mono font-semibold text-2xl text-red-600">
          {error}
        </div>
        <Input
          id="evidenceId"
          label={`${hashStatus ? (hashStatus === "valid" ? "Evidence ID" : hashStatus) : "Enter Evidence ID"}`}
          labelStyle={`text-xl font-medium ${hashStatus === "valid" ? "text-green-900" : "text-orange-700"}`}
          type="text"
          value={evidenceId}
          onChange={(e) => {
            setEvidenceId(e.target.value);
            setError(null);
          }}
          placeholder="0x..."
          required
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          loadingText="Fetching Evidence Details..."
          className="text-xl"
          disabled={!!error || !evidenceId || hashStatus !== "valid"}
        >
          Fetch Evidence Details
        </Button>
      </form>
    </div>
  );
}
