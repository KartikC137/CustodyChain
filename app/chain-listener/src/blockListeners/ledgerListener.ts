import { config } from "../config";
import { logger } from "../logger";
import { query } from "../db";
import {
  createPublicClient,
  http,
  type Log,
  decodeEventLog,
  type Address,
  parseAbiItem,
} from "viem";
import { upsertLedgerInfoFromConfig } from "../upsertLedgerInfo";
import { addEvidenceFromLedger } from "./evidenceListener";
import { dispatchEvent } from "../dispatchers/dispatchEvent";

export interface NormalizedEvent {
  eventName: string;
  args: {};
  blockNumber: bigint;
  txHash: `0x${string}`;
  transactionIndex: bigint | number;
  logIndex: bigint;
  address: Address;
  raw: Log;
}

async function getLastProcessedBlock(): Promise<bigint> {
  const res = await query(
    `
    SELECT last_processed_block
    FROM ledger_info
    WHERE contract_address = $1
    LIMIT 1
    `,
    [config.LEDGER_CONTRACT_ADDRESS]
  );

  if (res.rowCount === 0) {
    return 0n;
  }

  return BigInt(res.rows[0].last_processed_block);
}
async function setLastProcessedBlock(b: bigint): Promise<void> {
  await query(
    `
    UPDATE ledger_info
    SET last_processed_block = $1
    WHERE contract_address = $2
    `,
    [b.toString(), config.LEDGER_CONTRACT_ADDRESS]
  );
}
async function getLedgerDeployedBlock(): Promise<bigint> {
  const res = await query(
    `
    SELECT deployed_block
    FROM ledger_info
    WHERE contract_address = $1
    LIMIT 1
    `,
    [config.LEDGER_CONTRACT_ADDRESS]
  );

  if (res.rowCount === 0) {
    throw new Error(
      "ledgerListener: ledger_info not initialized for this contract"
    );
  }

  return BigInt(res.rows[0].deployed_block);
}

const publicClient = createPublicClient({
  transport: http(config.RPC_URL),
  chain: config.CURRENT_CHAIN,
});

const evidenceCreatedEvent = parseAbiItem(
  "event EvidenceCreated(address indexed contractAddress, address indexed creator, bytes32 indexed evidenceId, bytes32 indexed metadataHash, uint256 nonce)"
);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Only scans for created evidence via ledger for now
export async function startLedgerListener(): Promise<() => Promise<void>> {
  logger.info("ledgerListener: starting...");

  await upsertLedgerInfoFromConfig(publicClient);

  let active = true;

  (async function loop() {
    logger.info("ledgerListener: main loop started");

    while (active) {
      try {
        const head: bigint = await publicClient.getBlockNumber();
        const safeHead: bigint = head - BigInt(config.CONFIRMATIONS);

        const deployed = await getLedgerDeployedBlock();
        const lastProcessed = await getLastProcessedBlock();

        let from: bigint =
          deployed > lastProcessed ? deployed : lastProcessed + 1n;

        if (from > safeHead) {
          await sleep(500);
          continue;
        }

        const batchMax = from + BigInt(config.BATCH_SIZE) - 1n;
        const to: bigint = batchMax < safeHead ? batchMax : safeHead;

        logger.info("ledgerListener: fetching logs", {
          from: from.toString(),
          to: to.toString(),
          head: head.toString(),
          safeHead: safeHead.toString(),
          deployed: deployed.toString(),
        });

        const logs: Log[] = await publicClient.getLogs({
          address: config.LEDGER_CONTRACT_ADDRESS,
          event: evidenceCreatedEvent,
          fromBlock: from,
          toBlock: to,
        });

        logs.sort((a, b) => {
          const ab = a.blockNumber ?? 0n;
          const bb = b.blockNumber ?? 0n;
          if (ab !== bb) return ab < bb ? -1 : 1;

          const ta = a.transactionIndex ?? 0n;
          const tb = b.transactionIndex ?? 0n;
          if (ta !== tb) return ta < tb ? -1 : 1;

          const la = a.logIndex ?? 0n;
          const lb = b.logIndex ?? 0n;
          return la < lb ? -1 : la > lb ? 1 : 0;
        });

        for (const log of logs) {
          const { eventName, args } = decodeEventLog({
            abi: [evidenceCreatedEvent],
            ...log,
            strict: false,
          });

          await addEvidenceFromLedger(args.contractAddress);

          const ev: NormalizedEvent = {
            eventName,
            args,
            raw: log,
            blockNumber: log.blockNumber ?? 0n,
            txHash: log.transactionHash as `0x${string}`,
            transactionIndex:
              log.transactionIndex != null ? BigInt(log.transactionIndex) : 0n,
            logIndex: log.logIndex != null ? BigInt(log.logIndex) : 0n,
            address: log.address as `0x${string}`,
          };

          try {
            logger.info("ledgerListener: Evidence Created event dispatched");
            await dispatchEvent(ev);
          } catch (err) {
            logger.error("ledgerListener: event handler error", err);
          }
        }

        await setLastProcessedBlock(to);
        await sleep(100);
      } catch (err) {
        logger.error("ledgerListener: loop error", err);
        await sleep(2000);
      }
    }

    logger.info("ledgerListener: stopped");
  })();

  return async () => {
    active = false;
    await sleep(300);
  };
}
