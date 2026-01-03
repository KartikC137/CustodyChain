import { config } from "../config";
import { logger } from "../logger";
import { query } from "../db";
import { publicClient } from "../web3config";
import { type Log, decodeEventLog, type Address, parseAbiItem } from "viem";
import { upsertLedgerInfoFromConfig } from "../upsertLedgerInfo";
import { addEvidenceFromLedger } from "./evidenceListener";
import { dispatchEvent } from "../dispatchers/dispatchEvent";

export interface NormalizedEvent<EventArgsType = {}> {
  eventName: string;
  args: EventArgsType;
  blockNumber: bigint;
  txHash: `0x${string}`;
  transactionIndex: bigint;
  logIndex: bigint;
  address: Address;
  raw: Log;
}

export type EvidenceCreatedArgs = {
  contractAddress: Address;
  creator: Address;
  evidenceId: `0x${string}`;
  metadataHash: `0x${string}`;
  nonce: bigint;
};

export interface CreateEvent extends NormalizedEvent<EvidenceCreatedArgs> {}

async function getLastCreatedBlock(): Promise<bigint> {
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
    throw new Error(
      `ledgerListener: couldn't fetch last preocessed block. check the Ledger Address: ${config.LEDGER_CONTRACT_ADDRESS}`
    );
  }
  return BigInt(res.rows[0].last_processed_block);
}
async function setLastCreatedBlock(b: bigint): Promise<void> {
  await query(
    `
    UPDATE ledger_info
    SET last_processed_block = $1
    WHERE contract_address = $2
    `,
    [b.toString(), config.LEDGER_CONTRACT_ADDRESS]
  );
}
export async function getLedgerDeployedBlock(): Promise<bigint> {
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
      `Couldn't fetch ledger deployed block. check the Ledger Address: ${config.LEDGER_CONTRACT_ADDRESS}`
    );
  }

  return BigInt(res.rows[0].deployed_block);
}

const evidenceCreatedEvent = parseAbiItem(
  "event EvidenceCreated(address indexed contractAddress, address indexed creator, bytes32 indexed evidenceId, bytes32 indexed metadataHash, uint256 nonce)"
);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Only scans for created evidence via ledger for now
export async function startLedgerListener(): Promise<() => Promise<void>> {
  logger.info("ledgerListener: starting...");

  try {
    await upsertLedgerInfoFromConfig(publicClient);
  } catch (err) {
    logger.error("ledgerListener: Could not start. Failed to Configure: ", err);
    throw err;
  }

  let active = true;

  (async function loop() {
    logger.info("ledgerListener: main loop started");

    while (active) {
      try {
        const head: bigint = await publicClient.getBlockNumber();
        const safeHead: bigint = head - BigInt(config.CONFIRMATIONS);

        const deployed = await getLedgerDeployedBlock();
        const lastCreated = await getLastCreatedBlock();

        let from: bigint = deployed > lastCreated ? deployed : lastCreated + 1n;

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
          if (
            !args.contractAddress ||
            !args.creator ||
            !args.evidenceId ||
            !args.metadataHash ||
            !args.nonce
          ) {
            logger.error(
              "ledgerListener: missing required args for this event log, skipping event:",
              {
                eventArgs: args,
                rawLog: log,
              }
            );
            continue;
          }
          await addEvidenceFromLedger(args.contractAddress);

          const ev: CreateEvent = {
            eventName,
            args: args as EvidenceCreatedArgs,
            raw: log,
            blockNumber: log.blockNumber ?? 0n,
            txHash: log.transactionHash as `0x${string}`,
            transactionIndex:
              log.transactionIndex != null ? BigInt(log.transactionIndex) : 0n,
            logIndex: log.logIndex != null ? BigInt(log.logIndex) : 0n,
            address: log.address as `0x${string}`,
          };

          try {
            await dispatchEvent(ev);
            logger.info(
              "ledgerListener: Evidence Created event dispatched! Evidence ID:",
              args.evidenceId
            );
          } catch (err) {
            logger.error("ledgerListener: dispatch event error skipping...", {
              event: ev,
            });
            continue;
          }
        }

        await setLastCreatedBlock(to);
        await sleep(100);
      } catch (err) {
        logger.error("ledgerListener: loop error sleeping for 2000ms...", err);
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
