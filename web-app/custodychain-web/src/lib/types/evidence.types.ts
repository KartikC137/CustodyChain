import { AddressSchema, Bytes32Schema } from "./solidity.types";
import { z } from "zod";

/**
 * @notice types below are for formatted data i.e
 *         i. if status = active then isActive is true and vice versa
 *         ii. DB returns data of different type, collated by parseChainOfCustody utility func.
 */

const BaseEvidenceSchema = z.object({
  id: Bytes32Schema,
  isActive: z.boolean(),
  description: z.string(),
  creator: AddressSchema,
  timeOfCreation: z.bigint(),
  currentOwner: AddressSchema,
});

export const EvidenceSummarySchema = BaseEvidenceSchema.extend({
  source: z.enum(["DB", "BLOCKCHAIN"]),
  currentOwnerTime: z.bigint(),
  timeOfDiscontinuation: z.bigint(),
});

export const CustodyRecordSchema = z.object({
  owner: AddressSchema,
  timestamp: z.bigint(),
});

export const EvidenceDetailsSchema = BaseEvidenceSchema.extend({
  contractAddress: AddressSchema,
  chainOfCustody: z.array(CustodyRecordSchema),
  timeOfDiscontinuation: z.bigint(),
});

export type EvidenceSummaryType = z.infer<typeof EvidenceSummarySchema>;
export type CustodyRecord = z.infer<typeof CustodyRecordSchema>;
export type EvidenceDetails = z.infer<typeof EvidenceDetailsSchema>;

// Raw DB data
export const EvidenceStatusSchema = z.enum(["active", "discontinued"]);
export type EvidenceStatusType = z.infer<typeof EvidenceStatusSchema>;
