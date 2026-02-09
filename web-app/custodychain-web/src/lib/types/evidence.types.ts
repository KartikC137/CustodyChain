import { AddressSchema, Bytes32Schema } from "./solidity.types";
import { z } from "zod";

export const BaseEvidenceSchema = z.object({
  id: Bytes32Schema,
  status: z.enum(["active", "discontinued"]),
  description: z.string(),
  creator: AddressSchema,
  currentOwner: AddressSchema,
  createdAt: z.coerce.bigint(),
  transferredAt: z.coerce.bigint(),
  discontinuedAt: z.coerce.bigint().nullable().optional(),
});

export const EvidenceSummarySchema = BaseEvidenceSchema.extend({
  source: z.enum(["DB", "BLOCKCHAIN"]),
});

export const CustodyRecordSchema = z.object({
  owner: AddressSchema,
  timestamp: z.coerce.bigint(),
});

export const EvidenceDetailsSchema = BaseEvidenceSchema.extend({
  contractAddress: AddressSchema,
  chainOfCustody: z.array(CustodyRecordSchema),
});

export type EvidenceSummaryType = z.infer<typeof EvidenceSummarySchema>;
export type CustodyRecord = z.infer<typeof CustodyRecordSchema>;
export type EvidenceDetails = z.infer<typeof EvidenceDetailsSchema>;
