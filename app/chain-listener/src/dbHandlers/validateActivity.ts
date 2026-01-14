import { publicClient } from "../config/web3config.js";
import { logger } from "../logger.js";
import { updateActivityForClient } from "../helpers/acitivtyHelpers.js";

export async function validateActivity(
  activityId: bigint,
  txHash: `0x${string}` | null,
  blockNumber: bigint | null
): Promise<void> {
  if (!activityId) {
    logger.error("dispatchActivity: query error, invalid activity Id.");
    throw new Error("DB: activity insertion failed");
  }

  if (!txHash) {
    logger.warn(
      "dispatchActivity: txHash not provided, marking activity as failed.",
      {
        activityId: activityId,
      }
    );
    await updateActivityForClient(
      activityId,
      "failed",
      null,
      blockNumber ?? null,
      "tx Hash not found"
    );
    return;
  }

  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 10_000, // 10 seconds
    });
  } catch (err) {
    logger.error("dispatchActivity: fetching reciept failed:", {
      hash: txHash,
      originalError: err,
    });
    throw new Error("receipt fetching failed");
  }

  if (!receipt) {
    logger.warn(
      "dispatchActivity: couldn't fetch tx within timout. marking activity as failed...",
      {
        activityId: activityId,
      }
    );
    await updateActivityForClient(
      activityId,
      "failed",
      txHash,
      blockNumber ?? null,
      "receipt timout"
    );
    return;
  }

  if (receipt.status !== "success") {
    logger.warn("dispatchActivity: tx failed on chain.", {
      activityId: activityId,
    });
    await updateActivityForClient(
      activityId,
      "failed",
      txHash,
      blockNumber ?? null,
      "on chain revert"
    );
    return;
  }

  await updateActivityForClient(
    activityId,
    "client_only",
    txHash,
    receipt?.blockNumber
  );

  // TODO: need to update nonce of account if activity is of type create
  logger.info("dispatchActivity: updated activity status to client_only!", {
    id: activityId,
  });
  return;
}

// Optional full validation

// async function validateOnChain(input: ActivityInput) {
//   try {
//     const evidenceAddressFromLedger = (await publicClient.readContract({
//       address: config.LEDGER_CONTRACT_ADDRESS,
//       abi: evidenceLedgerAbi,
//       functionName: "getEvidenceContractAddress",
//       args: [input.evidenceId],
//     })) as Address;
//     if (
//       evidenceAddressFromLedger.toLowerCase() !==
//       input.contractAddress.toLowerCase()
//     ) {
//       throw new Error(
//         `validateOnChain: contract address: ${input.contractAddress} from ledger: ${evidenceAddressFromLedger} does not match`
//       );
//     }

//     const evidenceId = (await publicClient.readContract({
//       address: input.contractAddress,
//       abi: evidenceAbi,
//       functionName: "getEvidenceId",
//     })) as `0x${string}`;
//     if (evidenceId !== input.evidenceId) {
//       throw new Error(
//         `validateOnChain: evidenceId: ${evidenceId} input: ${input.evidenceId} does not match`
//       );
//     }

//     if (input.type === "create") {
//       const creator = await publicClient.readContract({
//         address: input.contractAddress,
//         abi: evidenceAbi,
//         functionName: "getEvidenceCreator",
//       });
//       if (creator !== input.actor) {
//         throw new Error(
//           `validateOnChain: creator: ${creator} actor: ${input.actor}`
//         );
//       }
//     }

//     if (input.type === "transfer") {
//       const currentOwner = (await publicClient.readContract({
//         address: input.contractAddress,
//         abi: evidenceAbi,
//         functionName: "getCurrentOwner",
//       })) as Address;

//       if (currentOwner.toLowerCase() !== input.to.toLowerCase()) {
//         throw new Error(
//           `validateOnChain: current owner: ${currentOwner} doesn't match receiver: ${input.to}`
//         );
//       }
//     }

//     if (input.type === "discontinue") {
//       const state = await publicClient.readContract({
//         address: input.contractAddress,
//         abi: evidenceAbi,
//         functionName: "getEvidenceState",
//       });

//       if (state === true) {
//         throw new Error(`validateOnChain: evidence is still active`);
//       }
//     }
//   } catch (err) {
//     logger.warn(
//       "validateOnChain: read contracts failed, cannot validate activity",
//       {
//         ledgerAddress: config.LEDGER_CONTRACT_ADDRESS,
//         evidenceAddress: input.contractAddress,
//         error: err,
//       }
//     );

//     throw err instanceof Error
//       ? err
//       : new Error(`validationOnChain: ${String(err)}`);
//   } finally {
//     logger.info("validateOnChain: validation complete");
//   }
// }
