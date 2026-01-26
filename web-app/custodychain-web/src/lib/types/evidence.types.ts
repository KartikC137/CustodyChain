import {
  Address,
  AddressSchema,
  Bytes32,
  Bytes32Schema,
} from "./solidity.types";
import { z } from "zod";

export type StatusFilter = "all" | "active" | "discontinued";
export type RoleFilter = "all" | "created" | "owned";

/**
 * @notice types below are for formatted data i.e
 *         i. if status = active then isActive is true and vice vers
 *         ii. DB returns data of different type, collated by parseChainOfCustody utility func.
 */

const BaseEvidenceSchema = z.object({
  id: Bytes32Schema,
  isActive: z.boolean(),
  description: z.string(),
  creator: AddressSchema,
  timeOfCreation: z.date(),
  currentOwner: AddressSchema,
});

export const EvidenceSummarySchema = BaseEvidenceSchema.extend({
  source: z.enum(["DB", "BLOCKCHAIN"]),
  currentOwnerTime: z.date(),
  timeOfDiscontinuation: z.date(),
});

export const CustodyRecordSchema = z.object({
  owner: AddressSchema,
  timestamp: z.date(),
});

export const EvidenceDetailsSchema = BaseEvidenceSchema.extend({
  contractAddress: AddressSchema,
  chainOfCustody: z.array(CustodyRecordSchema),
  timeOfDiscontinuation: z.date(),
});

export type EvidenceSummaryType = z.infer<typeof EvidenceSummarySchema>;
export type CustodyRecord = z.infer<typeof CustodyRecordSchema>;
export type EvidenceDetails = z.infer<typeof EvidenceDetailsSchema>;

// Raw DB data
export const EvidenceStatusSchema = z.enum(["active", "discontinued"]);
export type EvidenceStatusType = z.infer<typeof EvidenceStatusSchema>;

export interface EvidenceRow {
  evidence_id: Bytes32;
  status: EvidenceStatusType;
  description: string;
  creator: Address;
  created_at: Date;
  current_owner: Address;
  updated_at: Date;
}
