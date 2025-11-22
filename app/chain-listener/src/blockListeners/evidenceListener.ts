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
import { sleep, type NormalizedEvent } from "./ledgerListener";
import { dispatchEvent } from "../dispatchers/dispatchEvent";

const ownershipTransferredEvent = parseAbiItem(
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner, uint256 indexed timeOfTransfer)"
);

const evidenceDiscontinuedEvent = parseAbiItem(
  "event EvidenceDiscontinued(bytes32 indexed evidenceId)"
);

const publicClient = createPublicClient({
  transport: http(config.RPC_URL),
  chain: config.CURRENT_CHAIN,
});

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

const watchedContracts = new Set<Address>();

function normalizeEvidenceLog(log: Log): NormalizedEvent {
  const decoded = decodeEventLog({
    abi: [ownershipTransferredEvent, evidenceDiscontinuedEvent],
    ...log,
  });

  return {
    eventName: decoded.eventName as string,
    args: decoded.args as Record<string, unknown>,
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
  let lastScannedBlock = await publicClient.getBlockNumber();

  (async function loop() {
    logger.info("evidenceListener: loop started");

    while (active) {
      try {
        if (watchedContracts.size === 0) {
          await sleep(1000);
          continue;
        }

        const head = await publicClient.getBlockNumber();
        if (head <= lastScannedBlock) {
          await sleep(1000);
          continue;
        }

        const fromBlock = lastScannedBlock + 1n;
        const toBlock = head;

        const addresses = Array.from(watchedContracts);

        const logs: Log[] = await publicClient.getLogs({
          address: addresses,
          fromBlock,
          toBlock,
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
          } catch {
            logger.info("evidenceListner: ledgerListener: event handler error");
          }
        }

        lastScannedBlock = toBlock;
        await sleep(250);
      } catch (err) {
        logger.error("evidenceListener loop error", err);
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

export async function addEvidenceFromLedger(
  contractAddress: Address | undefined
) {
  const addr = contractAddress;
  if (!addr) return;

  if (!watchedContracts.has(addr)) {
    watchedContracts.add(addr);
    logger.info("evidenceListener: added new evidence contract", addr);
  }
}
