import { z } from "zod";

export const LEDGER_ID_URL_CAIP_REGEX =
  /^eip155%3A[0-9]+%3A0x[a-fA-F0-9]{40}$/i;

export const LedgerIdSchema = z
  .string()
  .regex(LEDGER_ID_URL_CAIP_REGEX, {
    message: "Invalid CAIP format. Expected: eip155:<chainId>:<address>",
  })
  .transform((_ledgerId) => {
    const parts = _ledgerId.split("%3A");
    return {
      raw: _ledgerId,
      chainId: parseInt(parts[1], 10),
      address: parts[2].toLowerCase(),
    };
  });

export type LedgerId = z.infer<typeof LedgerIdSchema>;
