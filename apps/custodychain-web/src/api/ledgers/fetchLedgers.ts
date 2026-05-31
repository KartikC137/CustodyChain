"use server";

import { query } from "@/src/configs/dbConfig";
import { LedgerId } from "@/src/lib/types/ledger.types";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";

export async function fetchLedgersByCreator(account: Address): Promise<any[]> {
  const result = await query(
    `
    SELECT 
      deployed_tx_hash AS "txHash",
      status, 
      creator, 
      name,
      address,
      created_at AS "createdAt",
      ledger_id AS "id" 
    FROM ledger_info 
    WHERE creator = $1
    ORDER BY created_at DESC
    `,
    [account.toLowerCase()],
  );
  return result.rows;
}

export async function fetchLedgerById(ledgerId: LedgerId): Promise<any> {
  const result = await query(
    `
    SELECT 
      name,
      deployed_tx_hash AS "txHash",
      status, 
      creator, 
      id AS "dbId",
      address
    FROM ledger_info 
    WHERE ledger_id = $1
    ORDER BY created_at DESC
    `,
    [ledgerId],
  );
  return result.rows[0];
}
