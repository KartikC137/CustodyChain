"use client";
import { getSocket } from "../config/socket";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ActivityInfoForPanel } from "../lib/types/activity.types";
import { useWeb3 } from "./Web3Context";
import { useEvidences } from "./EvidencesContext";
import { fetchActivities } from "../api/activities/fetchActivities";
import { SocketUpdateSchema } from "../lib/types/socketEvent.types";

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
  const { account } = useWeb3();
  const { insertEvidence, updateEvidence } = useEvidences();
  const [activities, setActivities] = useState<ActivityInfoForPanel[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const refreshActivities = useCallback(async () => {
    setIsLoadingActivities(true);

    try {
      if (!account) {
        return;
      }
      const data = await fetchActivities(account, false);
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

    const handleUpdate = (rawUpdate: any) => {
      const result = SocketUpdateSchema.safeParse(rawUpdate);
      if (!result.success) {
        console.error("parse error", result.error);
        return;
      } // maybe throw here
      const update = result.data;
      console.info("Socket Update Parsed:", update);

      setActivities((prev) => {
        const targetIndex = prev.findIndex(
          (act) =>
            act.status === "pending" &&
            update.txHash &&
            act.txHash &&
            act.txHash.toLowerCase() === update.txHash,
        );
        if (targetIndex === -1) {
          console.info("activity not in context");
          return prev;
        }
        const newActivities = [...prev];
        newActivities[targetIndex] = {
          ...newActivities[targetIndex],
          id: update.activityId,
          status: update.status,
          txHash: update.txHash,
          updatedAt: update.updatedAt,
          error: update.status === "failed" ? update.error : undefined,
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
                type: "receive",
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
