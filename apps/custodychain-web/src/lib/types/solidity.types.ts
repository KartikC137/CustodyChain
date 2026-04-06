import { z } from "zod";
import { isAddress } from "viem";

//update this schema
export const AddressSchema = z
  .string()
  .refine((val) => isAddress(val), "invalid ethAddress value");

export const Bytes32Schema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{64}$/,
    "invalid bytes32 value",
  ) as z.ZodType<`0x${string}`>;

export type Bytes32 = z.infer<typeof Bytes32Schema>;
export type Address = z.infer<typeof AddressSchema>;
