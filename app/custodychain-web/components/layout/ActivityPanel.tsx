"use client";

import Link from "next/link";
import { useWeb3 } from "@/contexts/web3/Web3Context";
import { useActivities } from "../../contexts/ActivitiesContext";
import { ActivityInfoForPanel } from "../../lib/types/activity.types";

export default function ActivityPanel() {
  const { account } = useWeb3();
  const { activities, isLoadingActivities } = useActivities();

  return (
    <div className="rounded-md bg-orange-50 border-2 border-orange-700">
      <p className="pl-5 pt-3 font-sans font-[500] text-2xl text-orange-700">
        Activity:
      </p>

      <div className="max-h-[640px] p-5 space-y-2 overflow-y-auto">
        {!account ? (
          <p className="text-center text-sm text-gray-500 p-4">
            Connect your wallet to see activity.
          </p>
        ) : isLoadingActivities ? (
          <p className="text-center text-sm text-gray-500 p-4 animate-pulse">
            Loading activities...
          </p>
        ) : activities.length === 0 ? (
          <p className="text-center text-sm text-gray-500 p-4">
            No recent activity recorded.
          </p>
        ) : (
          activities.map((activity: ActivityInfoForPanel) => {
            const key = `${activity.tx_hash}-${activity.evidence_id}-${activity.status}-${activity.type}`;

            return (
              <div
                key={key}
                className="p-2 border-b border-orange-700 last:border-0 text-md font-mono"
              >
                <div className="flex justify-between items-center">
                  {/* TODO: 
                  update for : status - on_chain, db_only and type - fetch (if viable)
                  currently for : status - failed, pending and client_only and type - create, transfer, discontinue */}
                  <span
                    className={`font-semibold text-xs ${
                      activity.type === "discontinue"
                        ? "text-red-800"
                        : activity.type === "transfer"
                          ? "text-yellow-700"
                          : "text-green-800"
                    }`}
                  >
                    {activity.type.toUpperCase()}
                    {activity.status === "pending" ? "Pending" : ""}
                    {activity.status === "failed" ? "failed re" : ""}
                  </span>

                  <span className="text-[10px] text-orange-700">
                    {/* Handle Date serialization: Context ensures these are Date objects */}
                    date insert here
                  </span>
                </div>

                <Link
                  href={`/evidence/${activity.evidence_id}`}
                  className="block text-blue-600 hover:underline truncate text-xs mt-1"
                >
                  ID: {activity.evidence_id.slice(0, 10)}...
                </Link>

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
