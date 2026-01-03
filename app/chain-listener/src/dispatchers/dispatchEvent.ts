import { logger } from "../logger";
import type {
  NormalizedEvent,
  CreateEvent,
} from "../blockListeners/ledgerListener";
import type {
  DiscontinueEvent,
  TransferEvent,
} from "../blockListeners/evidenceListener";
import { handleEvidenceCreated } from "../dbHandlers/create";
import { handleOwnershipTransferred } from "../dbHandlers/transfer";
import { handleEvidenceDiscontinued } from "../dbHandlers/discontinue";

export async function dispatchEvent(ev: NormalizedEvent): Promise<void> {
  try {
    switch (ev.eventName) {
      case "EvidenceCreated":
        await handleEvidenceCreated(ev as CreateEvent);
        break;

      case "OwnershipTransferred":
        await handleOwnershipTransferred(ev as TransferEvent);
        break;

      case "EvidenceDiscontinued":
        await handleEvidenceDiscontinued(ev as DiscontinueEvent);
        break;

      default:
        logger.info("dispatcher: unknown event, ignoring...", {
          eventName: ev.eventName,
          address: ev.address,
          tx: ev.txHash,
          block: ev.blockNumber.toString(),
        });
        throw new Error("Unknown event");
    }
  } catch (err) {
    logger.error("dispatcher: handler error", {
      eventName: ev.eventName,
      address: ev.address,
      tx: ev.txHash,
      block: ev.blockNumber,
      error: err,
    });
    throw err;
  }
}
