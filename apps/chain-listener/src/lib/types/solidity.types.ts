import { z } from "zod";
import { isAddress } from "viem";

//todo make this always return lowercase when valid using transformations
export const AddressSchema = z
  .string()
  .refine((val) => isAddress(val), "invalid ethAddress value")
  .transform((val) => val.toLowerCase()) as z.ZodType<`0x${string}`>;

export const Bytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "invalid bytes32 value")
  .transform((val) => val.toLowerCase()) as z.ZodType<`0x${string}`>;

export type Bytes32 = z.infer<typeof Bytes32Schema>;
export type Address = z.infer<typeof AddressSchema>;
