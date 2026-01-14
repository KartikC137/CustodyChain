import { Address, Bytes32 } from "@/lib/types/solidity.types";
import DiscontinueEvidence from "@/app/evidence/components/evidence-management/DiscontinueEvidenceForm";
import TransferOwnershipForm from "@/app/evidence/components/evidence-management/TransferOwnershipForm";

export interface EvidenceManagementResult {
  hash?: string;
  warning?: string;
  error?: string;
}

interface EvidenceManagerProps {
  id: Bytes32;
  contractAddress: Address;
  currentAccount: Address;
  creator: Address;
  currentOwner: Address;
  isActive: boolean;
  onChange: (result: EvidenceManagementResult) => void;
}

export default function EvidenceManager({
  id,
  contractAddress,
  currentAccount,
  creator,
  currentOwner,
  isActive,
  onChange,
}: EvidenceManagerProps) {
  function handleTransferComplete(result: EvidenceManagementResult) {
    onChange(result);
  }

  function handleEvidenceDiscontinued(result: EvidenceManagementResult) {
    onChange(result);
  }
  return (
    <div className="space-y-4">
      {(currentAccount.toLowerCase() === currentOwner.toLowerCase() ||
        currentAccount.toLowerCase() === creator.toLowerCase()) && (
        <p className="font-sans font-[500] text-3xl text-orange-700">
          Evidence Management:
        </p>
      )}

      {currentAccount.toLowerCase() === currentOwner.toLowerCase() && (
        <TransferOwnershipForm
          contractAddress={contractAddress}
          isActive={isActive as boolean}
          currentOwner={currentOwner as Address}
          evidenceId={id as `0x${string}`}
          onTransferComplete={handleTransferComplete}
        />
      )}

      {currentAccount.toLowerCase() === creator.toLowerCase() && (
        <DiscontinueEvidence
          contractAddress={contractAddress as Address}
          evidenceId={id as `0x${string}`}
          isActive={isActive as boolean}
          creator={creator as Address}
          onDiscontinueEvidenceComplete={handleEvidenceDiscontinued}
        />
      )}
    </div>
  );
}
