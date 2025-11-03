"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import { type Address } from "viem";
import fetchEvidence, {
  type EvidenceDetails,
} from "@/app/api/web3/FetchEvidence";
import TransferOwnershipForm, {
  type TransferResult,
} from "@/components/web3/TransferOwnership";
import DiscontinueEvidence, {
  type DiscontinueEvidenceResult,
} from "@/components/web3/DiscontinueEvidence";

const formatTimestamp = (rawTimeStamp: bigint) => {
  if (rawTimeStamp === 0n) return "N/A";
  const date = new Date(Number(rawTimeStamp) * 1000);
  return date.toLocaleString();
};

export default function EvidencePage() {
  const params = useParams();
  const evidenceIdFromUrl = params.id as `0x${string}`;
  const isValidIdFormat =
    evidenceIdFromUrl?.startsWith("0x") && evidenceIdFromUrl.length === 66;

  if (!isValidIdFormat) {
    return (
      <div className="p-6 text-center text-red-600">
        Error: Invalid Evidence ID format in URL.
      </div>
    );
  }

  const { account } = useWeb3();

  const { isLoading, error, evidenceDetails, fetchEvidenceData } =
    fetchEvidence(evidenceIdFromUrl as `0x${string}`);
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("timeline");
  const [transferResult, setTransferResult] = useState<TransferResult>();
  const [discontinueResult, setDiscontinueResult] =
    useState<DiscontinueEvidenceResult>();

  if (isLoading) {
    return (
      <div className="font-mono text-center text-xl text-green-700">
        Loading Evidence Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-mono text-center text-xl text-red-500">{error}</div>
    );
  }

  if (!account) {
    return (
      <div className="font-mono text-center text-xl text-red-500">
        Connect Your Wallet to view Evidence
      </div>
    );
  }
  if (!evidenceDetails) {
    return (
      <div className="font-mono text-center text-xl text-red-500">
        Couldnt Fetch Evidence Details for ID: {evidenceIdFromUrl}
      </div>
    );
  }

  function handleTransferComplete(result: TransferResult) {
    setTransferResult(result);
    if (!result.error) {
      fetchEvidenceData(evidenceIdFromUrl);
    }
  }

  function handleEvidenceDiscontinued(result: DiscontinueEvidenceResult) {
    setDiscontinueResult(result);
    if (!result.error) {
      fetchEvidenceData(evidenceIdFromUrl);
    }
  }

  return (
    <div
      className={`h-full p-8 flex flex-col space-y-5 rounded-md ${
        evidenceDetails.isActive
          ? "bg-orange-50 border-2 border-orange-700"
          : "bg-gray-50 border-2 border-gray-400"
      }`}
    >
      {/* Evidence Details */}
      <div className="space-y-5">
        <p
          className={`font-sans font-[500] text-4xl ${
            evidenceDetails.isActive ? "text-orange-700" : "text-gray-600"
          }`}
        >
          {evidenceDetails.isActive ? "Evidence Details" : "Archived Evidence"}
        </p>
        <div className="p-4 rounded-sm font-mono font-semibold text-lg text-green-800 bg-green-50 border-2 border-green-700">
          <p>
            ID: <span className="text-orange-700">{evidenceDetails.id}</span>
          </p>
          <p>
            Description:{" "}
            <span className="text-orange-700">
              {evidenceDetails.description}
            </span>
          </p>
          <p>
            Creator:{" "}
            <span className="text-orange-700">
              {evidenceDetails.creator} :{" "}
              {formatTimestamp(evidenceDetails.timeOfCreation)}
            </span>
          </p>
          <p>
            {evidenceDetails.isActive ? "Current Owner: " : "Last Owner: "}
            <span className="text-orange-700">
              {evidenceDetails.currentOwner} :{" "}
              {formatTimestamp(
                evidenceDetails.chainOfCustody[
                  evidenceDetails.chainOfCustody.length - 1
                ].timestamp
              )}
            </span>
          </p>
        </div>
      </div>

      <div
        className={`grid gap-8
          ${
            evidenceDetails.isActive &&
            (evidenceDetails.creator.toLowerCase() == account ||
              evidenceDetails.currentOwner.toLowerCase() == account)
              ? "gap-8 grid grid-cols-[1.3fr_1fr]"
              : ""
          }`}
      >
        {/* Chain Of Custody*/}

        <div className="space-y-4">
          <p className="font-sans font-[500] text-3xl text-orange-700">
            Chain of Custody:
          </p>

          <nav
            className="rounded-t-sm border-2 border-orange-700 bg-orange-50 grid grid-cols-[1fr_1fr] font-mono font-[500] text-orange-900"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("list")}
              className={`py-2 px-3 ${
                activeTab === "list"
                  ? "bg-orange-500 font-[600] text-white"
                  : "hover:rounded-tl-xs hover:font-[600] hover:bg-orange-200"
              }`}
            >
              LIST VIEW
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-2 px-3 ${
                activeTab === "timeline"
                  ? "bg-orange-500 font-[600] text-white"
                  : "hover:rounded-tr-xs hover:font-[600] hover:bg-orange-200"
              }`}
            >
              TIMELINE VIEW
            </button>
          </nav>

          <div className="p-4 bg-green-50 rounded-b-sm border-2 border-green-700">
            {/* View Select Tabs*/}
            {activeTab === "list" ? (
              <ul className="space-y-1 list-decimal list-inside">
                {evidenceDetails.chainOfCustody.map((record, index) => {
                  return (
                    <li
                      key={index}
                      className="font-mono font-semibold text-md text-green-800"
                    >
                      <span className="text-orange-700">{record.owner}</span>{" "}
                      <span className="text-orange-700">
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div>
                {evidenceDetails.chainOfCustody.map((record, index) => {
                  const isLastItem =
                    index === evidenceDetails.chainOfCustody.length - 1;
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className="relative p-2 font-mono font-semibold rounded-sm border-2 border-orange-700 bg-orange-50 shadow-sm">
                        <h3 className="text-green-800">
                          {evidenceDetails.isActive
                            ? index === 0 && isLastItem
                              ? "Creator / Current Owner"
                              : index === 0
                              ? "Creator"
                              : isLastItem
                              ? "Current Owner"
                              : "Owned"
                            : index === 0 && isLastItem
                            ? "Creator / Last Owner"
                            : index === 0
                            ? "Creator"
                            : isLastItem
                            ? "Last Owner"
                            : "Owned"}
                        </h3>
                        <div className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 border-2 border-green-700 rounded-tr-md font-mono text-sm text-green-800">
                          {index + 1}
                        </div>
                        <time className="text-orange-900 block leading-none">
                          {formatTimestamp(record.timestamp)}
                        </time>
                        <p className="text-orange-900 break-all">
                          {record.owner}
                        </p>
                      </div>
                      {!isLastItem && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5 my-1 text-orange-800"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a.75.75 0 01.75.75v10.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3.75A.75.75 0 0110 3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Evidence Management */}
        {evidenceDetails.isActive && (
          <div className="space-y-4">
            {(account?.toLowerCase() ===
              evidenceDetails.currentOwner.toLowerCase() ||
              account?.toLowerCase() ===
                evidenceDetails.creator.toLowerCase()) && (
              <p className="font-sans font-[500] text-3xl text-orange-700">
                Evidence Management:
              </p>
            )}

            {/* Transfer Ownership*/}
            {account?.toLowerCase() ===
              evidenceDetails.currentOwner.toLowerCase() && (
              <TransferOwnershipForm
                evidenceContractAddress={
                  evidenceDetails.contractAddress as Address
                }
                isActive={evidenceDetails.isActive as boolean}
                currentOwner={evidenceDetails.currentOwner as Address}
                evidenceId={evidenceDetails.id as `0x${string}`}
                onTransferComplete={handleTransferComplete}
              />
            )}
            {/* Discontinue Evidence*/}
            {account?.toLowerCase() ===
              evidenceDetails.creator.toLowerCase() && (
              <DiscontinueEvidence
                evidenceContractAddress={
                  evidenceDetails.contractAddress as Address
                }
                evidenceId={evidenceDetails.id as `0x${string}`}
                isActive={evidenceDetails.isActive as boolean}
                creator={evidenceDetails.creator as Address}
                onDiscontinueEvidenceComplete={handleEvidenceDiscontinued}
              />
            )}
          </div>
        )}
      </div>

      {/* LOGS */}

      {transferResult?.hash && (
        <div className="p-2 text-sm text-green-700 bg-green-100 rounded">
          Ownership Transferred. Tx. Hash: {transferResult.hash}
        </div>
      )}
      {discontinueResult?.hash && (
        <div className="p-2 text-sm text-green-700 bg-green-100 rounded">
          Evidence is now Discontinued. Tx. Hash: {discontinueResult.hash}
        </div>
      )}
      {transferResult?.warning && (
        <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
          Warning: {transferResult.warning}
        </div>
      )}
      {discontinueResult?.warning && (
        <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
          Warning: {discontinueResult.warning}
        </div>
      )}
      {transferResult?.error && (
        <div className="p-2 text-sm text-red-700 bg-red-100 rounded">
          Error: {transferResult.error}
        </div>
      )}
      {discontinueResult?.error && (
        <div className="p-2 text-sm text-orange-700 bg-orange-100 rounded">
          Error: {discontinueResult.error}
        </div>
      )}
    </div>
  );
}
