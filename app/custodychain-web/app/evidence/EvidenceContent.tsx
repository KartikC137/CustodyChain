"use client";

import useFetchEvidence from "../components/web3/FetchEvidence";
import { useWeb3 } from "../contexts/web3/Web3Context";
import { Bytes32 } from "@/lib/types/solidity.types";
import { EvidenceManagementResult } from "./components/EvidenceManager";
import EvidenceSummary from "./components/Summary";
import ChainOfCustodyViewer from "./components/ChainOfCustodyViewer";
import EvidenceManager from "./components/EvidenceManager";
import EvidenceContentSkeleton from "@/lib/skeletons/EvidenceContentSkeleton";

export default function EvidenceContent({
  evidenceId,
}: {
  evidenceId: Bytes32;
}) {
  const { account } = useWeb3();
  const { isLoading, error, evidenceDetails, fetchEvidenceData } =
    useFetchEvidence(evidenceId);

  if (isLoading) {
    return <EvidenceContentSkeleton />;
  }

  if (!account) {
    return (
      <div className="font-mono text-center text-xl text-red-500">
        Connect Your Wallet to view Evidence
      </div>
    );
  }

  if (error || !evidenceDetails) {
    return (
      <div className="font-mono text-center text-xl text-red-500">{error}</div>
    );
  }

  function handleEvidenceManagementResult(result: EvidenceManagementResult) {
    if (!result.error) fetchEvidenceData(evidenceId);
  }

  return (
    <div className="space-y-4">
      <EvidenceSummary
        id={evidenceDetails.id}
        isActive={evidenceDetails.isActive}
        description={evidenceDetails.description}
        creator={evidenceDetails.creator}
        timeOfCreation={evidenceDetails.timeOfCreation}
        currentOwner={evidenceDetails.currentOwner}
        currentOwnerTime={
          evidenceDetails.chainOfCustody[
            evidenceDetails.chainOfCustody.length - 1
          ].timestamp
        }
      />
      <div
        className={`grid gap-8
          ${
            evidenceDetails.isActive &&
            (evidenceDetails.creator.toLowerCase() === account ||
              evidenceDetails.currentOwner.toLowerCase() === account)
              ? "grid-cols-[1.3fr_1fr]"
              : "h-140"
          }`}
      >
        <ChainOfCustodyViewer
          chainOfCustody={evidenceDetails.chainOfCustody}
          isActive={evidenceDetails.isActive}
        />
        {evidenceDetails.isActive && (
          <EvidenceManager
            id={evidenceDetails.id}
            currentAccount={account}
            contractAddress={evidenceDetails.contractAddress}
            isActive={evidenceDetails.isActive}
            creator={evidenceDetails.creator}
            currentOwner={evidenceDetails.currentOwner}
            onChange={handleEvidenceManagementResult}
          />
        )}
      </div>

      {/* LOGS */}

      {/* {transferResult?.hash && (
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
      )} */}
    </div>
  );
}
