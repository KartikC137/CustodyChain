import z from "zod";
import { AddressSchema, Bytes32Schema } from "./solidity.types.js";

// LEDGER INFO
export const PendingLedgerDbPayloadSchema = z.object({
  txHash: Bytes32Schema,
  chainId: z.number(),
  creator: AddressSchema,
});

export type PendingLedgerDbPayload = z.input<
  typeof PendingLedgerDbPayloadSchema
>;

// ROLES
export const dbRoleToHashMap = {
  c: "0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f",
  t: "0x9c0b3a9882e11a6bfb8283b46d1e79513afb8024ee864cd3a5b3a9050c42a7d7",
  r: "0x7a97506be97703960d71e3a118f1850a50b01da6957110e8293eacb08d8c6060",
} as const;

const RoleItemSchema = z.object({
  id: z.number(),
  role: z.enum(["c", "t", "r"]).transform((val) => dbRoleToHashMap[val]),
  account: AddressSchema,
});

export const PendingRolesDbPayloadSchema = z.object({
  ledgerId: z.number(),
  admin: AddressSchema,
  chainId: z.number(),
  txHash: Bytes32Schema,
  granted: z.array(RoleItemSchema),
  revoked: z.array(RoleItemSchema),
  updatedAt: z.coerce.date(),
});

export type PendingRolesDbPayload = z.input<typeof PendingRolesDbPayloadSchema>;
export type PendingRolesDbParsed = z.output<typeof PendingRolesDbPayloadSchema>;
export interface RoleUpdates {
  id: number;
  status: "success" | "failed";
}
