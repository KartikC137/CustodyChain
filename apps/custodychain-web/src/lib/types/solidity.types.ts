import { z } from "zod";

export const AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "invalid EVM address")
  .transform((address) => address.toLowerCase() as `0x${string}`);

export const Bytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "invalid bytes32 value")
  .transform((value) => value.toLowerCase() as `0x${string}`);

export type Bytes32 = z.infer<typeof Bytes32Schema>;
export type Address = z.infer<typeof AddressSchema>;
