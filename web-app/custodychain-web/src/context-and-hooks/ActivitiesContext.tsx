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
import { fetchActivitiesForPanel } from "../api/activities/fetchActivities";

interface ActivityContextType {
  activities: ActivityInfoForPanel[];
  isLoadingActivities: boolean;
  addPendingActivity: (activity: ActivityInfoForPanel) => void;
  refreshActivities: () => Promise<void>; // for manual refreshes
}

/**
 * @notice Only handles client_only, pending and failed.
 * @dev when an activity of type transfer and client_only and where actor not equal to account is received (i.e evidence was transferred from someone else)
 *      it has to be inserted as new, as it was never inserted by any transfer form.
 * @todo fix evidences and activities context
 *
 */
const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { account } = useWeb3();
  const { updateEvidence, insertEvidence } = useEvidences();
  const [activities, setActivities] = useState<ActivityInfoForPanel[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const refreshActivities = useCallback(async () => {
    if (!account) {
      setActivities([]);
      return;
    }

    setIsLoadingActivities(true);
    try {
      const data = await fetchActivitiesForPanel(account, 20);
      console.info("acitvities fetced", data);
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

    const handleUpdate = (update: any) => {
      console.log("Socket Update Received:", update);

      if (update.status === "client_only") {
        if (update.type === "create") {
          insertEvidence({
            evidence_id: update.evidenceId,
            status: "active",
            description: update.desc,
            creator: update.account,
            created_at: update.createdAt,
            current_owner: update.account,
            updated_at: update.updatedAt,
          });
        } else {
          if (update.account !== account) {
            console.info(
              "Recieve triggered------------------------------",
              update.account,
              account,
            );
            // evidence was received, insert new evidence and activity
            addPendingActivity({
              id: update.id,
              status: "client_only",
              type: update.type,
              actor: update.account,
              tx_hash: update.txHash,
              updated_at: update.updatedAt,
              evidence_id: update.evidenceId,
              owner: update.toAddr,
              to_addr: update.toAddr,
            });
          } else {
            updateEvidence(
              update.evidenceId,
              update.type,
              update.updatedAt,
              update.toAddress,
              update.createdAt,
            );
          }
        }
      }

      // updates only pending activities inserted by client
      setActivities((prev) =>
        prev.map((act) => {
          if (act.status === "pending") {
            if (act.tx_hash && update.txHash) {
              const isHashMatch = act.tx_hash.toLowerCase() === update.txHash;
              if (isHashMatch) {
                return {
                  ...act,
                  id: BigInt(update.activityId),
                  status: update.status,
                  tx_hash: update.txHash,
                  updated_at: update.updatedAt,
                  error: update.error || undefined,
                };
                // txHash can be missing in failed activities, fallback to other checks
              } else if (update.status === "failed") {
                const isActMatch =
                  act.evidence_id.toLowerCase() === update.evidenceId &&
                  act.type === update.type;
                if (isActMatch) {
                  return {
                    ...act,
                    id: BigInt(update.activityId),
                    status: update.status,
                    tx_hash: update.txHash || null,
                    updated_at: update.updatedAt || null,
                    error: update.error || undefined,
                  };
                }
                // otherwise its failed to avoid infinite pending state
                return {
                  ...act,
                  status: "failed",
                  error: update.error,
                };
              }
            }
          }
          return act;
        }),
      );
    };

    socket.on("activity_update", handleUpdate);

    return () => {
      socket.off("activity_update", handleUpdate);
    };
  }, [account]);

  const addPendingActivity = (newActivity: ActivityInfoForPanel) => {
    setActivities((prev) => [newActivity, ...prev]);
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
