import dotenv from "dotenv";
import path from "path";
import { isAddress, type Address, type Chain } from "viem";
import { anvil, sepolia } from "viem/chains";

const envPath = path.resolve(__dirname, "../.env");
const result = dotenv.config({ path: envPath });
if (result.error) {
  const alternatePath = path.resolve(process.cwd(), "../chain-listener/.env");
  dotenv.config({ path: alternatePath });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Config: Missing environment variable: ${name}`);
  }
  return value.trim();
}
const ledgerAddress = requireEnv("LEDGER_CONTRACT_ADDRESS");
if (!isAddress(ledgerAddress)) {
  throw new Error(`Config: Invalid LEDGER_CONTRACT_ADDRESS: ${ledgerAddress}`);
}

const LEDGER_CONTRACT_ADDRESS = ledgerAddress as Address;

const preferSepoliaRpc =
  !!process.env.SEPOLIA_RPC_URL && process.env.SEPOLIA_RPC_URL.trim() !== "";

let CURRENT_CHAIN: Chain;
let RPC_URL: string;

if (preferSepoliaRpc) {
  CURRENT_CHAIN = sepolia;
  RPC_URL = process.env.SEPOLIA_RPC_URL!;
} else {
  CURRENT_CHAIN = anvil;
  RPC_URL = requireEnv("ANVIL_RPC_URL");
}

export const config = {
  CURRENT_CHAIN,
  RPC_URL,
  DATABASE_URL: requireEnv("DATABASE_URL"),
  CONFIRMATIONS: Number(process.env.CONFIRMATIONS ?? 2),
  LEDGER_CONTRACT_ADDRESS,
  BATCH_SIZE: Number(process.env.BATCH_SIZE ?? 10),
};
