"use server";

import { query } from "@/src/config/db";
import { EvidenceDetails } from "@/src/lib/types/evidence.types";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";
import { parseChainOfCustody } from "@/src/lib/util/helpers";
import {
  primaryFilterType,
  secondaryFilterType,
} from "@/src/lib/types/evidence.types";

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

export async function fetchEvidencesByFilter(
  account: Address,
  primaryFilter: "all" | "active" | "discontinued",
  secondaryFilter: "all" | "created" | "owned",
): Promise<any[]> {
  if (primaryFilter === "all" && secondaryFilter === "all") {
    return await _fetchAllEvidences(account, "all");
  } else {
    if (secondaryFilter === "created") {
      return await _fetchCreatedEvidences(account, primaryFilter);
    } else if (secondaryFilter === "owned") {
      return await _fetchOwnedEvidences(account, primaryFilter);
    } else if (secondaryFilter === "all") {
      return _fetchAllEvidences(account, primaryFilter);
    } else {
      return [];
    }
  }
}

async function _fetchCreatedEvidences(
  creator: Address,
  status: primaryFilterType,
) {
  if (status === "all") {
    const result = await query(
      `
    SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
    FROM evidence
    WHERE (status = 'active' OR status = 'discontinued') AND creator = $1
    `,
      [creator.toLowerCase()],
    );
    return result.rows;
  } else {
    const result = await query(
      `
    SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
    FROM evidence
    WHERE status = $1 AND creator = $2
    `,
      [status, creator.toLowerCase()],
    );
    return result.rows;
  }
}

async function _fetchOwnedEvidences(
  currentOwner: Address,
  status: primaryFilterType,
) {
  if (status === "all") {
    const result = await query(
      `
    SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
    FROM evidence
    WHERE (status = 'active' OR status = 'discontinued') AND (current_owner = $1 AND creator != $1)
    `,
      [currentOwner.toLowerCase()],
    );
    return result.rows;
  } else {
    const result = await query(
      `
    SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
    FROM evidence
    WHERE status = $1 AND (current_owner = $2 AND creator != $2)
    `,
      [status, currentOwner.toLowerCase()],
    );
    return result.rows;
  }
}

async function _fetchAllEvidences(account: Address, status: primaryFilterType) {
  if (status === "all") {
    const result = await query(
      `
    SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
    FROM evidence
    WHERE (creator = $1 OR current_owner = $1) AND (status = 'active' OR status = 'discontinued')
    `,
      [account.toLowerCase()],
    );
    return result.rows;
  } else {
    const result = await query(
      `
    SELECT evidence_id, status, description, creator, created_at, current_owner, updated_at
    FROM evidence
    WHERE (creator = $1 OR current_owner = $1) AND status = $2
    `,
      [account.toLowerCase(), status],
    );
    return result.rows;
  }
}
