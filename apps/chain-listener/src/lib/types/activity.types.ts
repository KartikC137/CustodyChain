import { z } from "zod";
import { AddressSchema, Bytes32Schema } from "./solidity.types";

export const ActivityTypeSchema = z.enum(["create", "transfer", "discontinue"]);
export const ActivityStatusSchema = z.enum([
  "on_chain",
  "db_only",
  "client_only",
  "failed",
  "pending",
]);
export const PendingActivityDbPayloadSchema = z.object({
  id: z.coerce.bigint(),
  txHash: Bytes32Schema,
  evidenceId: Bytes32Schema,
  actor: AddressSchema,
  type: ActivityTypeSchema,
  chainId: z.number(),
});
export type PendingActivityDbPayload = z.input<
  typeof PendingActivityDbPayloadSchema
>;
export type ActivityStatus = z.output<typeof ActivityStatusSchema>;
export type ActivityType = z.output<typeof ActivityTypeSchema>;
