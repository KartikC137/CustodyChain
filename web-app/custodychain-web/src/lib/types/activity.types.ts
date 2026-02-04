import { z } from "zod";
import {
  AddressSchema,
  Bytes32Schema,
  Address,
  Bytes32,
} from "./solidity.types";

export const ActivityTypeSchema = z.enum([
  "create",
  "transfer",
  "discontinue",
  "fetch",
]);
export const ActivityStatusSchema = z.enum([
  "on_chain",
  "db_only",
  "client_only",
  "failed",
  "pending",
]);

export const ActivityInputSchema = z.object({
  evidenceId: Bytes32Schema,
  actor: AddressSchema,
  owner: AddressSchema,
  type: ActivityTypeSchema,
  txHash: Bytes32Schema.optional(),
  blockNumber: z.coerce.bigint().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  initializedAt: z.date(),
});

export type ActivityTypeType = z.infer<typeof ActivityTypeSchema>;
export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;
export type ActivityInputType = z.infer<typeof ActivityInputSchema>;

// Context types
export interface ActivityInfoForPanel {
  id: string;
  type: ActivityTypeType;
  status: ActivityStatus;
  txHash: Bytes32 | null;
  updatedAt: Date;
  actor: Address;
  evidenceId: Bytes32;
  owner: Address;
  error?: string;
}
