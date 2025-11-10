"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  type Activity,
  useActivityManager,
} from "@/lib/contexts/ActivityManagerContext";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

function formatActivityType(type: string): string {
  switch (type) {
    case "create":
      return "Created";
    case "transfer":
      return "Transferred";
    case "discontinue":
      return "Discontinued";
    default:
      return "Unknown Action";
  }
}

// // Helper function to format time (e.g., "5m ago")
// function formatTimeAgo(date: Date): string {
//   const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
//   let interval = seconds / 31536000; // years
//   if (interval > 1) return Math.floor(interval) + "y ago";
//   interval = seconds / 2592000; // months
//   if (interval > 1) return Math.floor(interval) + "mo ago";
//   interval = seconds / 86400; // days
//   if (interval > 1) return Math.floor(interval) + "d ago";
//   interval = seconds / 3600; // hours
//   if (interval > 1) return Math.floor(interval) + "h ago";
//   interval = seconds / 60; // minutes
//   if (interval > 1) return Math.floor(interval) + "m ago";
//   return Math.floor(seconds) + "s ago";
// }

export default function ActivityPanel() {
  const { account } = useWeb3();
  const { allAccounts } = useActivityManager();
  const [userActivities, setUserActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (account && allAccounts) {
      const profile = allAccounts.find(
        (p) => p.address.toLowerCase() === account.toLowerCase(),
      );
      if (profile) {
        setUserActivities(profile.activities.slice(0, 20)); // 20 most recent activities
      } else {
        setUserActivities([]);
      }
    } else {
      setUserActivities([]);
    }
  }, [account, allAccounts]);

  return (
    <div className="rounded-md bg-orange-50 border-2 border-orange-700">
      <p className="pl-5 pt-3 font-sans font-[500] text-2xl text-orange-700">
        Activity:
      </p>
      <div className="h-160 p-5 space-y-2 overflow-y-scroll">
        {!account ? (
          <p className="text-center text-sm text-gray-500 p-4">
            Connect your wallet to see activity.
          </p>
        ) : userActivities.length === 0 ? (
          <p className="text-center text-sm text-gray-500 p-4">
            No recent activity recorded.
          </p>
        ) : (
          userActivities.map((activity: Activity) => {
            const key = `${activity.evidenceId}-${activity.activityType}-${
              activity.transferredTo ?? "null"
            }-${activity.time}`;

            return (
              <div
                key={key}
                className="text-md font-mono border-b border-orange-400 pb-2"
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`font-semibold ${
                      activity.activityType === "discontinue"
                        ? "text-red-800"
                        : activity.activityType === "transfer"
                          ? "text-yellow-700"
                          : "text-green-800"
                    }`}
                  >
                    {formatActivityType(activity.activityType)}
                  </span>
                  <span className="text-xs text-orange-700">
                    {activity.time.toLocaleString()}
                  </span>
                </div>
                <Link
                  href={`/evidence/${activity.evidenceId}`}
                  className="block text-blue-600 hover:underline truncate text-xs"
                >
                  ID: {activity.evidenceId.slice(0, 12)}...
                </Link>
                {activity.activityType === "transfer" &&
                  activity.transferredTo && (
                    <p className="text-xs text-gray-700 truncate">
                      To: {activity.transferredTo}
                    </p>
                  )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
