import { Address, Bytes32 } from "@/src/lib/types/solidity.types";
import DiscontinueEvidence from "@/src/components/features/forms/DiscontinueEvidenceForm";
import TransferOwnershipForm from "@/src/components/features/forms/TransferOwnershipForm";

interface EvidenceManagerProps {
  id: Bytes32;
  contractAddress: Address;
  currentAccount: Address;
  creator: Address;
  currentOwner: Address;
  isActive: boolean;
  onManagementSuccess: (success: boolean) => void;
}

export default function EvidenceManager({
  id,
  contractAddress,
  currentAccount,
  creator,
  currentOwner,
  isActive,
  onManagementSuccess,
}: EvidenceManagerProps) {
  function handleFormSuccess(success: boolean) {
    onManagementSuccess(success);
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
          creator={creator}
          contractAddress={contractAddress}
          isActive={isActive as boolean}
          currentOwner={currentOwner as Address}
          evidenceId={id as `0x${string}`}
          onTransferFormSuccess={handleFormSuccess}
        />
      )}

      {currentAccount.toLowerCase() === creator.toLowerCase() && (
        <DiscontinueEvidence
          contractAddress={contractAddress as Address}
          evidenceId={id as `0x${string}`}
          isActive={isActive as boolean}
          creator={creator as Address}
          onDiscontinueFormSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
