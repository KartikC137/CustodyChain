import z from "zod";
import { AddressSchema } from "./solidity.types.js";

export const LedgerDataSchema = z.object({
  id: z.number(),
  network: z.string(),
  description: z.string(), // for configurable ledgers
  creator: AddressSchema,
  createdAt: z.date(),
  deployedBlock: z.coerce.bigint(),
  creationHash: AddressSchema,
  latestProcessedBlock: z.coerce.bigint(),
});

export type LedgerData = z.infer<typeof LedgerDataSchema>;
