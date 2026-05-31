import { z } from "zod";
import {
  Address,
  AddressSchema,
  Bytes32,
  Bytes32Schema,
} from "./solidity.types";

// LEDGER ID SCHEMAS
export const LEDGER_ID_URL_CAIP_REGEX =
  /^eip155%3A[0-9]+%3A0x[a-fA-F0-9]{40}$/i;

export const LEDGER_ID_CAIP_REGEX = /^eip155:[0-9]+:0x[a-fA-F0-9]{40}$/i;

export const LedgerIdURLSchema = z
  .string()
  .regex(LEDGER_ID_URL_CAIP_REGEX, {
    message: "Invalid CAIP format. Expected: eip155:<chainId>:<address>",
  })
  .transform((_ledgerId) => {
    const parts = _ledgerId.split("%3A");
    return {
      raw: _ledgerId.replaceAll("%3A", ":"),
      chainId: parseInt(parts[1], 10),
      address: parts[2].toLowerCase(),
    };
  });

export const LedgerIdSchema = z.string().regex(LEDGER_ID_CAIP_REGEX, {
  message: "Invalid CAIP format. Expected: eip155:<chainId>:<address>",
});

export type LedgerId = z.infer<typeof LedgerIdSchema>;

// LEDGER DATA SCHEMAS
export const BaseLedgerInfoSchema = z.object({
  name: z.string(),
  txHash: Bytes32Schema,
  status: z.enum(["pending", "active", "inactive"]),
  creator: AddressSchema,
  address: AddressSchema.optional(),
});

export const LedgerInfoSchema = BaseLedgerInfoSchema.extend({
  dbId: z.number(),
});

// for multiple ledgers
export const LedgersInfoSchema = BaseLedgerInfoSchema.extend({
  createdAt: z.date().optional(),
  id: LedgerIdSchema.optional(),
});

export type LedgerInfo = z.infer<typeof LedgerInfoSchema>;
export type LedgersInfo = z.infer<typeof LedgersInfoSchema>;

// LEDGER ROLES SCHEMAS
export const ROLES = ["c", "t", "r"] as const;
export type Role = "c" | "t" | "r";

export const dbToRoleNameMap: Record<Role, string> = {
  c: "CREATOR",
  t: "TRANSFERRER",
  r: "RECEIVER",
};
export const roleToHashMap = {
  c: "0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f",
  t: "0x9c0b3a9882e11a6bfb8283b46d1e79513afb8024ee864cd3a5b3a9050c42a7d7",
  r: "0x7a97506be97703960d71e3a118f1850a50b01da6957110e8293eacb08d8c6060",
} as const;

// db
const BaseRoleSchema = z.object({
  account: AddressSchema,
  action: z.enum(["grant", "revoke"]),
});

const PendingRoleSchema = BaseRoleSchema.extend({
  role: z.enum(ROLES),
});

export const InputPendingRoleSchema = z.array(PendingRoleSchema);

// contracts
const SelectedRoleSchema = BaseRoleSchema.extend({
  role: z.enum(ROLES).transform((key) => roleToHashMap[key]),
});

export const ParseSelectedRoleSchema = z
  .array(SelectedRoleSchema)
  .transform((parsedArray) => {
    const grouped = parsedArray.reduce(
      (acc, item) => {
        const targetAction = item.action === "grant" ? acc.grant : acc.revoke;
        if (!targetAction[item.role]) {
          targetAction[item.role] = [];
        }
        targetAction[item.role].push(item.account);
        return acc;
      },
      { grant: {}, revoke: {} } as {
        grant: Record<string, Address[]>;
        revoke: Record<string, Address[]>;
      },
    );
    return {
      granted: Object.entries(grouped.grant) as [string, Address[]][],
      revoked: Object.entries(grouped.revoke) as [string, Address[]][],
    };
  });

export type PendingRole = z.input<typeof PendingRoleSchema>;
export type DbRoleAction = "grant" | "revoke";
export type DbRoleFlags = Record<Role, boolean>;
export type ActiveRoles = {
  account: Address;
  roles: {
    role: Role;
    grantedOn: Date;
  }[];
  updatedAt: Date;
};
export type GroupedByAccount = {
  account: string;
  grant: ("c" | "t" | "r")[];
  revoke: ("c" | "t" | "r")[];
};
export type InputSelectedRoles = z.input<typeof ParseSelectedRoleSchema>;
export type ParsedSelectedRoles = z.output<typeof ParseSelectedRoleSchema>;
