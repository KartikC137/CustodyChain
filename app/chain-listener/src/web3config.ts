import { createPublicClient, http } from "viem";
import { config } from "./config.js";

export const publicClient = createPublicClient({
  transport: http(),
  chain: config.CURRENT_CHAIN,
});
