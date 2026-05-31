"use server";

import { query } from "@/src/configs/dbConfig";
import {
  InputPendingRoleSchema,
  InputSelectedRoles,
} from "@/src/lib/types/ledger.types";
import { Bytes32 } from "@/src/lib/types/solidity.types";

/**
 * @todo add param for action
 * @param ledgerIdDb id of ledger in db
 * @param accountIdDb id of account in db
 */
export async function insertPendingRoles(
  txHash: Bytes32,
  ledgerIdDb: number,
  roles: InputSelectedRoles,
) {
  const parsed = InputPendingRoleSchema.safeParse(roles);
  if (!parsed.success)
    throw new Error("insertPendingRole error: invalid roles");

  const role = parsed.data.map((i) => i.role);
  const account = parsed.data.map((i) => i.account);
  const action = parsed.data.map((i) => i.action);

  try {
    await query(
      `INSERT INTO ledger_roles (
        ledger_id,
        account,
        role,
        action,
        tx_hash,
        status,
        updated_at
      )      
      SELECT 
        $1::int,           
        u.acc,
        u.r,
        u.a,
        $5::bytes32,
        'pending'::ledger_role_status_t,
        now()
      FROM unnest($2::eth_address[], $3::ledger_roles_t[], $4::ledger_role_action_t[]) AS u(acc, r, a)
      ON CONFLICT (ledger_id, tx_hash, account, role, action) DO NOTHING`,
      [ledgerIdDb, account, role, action, txHash],
    );
  } catch (err) {
    console.error("insertPendingRole: couldn't insert ledger into DB", err);
    throw new Error(`insert pending roles: db error`);
  }
}
