"use client";

import useFetchSingleEvidence from "@/src/context-and-hooks/useFetchSingleEvidence";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { Bytes32 } from "@/src/lib/types/solidity.types";
import EvidenceSummary from "./components/Summary";
import ChainOfCustodyViewer from "./components/ChainOfCustodyViewer";
import EvidenceManager from "./components/EvidenceManager";
import EvidenceContentSkeleton from "@/src/components/skeletons/EvidenceContentSkeleton";

export default function EvidenceDetails({
  evidenceId,
}: {
  evidenceId: Bytes32;
}) {
  const { account } = useWeb3();
  const { dataSource, isLoading, error, evidenceDetails, fetchEvidenceData } =
    useFetchSingleEvidence(evidenceId);

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

  function handleUpdateSuccess(success: boolean) {
    if (success) fetchEvidenceData(evidenceId);
  }

  return (
    <div className="space-y-4 px-8 pt-8">
      <EvidenceSummary
        source={dataSource}
        id={evidenceDetails.id}
        status={evidenceDetails.status}
        description={evidenceDetails.description}
        creator={evidenceDetails.creator}
        currentOwner={evidenceDetails.currentOwner}
        createdAt={evidenceDetails.createdAt}
        transferredAt={evidenceDetails.transferredAt}
        discontinuedAt={evidenceDetails.discontinuedAt}
      />
      <div
        className={`grid gap-8
          ${
            evidenceDetails.status === "active" &&
            (evidenceDetails.creator.toLowerCase() === account ||
              evidenceDetails.currentOwner.toLowerCase() === account)
              ? "grid-cols-[1.3fr_1fr]"
              : "h-140"
          }`}
      >
        <ChainOfCustodyViewer
          chainOfCustody={evidenceDetails.chainOfCustody}
          status={evidenceDetails.status}
        />
        {evidenceDetails.status === "active" && (
          <EvidenceManager
            id={evidenceDetails.id}
            currentAccount={account}
            contractAddress={evidenceDetails.contractAddress}
            status={evidenceDetails.status}
            creator={evidenceDetails.creator}
            currentOwner={evidenceDetails.currentOwner}
            onManagementSuccess={handleUpdateSuccess}
          />
        )}
      </div>
    </div>
  );
}
