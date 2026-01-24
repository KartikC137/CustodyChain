import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { type Chain } from "viem";
import { anvil, sepolia } from "viem/chains";
import { evidenceLedgerAddress } from "../lib/contracts/evidence-ledger-address";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../../.env");
const result = dotenv.config({ path: envPath });
if (result.error) {
  const alternatePath = path.resolve(
    process.cwd(),
    "../../../chain-listener/.env",
  );
  dotenv.config({ path: alternatePath });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Config: Missing environment variable: ${name}`);
  }
  return value.trim();
}

if (!evidenceLedgerAddress) {
  throw new Error(`Config: Missing Evidence Ledger Address`);
}

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

// later use it to check .env current chain
export const supportedChains: Record<number, Chain> = {
  [anvil.id]: anvil,
  [sepolia.id]: sepolia,
};

export const config = {
  CURRENT_CHAIN,
  RPC_URL,
  DATABASE_URL: requireEnv("DATABASE_URL"),
  CONFIRMATIONS: Number(process.env.CONFIRMATIONS ?? 2),
  LEDGER_CONTRACT_ADDRESS: evidenceLedgerAddress,
  BATCH_SIZE: Number(process.env.BATCH_SIZE ?? 10),
};
