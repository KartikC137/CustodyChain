import { z } from "zod";
import { AddressSchema, Bytes32Schema } from "./solidity.types";

/**
 * @dev socket emits cannot handle bigint, the createdAt and updatedAt are strings.
 */
const SocketEvidenceDetailsSchema = z.object({
  id: Bytes32Schema,
  status: z.enum(["active", "discontinued"]),
  description: z.string(),
  creator: AddressSchema,
  createdAt: z.string(),
  currentOwner: AddressSchema,
});

const BaseSocketUpdateSchema = z.object({
  activityId: z.string(),
  type: z.enum(["create", "transfer", "discontinue"]),
  actor: AddressSchema,
  txHash: Bytes32Schema.nullable(),
  updatedAt: z.string(),
});

const FailedVariant = BaseSocketUpdateSchema.extend({
  status: z.literal("failed"),
  evidenceId: Bytes32Schema,
  error: z.unknown().transform((val) => {
    if (val instanceof Error) return val.message;
    if (typeof val === "string") return val;
    return JSON.stringify(val);
  }),
});

const ValidVariant = BaseSocketUpdateSchema.extend({
  status: z.literal("client_only"),
  evidence: SocketEvidenceDetailsSchema,
});

export const SocketUpdateSchema = z.union([FailedVariant, ValidVariant]);

export type SocketEvidenceDetails = z.infer<typeof SocketEvidenceDetailsSchema>;
export type SocketUpdateType = z.infer<typeof SocketUpdateSchema>;
