"use client";

import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { evidenceLedgerAbi } from "@/src/lib/contracts/evidence-ledger-abi";
import { insertPendingLedger } from "@/src/api/ledgers/insertPendingLedger";
import { useState } from "react";
import { useWallet } from "@/src/context-and-hooks/WalletContext";
import { UserRejectedRequestError, BaseError, parseEventLogs } from "viem";
import { ledgerCreationByteCode } from "@/src/lib/contracts/evidence-ledger-bytecode";
import { Bytes32 } from "@/src/lib/types/solidity.types";
import { useLedgers } from "@/src/context-and-hooks/LedgersContext";
import Link from "next/link";

export default function CreateLedgerForm() {
  const { account, chain, walletClient, publicClient } = useWallet();
  const { addPendingLedger, ledgers } = useLedgers();
  const [ledgerName, setledgerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Bytes32 | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!publicClient || !walletClient || !account || !chain) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsLoading(true);

    try {
      const txHash = await walletClient.deployContract({
        abi: evidenceLedgerAbi,
        account: account,
        chain: chain,
        bytecode: ledgerCreationByteCode,
      });

      // todo: fix this function and in every context: there should be no status field
      addPendingLedger({
        txHash: txHash,
        status: "pending",
        creator: account,
        name: ledgerName,
      });
      await insertPendingLedger(txHash, chain.id, account, ledgerName);
      setTxHash(txHash);
      setledgerName("");
      setError(null);
    } catch (err) {
      if (err instanceof BaseError) {
        const isUserRejection = err.walk(
          (err) => err instanceof UserRejectedRequestError,
        );

        if (isUserRejection) {
          setError("User rejected the transaction");
          return;
        }
      }
      setError("An unexpected error occured. Check your Wallet");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`p-10 mx-5 mt-45 rounded-md border-2  ${error ? "border-red-600 bg-red-50" : "bg-green-50 border-green-700"}`}
    >
      <p className="font-sans font-[400] text-5xl text-orange-700">
        Create Evidence Ledger
      </p>
      <div className={`grid grid-cols-[1fr_0.5fr] gap-x-3 items-start`}>
        <form onSubmit={handleSubmit} className="grid gap-y-3">
          <div className="pl-1 pt-1 font-mono font-semibold text-2xl text-red-600">
            {error}
          </div>
          <Input
            id="ledgerName"
            label={`Enter Ledger Name`}
            labelStyle={`text-xl font-medium text-green-900`}
            type="text"
            value={ledgerName}
            onChange={(e) => {
              setledgerName(e.target.value);
              setError(null);
            }}
            placeholder="0x..."
            required
          ></Input>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText="Creating Evidence..."
            className="text-xl"
            disabled={!!error || ledgerName === ""}
          >
            Deploy Ledger Contract
          </Button>
        </form>
        {txHash && (
          <div
            className={
              "flex flex-col border-2 rounded-md border-green-800 bg-green-100"
            }
          >
            <p className="p-2 text-lg text-green-800 font-sans font-semibold">
              New Evidence Ledger Creation Success:
            </p>
            <div
              className="*:p-2 *:border-orange-700 
                flex-y-none 
                font-mono font-semibold text-green-800
                *:hover:bg-orange-100 *:hover:underline
              "
            >
              <p className="border-t-2">
                Tx. Hash:<br></br>
                <span className="text-orange-700">
                  {txHash.slice(0, 16)}...
                  {txHash.slice(50, 66)}
                </span>
              </p>
              <Link
                href={`/ledgers/${ledgers.find((l) => l.txHash === txHash)?.id}/manage`}
                className="border-y-2"
              >
                New Ledger:<br></br>
                <span className="text-orange-700">Click to Open Ledger</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
