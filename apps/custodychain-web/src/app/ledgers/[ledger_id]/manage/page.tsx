"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminGuard from "@/src/components/features/ledger-details/LedgerAdminGuard";
import LedgerManagerHeader from "@/src/components/features/ledger-details/LedgerManagerHeader";
import LedgerRolesPendingQueue from "@/src/components/features/ledger-details/LedgerRolesPendingQueue";
import { fetchActiveRoles } from "@/src/api/ledgers/fetchRoles";
import { useLedger } from "@/src/context-and-hooks/LedgerContext";
import {
  ActiveRoles,
  InputSelectedRoles,
  ParsedSelectedRoles,
  PendingRole,
} from "@/src/lib/types/ledger.types";
import LedgerRolesTable from "@/src/components/features/ledger-details/LedgerRolesTable";
import { useWallet } from "@/src/context-and-hooks/WalletContext";
import { insertPendingRoles } from "@/src/api/ledgers/insertPendingRoles";
import { evidenceLedgerAbi } from "@/src/lib/contracts/evidence-ledger-abi";
import { encodeFunctionData } from "viem";
import AddAccountRoleForm from "@/src/components/features/forms/AddAccountRoleForm";
import { getSocket } from "@/src/configs/socketConfig";

export default function ManageLedgerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { ledgerAddress, ledgerName, ledgerChainId, ledgerIdDb } = useLedger();
  const { walletClient, chain, account } = useWallet();

  const isEditMode = searchParams.get("edit") === "1";

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeRoles, setActiveRoles] = useState<ActiveRoles[]>([]);
  const [pendingQueue, setPendingQueue] = useState<InputSelectedRoles>([]);
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await fetchActiveRoles(ledgerIdDb);
        setActiveRoles(roles);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, [ledgerIdDb, refreshTrigger]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("roles_update", (data) => {
      console.log("Roles updated on chain! Hash:", data.txHash);
      setRefreshTrigger((prev) => prev + 1);
      setPendingQueue([]);
    });

    return () => {
      socket.off("roles_update");
    };
  }, []);

  const toggleEditMode = (enableEdit: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (enableEdit) params.set("edit", "1");
    else params.delete("edit");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const addRoleToQueue = (newRole: PendingRole) => {
    setPendingQueue((prev) => {
      const alreadyExists = prev.some(
        (r) =>
          r.account === newRole.account &&
          r.role === newRole.role &&
          r.action === newRole.action,
      );
      if (alreadyExists) return prev;

      const activeAccount = activeRoles.find(
        (r) => r.account === newRole.account,
      );
      const hasRoleInDb = activeAccount?.roles.some(
        (r) => r.role === newRole.role,
      );
      if (newRole.action === "grant" && hasRoleInDb) {
        // Optional: Trigger a toast notification here instead of console.log
        console.warn("Rejected: Account already holds this active role.");
        return prev;
      }

      if (newRole.action === "revoke" && !hasRoleInDb) {
        console.warn(
          "Rejected: Cannot revoke a role the account does not possess.",
        );
        return prev;
      }
      return [...prev, newRole];
    });
  };

  const removeRoleFromQueue = (role: PendingRole) => {
    setPendingQueue((prev) =>
      prev.filter(
        (item) =>
          item.account !== role.account ||
          item.role !== role.role ||
          item.action !== role.action,
      ),
    );
  };

  const submitAllRoles = async (roles: ParsedSelectedRoles) => {
    if (!walletClient) return;

    try {
      setIsSubmitLoading(true);

      const { granted, revoked } = roles;
      const grantCalls = granted.map((args) =>
        encodeFunctionData({
          abi: evidenceLedgerAbi,
          functionName: "grantRoles",
          args,
        }),
      );

      const revokedCalls = revoked.map((args) =>
        encodeFunctionData({
          abi: evidenceLedgerAbi,
          functionName: "revokeRoles",
          args,
        }),
      );

      const txHash = await walletClient.writeContract({
        address: ledgerAddress,
        chain: chain,
        abi: evidenceLedgerAbi,
        functionName: "multicall",
        args: [[...grantCalls, ...revokedCalls]],
        account,
      });
      await insertPendingRoles(txHash, ledgerIdDb, pendingQueue);
    } catch (err) {
      console.error("grant roles failed", err);
      throw new Error("grant roles failed");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-y-hidden font-sans bg-orange-50">
      <AdminGuard>
        <LedgerManagerHeader
          ledgerAddress={ledgerAddress}
          ledgerName={ledgerName}
          ledgerChainId={ledgerChainId}
          isEditMode={isEditMode}
          onToggleEdit={toggleEditMode}
        />
        <div
          className={`px-2 py-5 grid ${isEditMode ? "grid-cols-[7fr_2.5fr]" : "grid-cols-1"} gap-x-2`}
        >
          <div className={`max-h-210 flex flex-col gap-y-2`}>
            {isEditMode && <AddAccountRoleForm onAddAccount={addRoleToQueue} />}
            <div className="overflow-y-scroll rounded-b-lg border-2 border-orange-700">
              <LedgerRolesTable
                isEditMode={isEditMode}
                currentRoles={activeRoles}
                pendingRoles={pendingQueue}
                onAddRoleToQueue={addRoleToQueue}
                onRemoveRoleFromQueue={removeRoleFromQueue}
                onNavigateToEditMode={toggleEditMode}
              />
            </div>
          </div>

          {isEditMode && (
            <div className="flex flex-col rounded-lg border-2 text-orange-700">
              <p className="p-2 rounded-t-md bg-orange-500 text-orange-50 text-3xl font-[500]">
                Pending Roles Queue:
              </p>
              <div className="overflow-y-scroll h-full max-h-215 flex flex-col justify-between px-2 py-2">
                <LedgerRolesPendingQueue
                  isSubmitting={isSubmitLoading}
                  pendingRoles={pendingQueue}
                  onRemoveRoleFromQueue={removeRoleFromQueue}
                  onSubmitAllRoles={submitAllRoles}
                />
              </div>
            </div>
          )}
        </div>
      </AdminGuard>
    </main>
  );
}
