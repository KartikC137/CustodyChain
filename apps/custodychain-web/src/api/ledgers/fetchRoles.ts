"use server";

import { query } from "@/src/configs/dbConfig";
import {
  DbLedgerRole,
  ActiveRoles,
  DbRoleFlags,
} from "@/src/lib/types/ledger.types";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";

export async function fetchRolesForAccount(
  account: Address,
  ledgerIdDb: number,
): Promise<DbRoleFlags> {
  const flags: DbRoleFlags = {
    c: false,
    t: false,
    r: false,
  };

  const result = await query(
    `
    SELECT role 
    FROM ledger_roles 
    WHERE account = $1 AND ledger_id = $2;
    `,
    [account, ledgerIdDb],
  );

  for (const row of result.rows) {
    const activeRole = row.role as DbLedgerRole;

    if (activeRole in flags) {
      flags[activeRole] = true;
    }
  }

  return flags;
}

export async function fetchRolesForLedger(ledgerIdDb: number) {
  const result = await query(
    `
    SELECT
    account,
    role,
    updated_at as "updatedAt",
    action,
    status
    FROM ledger_roles
    WHERE ledger_id = $1
    ORDER BY updated_at DESC
    `,
    [ledgerIdDb],
  );
  return result.rows;
}

export async function fetchActiveRoles(
  ledgerIdDb: number,
): Promise<ActiveRoles[]> {
  const result = await query(
    `
      WITH LatestActions AS (
      SELECT DISTINCT ON (account, role)
        account,
        role,
        action,
        updated_at
      FROM ledger_roles
      WHERE ledger_id = $1 AND status = 'success'
      ORDER BY account, role, id DESC
      ),
      LatestAccountUpdates AS (
        SELECT 
          account,
          role,
          action,
          updated_at,
          MAX(updated_at) OVER (PARTITION BY account) as latest_account_update
        FROM LatestActions
      ),
      ActiveRoles AS (
      SELECT 
        account,
        role,
        updated_at,
        latest_account_update
      FROM LatestAccountUpdates 
      WHERE action = 'grant'
      )
      SELECT 
        account,
        json_agg(
          json_build_object(
            'role', role,
            'grantedOn', updated_at
          )
        ) AS roles,
        latest_account_update AS "updatedAt"
      FROM ActiveRoles
      GROUP BY account, latest_account_update
      ORDER BY "updatedAt" DESC 
    `,
    [ledgerIdDb],
  );
  return result.rows as ActiveRoles[];
}
