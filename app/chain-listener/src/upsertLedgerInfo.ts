import { config, requireEnv } from "./config";
import { evidenceLedgerAbi } from "../../lib/contractAbi/evidence-ledger-abi";
import { type Address, decodeEventLog, type PublicClient } from "viem";
import { withTransaction } from "./db";
import { logger } from "./logger";

export async function upsertLedgerInfoFromConfig(
  publicClient: PublicClient
): Promise<void> {
  const addr = config.LEDGER_CONTRACT_ADDRESS.toLowerCase();
  const network = String(config.CURRENT_CHAIN.id);
  const envTx = requireEnv("LEDGER_DEPLOY_TX_HASH");

  if (!envTx.startsWith("0x") || envTx.length !== 66) {
    throw new Error(
      `upsertLedgerInfoFromConfig: Invalid LEDGER_DEPLOY_TX_HASH: ${envTx}`
    );
  }

  let deployedBlock: bigint | null = null;

  const receipt = await publicClient.getTransactionReceipt({
    hash: envTx as `0x${string}`,
  });
  if (!receipt) {
    throw new Error(
      `upsertLedgerInfoFromConfig: No receipt found for LEDGER_DEPLOY_TX_HASH=${envTx}`
    );
  }
  const eventLog = receipt.logs
    .map((log) => {
      try {
        return decodeEventLog({ abi: evidenceLedgerAbi, ...log });
      } catch {
        return null;
      }
    })
    .find((log) => log?.eventName === "EvidenceLedgerCreated");

  if (!eventLog) {
    throw new Error(
      `upsertLedgerInfoFromConfig: Couldnt Fetch Evidence Ledger Event Logs`
    );
  }

  const {
    contractAddress: emittedAddress,
    creator: emittedCreator,
    blockNumber: emittedBlockNumber,
    timeStamp: emittedTimeStamp,
  } = eventLog.args as unknown as {
    contractAddress: Address;
    creator: Address;
    blockNumber: bigint;
    timeStamp: bigint;
  };

  deployedBlock = receipt.blockNumber;

  if (addr !== emittedAddress.toLowerCase()) {
    throw new Error(
      `upsertLedgerInfoFromConfig: ledger contract address doesn't match: ${addr} !== ${emittedAddress}`
    );
  }
  if (deployedBlock !== emittedBlockNumber) {
    throw new Error(
      `upsertLedgerInfoFromConfig: ledger contract block number doesn't match: ${deployedBlock} !== ${emittedBlockNumber}`
    );
  }

  await withTransaction(async (client) => {
    await client.query(
      `
    INSERT INTO ledger_info (contract_address, deployed_block, deployed_tx, network, created_at, creator)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (contract_address) DO UPDATE
      SET deployed_block = EXCLUDED.deployed_block,
          deployed_tx     = EXCLUDED.deployed_tx,
          network         = EXCLUDED.network,
          created_at      = EXCLUDED.created_at,
          creator         = EXCLUDED.creator;
    `,
      [
        emittedAddress,
        emittedBlockNumber,
        envTx,
        network,
        emittedTimeStamp,
        emittedCreator,
      ]
    );
  });

  logger.info("ledger_info upserted", { addr, deployedBlock, envTx });
}
