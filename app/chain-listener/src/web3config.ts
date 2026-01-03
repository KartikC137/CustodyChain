import { createPublicClient, http } from "viem";
import { config } from "./config";

export const publicClient = createPublicClient({
  transport: http(),
  chain: config.CURRENT_CHAIN,
});
