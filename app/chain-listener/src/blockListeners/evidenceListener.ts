import { config } from "../config";
import { logger } from "../logger";
import { query } from "../db";
import { publicClient } from "../web3config";
import { type Log, decodeEventLog, type Address, parseAbiItem } from "viem";
import { sleep, type NormalizedEvent } from "./ledgerListener";
import { dispatchEvent } from "../dispatchers/dispatchEvent";
import { getLedgerDeployedBlock } from "./ledgerListener";

const ownershipTransferredEvent = parseAbiItem(
  "event OwnershipTransferred(bytes32 indexed evidenceId, address indexed previousOwner, address indexed newOwner, uint256 timeOfTransfer)"
);

const evidenceDiscontinuedEvent = parseAbiItem(
  "event EvidenceDiscontinued(bytes32 indexed evidenceId, address indexed caller, uint256 indexed timeOfDiscontinuation)"
);

export type EvidenceTransferredArgs = {
  evidenceId: `0x${string}`;
  previousOwner: Address;
  newOwner: Address;
  timeOfTransfer: bigint;
};

export type EvidenceDiscontinuedArgs = {
  evidenceId: `0x${string}`;
  caller: Address;
  timeOfDiscontinuation: bigint;
};

export type EvidenceEventArgs =
  | EvidenceTransferredArgs
  | EvidenceDiscontinuedArgs;

export interface TransferEvent
  extends NormalizedEvent<EvidenceTransferredArgs> {}

export interface DiscontinueEvent
  extends NormalizedEvent<EvidenceDiscontinuedArgs> {}

export interface EvidenceEvent extends NormalizedEvent<EvidenceEventArgs> {}

const watchedContracts = new Set<Address>();

async function getLastScannedBlock(): Promise<bigint> {
  const res = await query(
    `
    SELECT block_number
    FROM activity
    WHERE status = 'on_chain'
    AND type IN ('transfer', 'discontinue')
    AND block_number IS NOT NULL
    ORDER BY block_number DESC
    LIMIT 1
    `
  );
  if (res.rowCount === 0) {
    const deployed = await getLedgerDeployedBlock();
    logger.warn(
      "evidenceListener: no valid activity yet, starting from ledger deployed block...",
      { blockNumber: deployed }
    );
    return deployed;
  }
  return BigInt(res.rows[0].block_number);
}

async function getKnownEvidenceContracts(): Promise<Address[]> {
  const res = await query(
    `
    SELECT contract_address
    FROM evidence
    WHERE status = 'active'
    AND contract_address IS NOT NULL
    `
  );
  return res.rows.map((r) => r.contract_address as Address);
}

function normalizeEvidenceLog(log: Log): EvidenceEvent {
  const decoded = decodeEventLog({
    abi: [ownershipTransferredEvent, evidenceDiscontinuedEvent],
    ...log,
  });
  let decodedArgs: EvidenceEventArgs;

  if (decoded.eventName === "OwnershipTransferred") {
    decodedArgs = decoded.args as EvidenceTransferredArgs;
    if (
      !decodedArgs.evidenceId ||
      !decodedArgs.previousOwner ||
      !decodedArgs.newOwner ||
      !decodedArgs.timeOfTransfer
    ) {
      logger.error(
        "evidenceListener: normalizeEvidenceLog error: missing transfer args ",
        {
          contractAddress: log.address,
          transferArgs: decodedArgs,
        }
      );
      throw new Error(
        `Couldn't Transfer Evidence contractAddress: ${log.address}`
      );
    }
  } else {
    decodedArgs = decoded.args as EvidenceDiscontinuedArgs;
    if (
      !decodedArgs.evidenceId ||
      !decodedArgs.caller ||
      !decodedArgs.timeOfDiscontinuation
    ) {
      logger.error(
        "evidenceListener: normalizeEvidenceLog error: missing discontinue args ",
        {
          contractAddress: log.address,
          discontinueArgs: decodedArgs,
        }
      );
      throw new Error(
        `Couldn't Discontinue Evidence contractAddress: ${log.address}`
      );
    }
  }

  return {
    eventName: decoded.eventName as string,
    args: decodedArgs,
    blockNumber: log.blockNumber ?? 0n,
    txHash: log.transactionHash as `0x${string}`,
    transactionIndex:
      log.transactionIndex != null ? BigInt(log.transactionIndex) : 0n,
    logIndex: log.logIndex != null ? BigInt(log.logIndex) : 0n,
    address: log.address as Address,
    raw: log,
  };
}

export async function startEvidenceListener(): Promise<() => Promise<void>> {
  logger.info("evidenceListener: starting...");

  const existing = await getKnownEvidenceContracts();
  for (const addr of existing) {
    watchedContracts.add(addr);
  }

  let active = true;
  let lastScannedBlock = await getLastScannedBlock();

  (async function loop() {
    logger.info("evidenceListener: loop started");

    while (active) {
      try {
        if (watchedContracts.size === 0) {
          await sleep(1000);
          continue;
        }

        const head = await publicClient.getBlockNumber();
        const safeHead: bigint = head - BigInt(config.CONFIRMATIONS);

        if (safeHead <= lastScannedBlock) {
          await sleep(1000);
          continue;
        }

        const from = lastScannedBlock + 1n;
        const batchMax = from + BigInt(config.BATCH_SIZE) - 1n;
        const to: bigint = batchMax < safeHead ? batchMax : safeHead;

        const addresses = Array.from(watchedContracts);

        const logs: Log[] = await publicClient.getLogs({
          address: addresses,
          events: [evidenceDiscontinuedEvent, ownershipTransferredEvent],
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
          try {
            const ev = normalizeEvidenceLog(log);
            await dispatchEvent(ev);
            logger.info(`evidenceListner: ${ev.eventName} dispatched!`, {
              event: ev,
            });
          } catch (err) {
            logger.error("evidenceListener: dispatch event error skipping...", {
              rawLog: log,
              error: err,
            });
            continue;
          }
        }

        lastScannedBlock = to;
        await sleep(250);
      } catch (err) {
        logger.error("evidenceListener: loop error", err);
        await sleep(2000);
      }
    }

    logger.info("evidenceListener: loop stopped");
  })();

  return async () => {
    active = false;
    await sleep(300);
  };
}

export async function addEvidenceFromLedger(contractAddress: Address) {
  if (!watchedContracts.has(contractAddress)) {
    watchedContracts.add(contractAddress);
    logger.info(
      "evidenceListener: added new evidence contract successfully",
      contractAddress
    );
  }
}
