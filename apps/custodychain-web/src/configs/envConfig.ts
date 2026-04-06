import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const envPath: string = "../../../.env";
const alternateEnvPath: string = "../chain-listener/.env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const _envPath = path.resolve(__dirname, envPath);
const result = dotenv.config({ path: _envPath });
if (result.error) {
  const alternatePath = path.resolve(process.cwd(), alternateEnvPath);
  dotenv.config({ path: alternatePath });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`config: Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function optionalEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`config: missing optional environment variable: ${name}`);
    return "";
  }
  return value.trim();
}
