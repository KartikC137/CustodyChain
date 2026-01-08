"use client";
import { getSocket } from "@/lib/socket";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ActivityInfoForPanel } from "../lib/types/activity.types";
import { useWeb3 } from "./web3/Web3Context";
import { fetchActivitiesForPanel } from "@/app/api/clientActivity/fetchActivities";

interface ActivityContextType {
  activities: ActivityInfoForPanel[];
  isLoadingActivities: boolean;
  addPendingActivity: (activity: ActivityInfoForPanel) => void;
  refreshActivities: () => Promise<void>; // for manual refreshes
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { account } = useWeb3();
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

      setActivities((prev) =>
        prev.map((act) => {
          const isIdMatch = act.id.toString() === update.activityId.toString();
          const isHashMatch =
            act.status === "pending" &&
            act.tx_hash &&
            update.txHash &&
            act.tx_hash.toLowerCase() === update.txHash.toLowerCase();
          if (isIdMatch || isHashMatch) {
            return {
              ...act,
              id: BigInt(update.activityId),
              status: update.status,
              tx_hash: update.txHash,
              updated_at: new Date(update.updatedAt),
            };
          } else if (!act.tx_hash || !update.txHash) {
            return {
              ...act,
              status: "failed",
            };
          }
          return act;
        })
      );
    };

    socket.on("activity:update", handleUpdate);

    return () => {
      socket.off("activity:update", handleUpdate);
    };
  }, []);

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
