import { z } from "zod";
import { AddressSchema, Bytes32Schema } from "./solidity.types";

const BaseActivitySchema = z.object({
  contractAddress: AddressSchema,
  evidenceId: Bytes32Schema,
  actor: AddressSchema,
  txHash: Bytes32Schema.optional(),
  blockNumber: z.coerce.bigint().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const ActivityStatusSchema = z.enum([
  "on_chain",
  "db_only",
  "client_only",
  "failed",
  "pending",
]);

export const CreateActivitySchema = BaseActivitySchema.extend({
  type: z.literal("create"),
});

export const TransferActivitySchema = BaseActivitySchema.extend({
  type: z.literal("transfer"),
  from: AddressSchema,
  to: AddressSchema,
});

export const DiscontinueActivitySchema = BaseActivitySchema.extend({
  type: z.literal("discontinue"),
});

export const FetchActivitySchema = BaseActivitySchema.extend({
  type: z.literal("fetch"),
});

export const ActivityInputSchema = z.discriminatedUnion("type", [
  CreateActivitySchema,
  TransferActivitySchema,
  DiscontinueActivitySchema,
  FetchActivitySchema,
]);

// type of row in activities table
export interface ActivityRow {
  evidence_id: string;
  actor: string;
  status: ActivityStatus;
  type: "create" | "transfer" | "discontinue" | "fetch";
  from_addr: string;
  to_addr: string | null;
  updated_at: Date;
  // ...other fields if needed
}

export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;
export type ActivityInput = z.infer<typeof ActivityInputSchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type TransferActivityInput = z.infer<typeof TransferActivitySchema>;
export type DiscontinueActivityInput = z.infer<
  typeof DiscontinueActivitySchema
>;
export type FetchActivityInput = z.infer<typeof FetchActivitySchema>;
