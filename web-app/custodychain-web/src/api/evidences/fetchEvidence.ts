"use server";

import { query } from "@/src/config/db";
import { EvidenceDetails, EvidenceRow } from "@/src/lib/types/evidence.types";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";
import { parseChainOfCustody } from "@/src/lib/util/helpers";
import { StatusFilter, RoleFilter } from "@/src/lib/types/evidence.types";

/**
 * @returns Formatted data from db of type EvidenceDetails
 */
export async function fetchSingleEvidence(
  id: Bytes32,
): Promise<EvidenceDetails> {
  const result = await query(
    `
    SELECT contract_address, creator, created_at, current_owner, description, chain_of_custody, status, discontinued_at 
    FROM evidence
    WHERE evidence_id = $1
    `,
    [id],
  );
  const resultRow = result.rows[0];
  return {
    id: id,
    contractAddress: resultRow.contract_address,
    creator: resultRow.creator,
    timeOfCreation: resultRow.created_at,
    currentOwner: resultRow.current_owner,
    description: resultRow.description,
    chainOfCustody: parseChainOfCustody(resultRow.chain_of_custody),
    isActive: resultRow.status === "active" ? true : false,
    timeOfDiscontinuation: resultRow.discontinued_at,
  };
}

/**
 *
 * @param account
 * @param statusFilter i. active: evidences active only,
 *                     ii. owned: evidences discontinued/archived only,
 *                     iii. all: active or discontinued
 * @param roleFilter i. created: evidences created by account, initially creator == current_owner.
 *                   ii. owned: evidences owned by account, initially creator == current_owner.
 *                   iii. all: evidences either owned or created. (all the evidences this account is involved in)
 * @returns array of evidence details
 */
export async function fetchEvidencesByFilter(
  account: Address,
  status: StatusFilter = "all",
  role: RoleFilter = "all",
): Promise<EvidenceRow[]> {
  const formattedAccount = account.toLowerCase();

  let sql = `
    SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
    FROM evidence
    WHERE
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (status !== "all") {
    sql += ` status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  } else {
    sql += ` (status = 'active' OR status = 'discontinued')`;
  }

  if (role === "created") {
    sql += ` AND creator = $${paramIndex}`;
    params.push(formattedAccount);
  } else if (role === "owned") {
    sql += ` AND current_owner = $${paramIndex}`;
    params.push(formattedAccount);
  } else {
    sql += ` AND (creator = $${paramIndex} OR current_owner = $${paramIndex})`;
    params.push(formattedAccount);
  }

  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching evidences:", error);
    throw new Error("Failed to fetch evidences");
  }
}

export async function fetchEvidencesByAccount(
  account: Address,
): Promise<EvidenceRow[]> {
  const result = await query(
    `
     SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
     FROM evidence
     WHERE creator = $1 OR current_owner = $1
    `,
    [account.toLowerCase()],
  );
  return result.rows;
}
