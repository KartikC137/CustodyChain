"use client";

import Link from "next/link";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { useActivities } from "@/src/context-and-hooks/ActivitiesContext";
import { ActivityInfoForPanel } from "@/src/lib/types/activity.types";

export default function ActivityPanel() {
  const { account } = useWeb3();
  const { activities, isLoadingActivities } = useActivities();

  return (
    <div className="relative max-h-[686px] rounded-md bg-orange-50 border-2 border-orange-700">
      <div className="absolute p-3 top-0 right-0 left-0 backdrop-blur-xs bg-orange-100/75 rounded-t-md font-sans font-[500] text-2xl text-orange-900 border-b-2 border-orange-700">
        Activity:
      </div>

      <div className="h-full p-3 pt-[65px] overflow-y-auto">
        {!account ? (
          <p className="text-center text-sm text-gray-500 p-4">
            Connect your wallet to see activity.
          </p>
        ) : isLoadingActivities ? (
          <p className="animate-pulse text-center text-sm text-gray-500 p-4">
            Loading activities...
          </p>
        ) : activities.length === 0 ? (
          <p className="text-center text-sm text-gray-500 p-4">
            No recent activity recorded.
          </p>
        ) : (
          activities.map((activity: ActivityInfoForPanel) => {
            const key = `${activity.tx_hash}-${activity.evidence_id}-${activity.status}-${activity.type}-${activity.updated_at}`;
            // currently ignores fetch activities
            return (
              <div
                key={key}
                className={`p-2 border-b border-orange-700 last:border-0 ${
                  activity.status === "failed"
                    ? "**:text-gray-600"
                    : activity.status === "pending" &&
                      "animate-pulse **:text-gray-600"
                } ${activity.type === "fetch" && "hidden"}`}
              >
                <div className={`flex justify-between items-center`}>
                  {/* TODO: 
                  update for : status - on_chain, db_only 
                  currently for : status - failed, pending and client_only and type - create, transfer, discontinue */}
                  <span
                    className={`font sans font-[700] text-sm ${
                      activity.type === "transfer"
                        ? "text-yellow-700"
                        : activity.type === "discontinue"
                          ? "text-red-700"
                          : activity.type === "fetch"
                            ? "text-orange-700"
                            : activity.type === "create"
                              ? "text-green-800"
                              : "text-gray-700"
                    }`}
                  >
                    {/* update the error styles, display errors on hover */}
                    {activity.actor === account
                      ? activity.type.toUpperCase()
                      : activity.type === "discontinue"
                        ? "RECEIVED:DISCONTINUE"
                        : "RECEIVED"}
                    {activity.status === "pending"
                      ? ":pending"
                      : activity.status === "failed"
                        ? activity.error
                          ? ":failed, " + activity.error
                          : ":failed, unknown error"
                        : null}
                  </span>

                  <span className="font-mono text-sm text-orange-800">
                    {new Date(activity.updated_at as Date).toLocaleTimeString()}
                  </span>
                </div>

                <Link
                  href={`/evidence/${activity.evidence_id}`}
                  className="block hover:underline font-mono text-sm text-orange-800"
                >
                  <span>Evidence ID:</span> {activity.evidence_id.slice(0, 8)}
                  ...
                  {activity.evidence_id.slice(58, 66)}
                </Link>

                {activity.type === "transfer" && activity.to_addr && (
                  <div className="font-mono text-sm text-orange-800">
                    {activity.actor === account
                      ? "To: " +
                        activity.to_addr.slice(0, 8) +
                        "..." +
                        activity.to_addr.slice(24, 32)
                      : "From: " +
                        activity.actor.slice(0, 8) +
                        "..." +
                        activity.actor.slice(24, 32)}
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
