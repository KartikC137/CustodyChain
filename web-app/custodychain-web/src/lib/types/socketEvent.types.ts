import { z } from "zod";
import { AddressSchema, Bytes32Schema } from "./solidity.types";
import { BaseEvidenceSchema } from "./evidence.types";

/**
 * @dev 1. socket emits cannot handle bigint, the createdAt and updatedAt are strings.
 *      2. Adds one more
 */

const BaseSocketUpdateSchema = z.object({
  activityId: z.string(),
  type: z.enum(["create", "transfer", "discontinue"]),
  actor: AddressSchema,
  txHash: Bytes32Schema.nullable(),
  updatedAt: z.coerce.date(),
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
  evidence: BaseEvidenceSchema,
});

export const SocketUpdateSchema = z.union([FailedVariant, ValidVariant]);

export type SocketEvidenceDetails = z.infer<typeof BaseEvidenceSchema>;
export type SocketUpdateType = z.infer<typeof SocketUpdateSchema>;
