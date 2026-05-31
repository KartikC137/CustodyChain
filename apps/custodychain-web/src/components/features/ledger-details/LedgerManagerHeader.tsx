import { Address } from "@/src/lib/types/solidity.types";
import { supportedChains } from "@/src/lib/util/supportedChains";

interface LedgerRolesEditSwitchProps {
  ledgerAddress: Address;
  ledgerName: string;
  ledgerChainId: number;
  isEditMode: boolean;
  onToggleEdit: (enableEdit: boolean) => void;
}

export default function LedgerManagerHeader({
  ledgerAddress,
  ledgerName,
  ledgerChainId,
  isEditMode,
  onToggleEdit,
}: LedgerRolesEditSwitchProps) {
  return (
    <div className="flex flex-row gap-x-5 justify-between pl-10 pr-5 py-5 bg-orange-100 rounded-b-sm shadow-xl shadow-orange-500/20">
      <div className="font-[600]">
        <p className="text-5xl text-orange-800">{ledgerName}</p>
        <p className="text-2xl text-green-800">
          {" "}
          {supportedChains[ledgerChainId].name}({ledgerChainId}) @{" "}
          {ledgerAddress}
        </p>
      </div>
      <nav
        className="min-w-200 h-12 grid grid-cols-[1fr_1fr] rounded-sm border-2 border-orange-700 bg-orange-50 font-mono font-[500] text-orange-900"
        aria-label="Tabs"
      >
        <button
          onClick={() => onToggleEdit(false)}
          type="button"
          className={`py-2 px-3 ${
            !isEditMode
              ? "bg-orange-500 font-[600] text-white"
              : "hover:rounded-tl-xs hover:font-[600] hover:bg-orange-100"
          }`}
        >
          VIEW ROLES
        </button>
        <button
          onClick={() => onToggleEdit(true)}
          type="button"
          className={`py-2 px-3 ${
            isEditMode
              ? "bg-orange-700 font-[600] text-white"
              : "hover:rounded-tr-xs hover:font-[600] hover:bg-orange-100"
          }`}
        >
          EDIT ROLES
        </button>
      </nav>
    </div>
  );
}
