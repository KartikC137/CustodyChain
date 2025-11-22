import { logger } from "../logger";
import type { NormalizedEvent } from "../blockListeners/ledgerListener";

import { handleEvidenceCreated } from "../dbHandlers/create";
import { handleOwnershipTransferred } from "../dbHandlers/transfer";
import { handleEvidenceDiscontinued } from "../dbHandlers/discontinue";

export async function dispatchEvent(ev: NormalizedEvent): Promise<void> {
  try {
    switch (ev.eventName) {
      case "EvidenceCreated":
        await handleEvidenceCreated(ev);
        break;

      case "OwnershipTransferred":
        await handleOwnershipTransferred(ev);
        break;

      case "EvidenceDiscontinued":
        await handleEvidenceDiscontinued(ev);
        break;

      default:
        logger.info("dispatcher: unknown event, ignoring", {
          eventName: ev.eventName,
          address: ev.address,
          tx: ev.txHash,
          block: ev.blockNumber.toString(),
        });
        break;
    }
  } catch (err) {
    logger.error("dispatcher: handler error", {
      eventName: ev.eventName,
      address: ev.address,
      tx: ev.txHash,
      block: ev.blockNumber.toString(),
      error: err,
    });
  }
}
