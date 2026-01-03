"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import { fetchActivitiesByAccount } from "../../../chain-listener/src/dispatchers/clientActivity/fetchClientActivity";
import { ActivityRow } from "../../../chain-listener/src/types/activity.types";
import { Address } from "viem";

export default function ActivityPanel() {
  const { account } = useWeb3();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchActivitiesByAccount(account as Address, 10);
      setActivities(data);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setError("Failed to load activities.");
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (!account) return;
    loadActivities();
  }, [account]);

  function formatActivityType(type: string) {
    return type.toUpperCase();
  }

  // 3. Render Logic
  return (
    <div className="rounded-md bg-orange-50 border-2 border-orange-700 flex flex-col">
      <p className="pl-5 pt-3 font-sans font-[500] text-2xl text-orange-700">
        Activity:
      </p>

      <div className="flex-1 p-5 space-y-2 overflow-y-auto max-h-[400px]">
        {/* State: Wallet not connected */}
        {!account ? (
          <p className="text-center text-sm text-gray-500 p-4">
            Connect your wallet to see activity.
          </p>
        ) : isLoading ? (
          /* State: Loading */
          <p className="text-center text-sm text-gray-500 p-4 animate-pulse">
            Loading activities...
          </p>
        ) : error ? (
          /* State: Error */
          <p className="text-center text-sm text-red-500 p-4">{error}</p>
        ) : activities.length === 0 ? (
          /* State: Empty */
          <p className="text-center text-sm text-gray-500 p-4">
            No recent activity recorded.
          </p>
        ) : (
          /* State: List */
          activities.map((activity) => {
            // Create a unique key
            const key = `${activity.evidence_id}-${activity.type}-${activity.updated_at}`;

            return (
              <div
                key={key}
                className="text-md font-mono border-b border-orange-400 pb-2 last:border-0"
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`font-semibold text-xs ${
                      activity.type === "discontinue"
                        ? "text-red-800"
                        : activity.type === "transfer"
                          ? "text-yellow-700"
                          : "text-green-800"
                    }`}
                  >
                    {formatActivityType(activity.type)}
                  </span>
                  <span className="text-[10px] text-orange-700">
                    {/* Handle Date serialization from Server Action */}
                    {new Date(activity.updated_at).toLocaleString()}
                  </span>
                </div>

                <Link
                  href={`/evidence/${activity.evidence_id}`}
                  className="block text-blue-600 hover:underline truncate text-xs mt-1"
                >
                  ID: {activity.evidence_id.slice(0, 10)}...
                </Link>

                {/* Conditionally render TO/FROM based on columns */}
                {activity.type === "transfer" && activity.to_addr && (
                  <div className="text-[10px] text-gray-600 truncate">
                    To: {activity.to_addr.slice(0, 10)}...
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
