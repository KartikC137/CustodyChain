"use client";
import { getSocket } from "../configs/socketConfig";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ActivityInfoForPanel } from "../lib/types/activity.types";
import { useLedger } from "./LedgerContext";
import { useEvidences } from "./EvidencesContext";
import { fetchActivities } from "../api/activities/fetchActivities";
import { SocketActivityUpdateSchema } from "../lib/types/socketEvent.types";
import { useWallet } from "./WalletContext";

interface ActivityContextType {
  activities: ActivityInfoForPanel[];
  isLoadingActivities: boolean;
  addPendingActivity: (activity: ActivityInfoForPanel) => void;
  refreshActivities: () => Promise<void>; // for manual refreshes
}

/**
 * @notice Only handles client_only, pending and failed.
 * @dev 1. Socket events cannot serialize bigint values, they emit string values, so convert string to bigint always
 *      2.when an activity of type transfer and client_only and where actor not equal to account is received (i.e evidence was transferred from someone else)
 *      it has to be inserted as new, as it was never inserted by any transfer form.
 * @todo fix evidences and activities context - needs update on received evidences and better socket updates
 *
 */
const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { account, chain } = useWallet();
  const { ledgerAddress } = useLedger();
  const { insertEvidence, updateEvidence } = useEvidences();
  const [activities, setActivities] = useState<ActivityInfoForPanel[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const refreshActivities = useCallback(async () => {
    setIsLoadingActivities(true);

    try {
      if (!account) {
        return;
      }

      const data = await fetchActivities(
        account,
        chain?.id as number,
        ledgerAddress,
      );
      console.log("data of activity", data);
      setActivities(data);
    } catch (err) {
      console.error("Failed to fetch activities", err);
      //maybe throw
    } finally {
      setIsLoadingActivities(false);
    }
  }, [account]);

  useEffect(() => {
    refreshActivities();
  }, [refreshActivities]);

  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = (activityUpdate: any) => {
      const result = SocketActivityUpdateSchema.safeParse(activityUpdate);
      if (!result.success) {
        console.error("parse error", result.error);
        throw new Error("ActivityContext: socket data parse failed");
      }
      const update = result.data;
      console.info("Activity Update Parsed:", update);

      setActivities((prev) => {
        const targetIndex = prev.findIndex(
          (act) =>
            act.status === "pending" &&
            update.txHash &&
            act.txHash &&
            act.txHash === update.txHash,
        );
        if (targetIndex === -1) {
          return prev;
        }
        const newActivities = [...prev];
        newActivities[targetIndex] = {
          ...newActivities[targetIndex],
          id: update.activityId,
          status: update.status,
          txHash: update.txHash,
          updatedAt: update.updatedAt,
          error: update.status === "failed" ? update.error : "unknown error",
        };
        return newActivities;
      });

      //ignoring fetch activities
      if (update.status === "client_only") {
        if (update.type === "create") {
          insertEvidence(update.evidence);
        } else if (update.type === "transfer") {
          // check if evidence was received (transferred from)
          if (update.actor !== account) {
            setActivities((prev) => [
              {
                id: update.activityId,
                type: "transfer",
                status: "client_only",
                txHash: update.txHash,
                updatedAt: update.updatedAt,
                actor: update.actor,
                evidenceId: update.evidence.id,
                owner: update.evidence.currentOwner,
              },
              ...prev,
            ]);
            // ensures if evidence was recieved back its not re-inserted
            if (update.evidence.creator !== account) {
              insertEvidence(update.evidence);
            } else {
              updateEvidence(update.evidence, "transfer");
            }
          } else {
            // evidence was transferred, by (this account) update.actor , to = update.currentOwner
            updateEvidence(update.evidence, "transfer");
          }
        } else if (update.type === "discontinue") {
          updateEvidence(update.evidence, "discontinue");
        }
      }
    };

    socket.on("activity_update", handleUpdate);

    return () => {
      socket.off("activity_update", handleUpdate);
    };
  }, [account]);

  const addPendingActivity = (newActivity: ActivityInfoForPanel) => {
    if (newActivity.status !== "pending") return;
    if (!newActivity.txHash) {
      setActivities((prev) => [{ ...newActivity, status: "failed" }, ...prev]);
    } else {
      setActivities((prev) => [newActivity, ...prev]);
    }
  };

  return (
    <ActivityContext.Provider
      value={{
        activities,
        isLoadingActivities,
        addPendingActivity,
        refreshActivities,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivities() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivities must be used within an ActivityProvider");
  }
  return context;
}
