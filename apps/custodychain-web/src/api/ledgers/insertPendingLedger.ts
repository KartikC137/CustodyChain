"use server";

import { query } from "@/src/configs/dbConfig";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";

export async function insertPendingLedger(
  txhash: Bytes32,
  chainId: number,
  creator: Address,
  name: string,
) {
  try {
    await query(
      `INSERT INTO ledger_info (
        deployed_tx_hash, 
        status, 
        chain_id,
        creator,
        name
       ) 
        VALUES ($1, 'pending', $2, $3, $4) 
        ON CONFLICT DO NOTHING`,
      [txhash.toLowerCase(), chainId, creator.toLowerCase(), name],
    );
    console.log("insertPendingLedger: success");
  } catch (err) {
    console.error("insertPendingLedger: couldn't insert ledger into DB", err);
    throw new Error(`insert pending client activity: db error`);
  }
}
