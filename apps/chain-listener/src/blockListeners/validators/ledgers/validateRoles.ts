import { parseEventLogs } from "viem";
import { getIO } from "../../../configs/socketConfig";
import { getPublicClient } from "../../../configs/web3Config";
import {
  event_LedgerRoleGranted,
  event_LedgerRoleRevoked,
} from "../../../lib/abi/evidence-ledger-abi";
import {
  PendingRolesDbPayload,
  PendingRolesDbPayloadSchema,
  RoleUpdates,
} from "../../../lib/types/ledger.types";
import { query } from "../../../configs/dbConfig";

export async function validateRoles(data: PendingRolesDbPayload) {
  const io = getIO();
  const parsed = PendingRolesDbPayloadSchema.safeParse(data);
  if (!parsed.success) throw new Error("validateRoles: invalid db payload");
  const { admin, txHash, granted, revoked, chainId } = parsed.data;
  const publicClient = getPublicClient(chainId);

  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 10_000,
    });

    if (receipt.status === "reverted") {
      const failedGrants = granted.map((g) => ({
        id: g.id,
        status: "failed",
      })) as RoleUpdates[];
      const failedRevokes = revoked.map((r) => ({
        id: r.id,
        status: "failed",
      })) as RoleUpdates[];
      await updateRoles([...failedGrants, ...failedRevokes]);
      return;
    }

    const updates: RoleUpdates[] = [];

    if (granted.length > 0) {
      const eventLogs = parseEventLogs({
        abi: event_LedgerRoleGranted,
        logs: receipt.logs,
        eventName: "RoleGranted",
      });
      granted.forEach((g) => {
        const isSuccess = eventLogs.some(
          (event) =>
            event.args.role === g.role &&
            event.args.account.toLowerCase() === g.account,
        );
        updates.push({
          id: g.id,
          status: isSuccess ? "success" : "failed",
        });
      });
    }

    if (revoked.length > 0) {
      const revokedEvents = parseEventLogs({
        abi: event_LedgerRoleRevoked,
        logs: receipt.logs,
        eventName: "RoleRevoked",
      });

      revoked.forEach((r) => {
        const isSuccess = revokedEvents.some(
          (event) =>
            event.args.role === r.role &&
            event.args.account.toLowerCase() === r.account,
        );
        updates.push({ id: r.id, status: isSuccess ? "success" : "failed" });
      });
    }

    await updateRoles(updates);
  } catch (err) {
    console.error("validateRoles: couldn't update roles", err);
  } finally {
    console.log("roles update socket event sent to: ", admin, "tx.: ", txHash);
    io.to(admin).emit("roles_update", {
      txHash: txHash,
    });
  }
}

async function updateRoles(updates: RoleUpdates[]) {
  if (updates.length === 0) return;
  const ids = updates.map((i) => i.id);
  const statuses = updates.map((i) => i.status);
  await query(
    `
    UPDATE ledger_roles AS lr
    SET status = u.status
    FROM unnest($1::int[], $2::ledger_role_status_t[]) AS u(id, status)
    WHERE lr.id = u.id
    `,
    [ids, statuses],
  );
}
