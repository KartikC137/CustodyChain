import { z } from "zod";
import {
  AddressSchema,
  Bytes32Schema,
  Address,
  Bytes32,
} from "./solidity.types";

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

export type ActivityType = "create" | "transfer" | "discontinue" | "fetch";
// type of row in activities table
export interface ActivityRow {
  id: bigint;
  initialized_at: Date | null;
  updated_at: Date | null;
  evidence_id: Bytes32;
  actor: Bytes32;
  type: ActivityType;
  status: ActivityStatus;
  tx_hash: Bytes32;
  block_number: bigint | null;
  from_addr?: Address;
  to_addr?: Address;
  meta: any;
  contract_address: string;
}
// essential info for activity panel
export interface ActivityInfoForPanel {
  id: bigint;
  type: ActivityType;
  status: ActivityStatus;
  tx_hash: Bytes32 | null;
  from_addr?: Address;
  to_addr?: Address;
  updated_at: Date | null;
  actor: Address;
  evidence_id: Bytes32;
}

export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;
export type ActivityInput = z.infer<typeof ActivityInputSchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type TransferActivityInput = z.infer<typeof TransferActivitySchema>;
export type DiscontinueActivityInput = z.infer<
  typeof DiscontinueActivitySchema
>;
export type FetchActivityInput = z.infer<typeof FetchActivitySchema>;
