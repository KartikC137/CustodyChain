"use client";

import Link from "next/link";
import Image from "next/image";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { useRef, useState } from "react";
import { useActivities } from "@/src/context-and-hooks/ActivitiesContext";
import ScrollToTop from "../features/buttons/ScrollToTopButton";
import { ActivityInfoForPanel } from "@/src/lib/types/activity.types";
import {
  dateFilters,
  baseActTypeFilterKey,
  baseActTypeFilterType,
  quickDateFiltersKey,
  quickDateFilters,
  customDateFilterKey,
  customDateFilterType,
} from "@/src/lib/util/filters";
import Button from "../ui/Button";
import reset from "../../../public/icons/reset.svg";
import { Temporal } from "@js-temporal/polyfill";
import { Address } from "@/src/lib/types/solidity.types";

const actTypeKey = ["activity", ...baseActTypeFilterKey, "discontinued"];
type actTypeFilter = "activity" | baseActTypeFilterType | "discontinued";
const statusFilterKey = ["All", "Success", "Pending", "Failed"] as const;
export default function ActivityPanel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { account } = useWeb3();
  const { activities, isLoadingActivities } = useActivities();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [actTypeFilter, setActTypeFilter] = useState<actTypeFilter>("activity");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilterKey)[number]>("Success");
  const [quickDateFilter, setQuickDateFilter] =
    useState<quickDateFiltersKey | null>(null);
  const [dateFilters, setDateFilters] = useState<dateFilters>({
    min: undefined,
    on: undefined,
    max: undefined,
  });

  // comparing only first string cuz of value mismatch
  const isActTypeMatch = (type: string, actor: Address) =>
    (actTypeFilter === "received"
      ? actor !== account
      : actTypeFilter === "transferred"
        ? type === "transfer" && actor === account
        : type.charAt(0) === actTypeFilter.charAt(0)) ||
    actTypeFilter === "activity"
      ? true
      : false;

  const isStatusFilterMatch = (status: string) =>
    statusFilter === "Success"
      ? status === "client_only"
      : statusFilter === "Pending"
        ? status === "pending"
        : statusFilter === "Failed"
          ? status === "failed"
          : true;
  const hasDates = dateFilters.max || dateFilters.min || dateFilters.on;
  // activities have updated_at of type Date
  const isDatesFilterMatch = (rawDate: Date) => {
    const isoDate = rawDate.toISOString().split("T")[0];
    if (dateFilters.on !== undefined) {
      return isoDate === dateFilters.on;
    } else if (dateFilters.min !== undefined && dateFilters.max !== undefined) {
      return isoDate >= dateFilters.min && isoDate <= dateFilters.max;
    } else if (dateFilters.min !== undefined) {
      return isoDate >= dateFilters.min;
    } else if (dateFilters.max !== undefined) {
      return isoDate <= dateFilters.max;
    }
    return true;
  };

  const filteredActivities = activities.filter(
    (a) =>
      isStatusFilterMatch(a.status) &&
      isActTypeMatch(a.type, a.actor) &&
      isDatesFilterMatch(a.updatedAt),
  );

  /**
   * @notice Currently sorting directly on the filtered
   */
  filteredActivities.sort((a, b) => {
    const aUpdatedAt = a.updatedAt.toISOString();
    const bUpdatedAt = b.updatedAt.toISOString();

    if (aUpdatedAt === bUpdatedAt) return 0;
    if (sortOrder === "asc") {
      return aUpdatedAt < bUpdatedAt ? -1 : 1;
    } else {
      return aUpdatedAt > bUpdatedAt ? -1 : 1;
    }
  });
  function handleQuickDateFilterSubmit(q: quickDateFiltersKey) {
    const currentDate = Temporal.Now.plainDateISO();
    let _min = undefined;
    let _on = undefined;
    let _max = q === "Today" ? undefined : currentDate.toString();

    switch (q) {
      case "Today":
        _min = undefined;
        _on = currentDate.toString();
        break;
      case "Last 7 Days":
        _min = currentDate.subtract({ days: 6 }).toString();
        break;
      case "Last 30 days":
        _min = currentDate.subtract({ days: 29 }).toString();
        break;
      case "Last 3 months":
        _min = currentDate.subtract({ months: 2 }).toString();
        break;
      case "Last 6 months":
        _min = currentDate.subtract({ months: 5 }).toString();
        break;
      case "2026":
        _min = "2026-01-01";
        break;
      default:
        _min = undefined;
        _on = undefined;
        _max = undefined;
        break;
    }
    setDateFilters({
      min: _min,
      on: _on,
      max: _max,
    });
  }
  return (
    <div className="relative overflow-hidden h-full rounded-md border-2 border-orange-700">
      {(statusFilter !== "Success" ||
        sortOrder !== "desc" ||
        actTypeFilter !== "activity") && (
        <Button
          className="z-100 absolute top-12 right-2 rounded-sm"
          variant="delete"
          onClick={() => {
            setDateFilters({
              min: undefined,
              on: undefined,
              max: undefined,
            });
            setActTypeFilter("activity");
            setStatusFilter("Success");
            setSortOrder("desc");
          }}
        >
          <Image src={reset} alt="clear all date filters" />
        </Button>
      )}
      {/* title */}
      <div
        className="z-99 absolute top-0 right-0 left-0 p-3 bg-orange-100/60 backdrop-blur-xs rounded-t-sm shadow-xl shadow-orange-500/20 
        font-sans text-orange-700"
      >
        {/* row 1 */}
        <div className="flex text-2xl mb-1 font-[500]">
          {/* activity type */}
          <div className="border-2 min-w-30 group relative flex items-center justify-between rounded-sm px-2 bg-orange-100">
            <span className="peer text-center w-full ">
              {actTypeFilter.charAt(0).toUpperCase() + actTypeFilter.slice(1)}
            </span>
            <div
              className={`peer z-101 top-8 right-0 left-0 absolute hidden group-hover:flex flex-col 
                        bg-orange-50 rounded-b-sm rounded-t-sm
                        text-base font-mono
                        *:py-2 *:border-b-2 *:border-x-2 *:border-orange-700`}
            >
              {actTypeKey.map((a) => (
                <Button
                  onClick={() => {
                    setActTypeFilter(a as actTypeFilter);
                    scrollContainerRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className={`first:border-t-2
                                ${
                                  a === actTypeFilter
                                    ? "bg-orange-500 font-[600] text-white"
                                    : "hover:bg-orange-200 hover:font-[600]"
                                }
                              `}
                  key={a}
                >
                  {a.toUpperCase()}
                </Button>
              ))}
            </div>
            <span className="peer-hover:bg-orange-500 peer-hover:text-white text-sm ml-2 my-1 px-3 rounded-full border-2 border-orange-700 text-orange-700 bg-orange-50">
              ⯆
            </span>
          </div>
          {/* todo: implement account filter here */}
          <div className="ml-2">by You:</div>
        </div>
        {/* row 2 */}
        <div className="flex">
          {/* status */}
          <div className="px-1 group relative min-w-32 flex items-center justify-between border-2 rounded-sm bg-orange-100">
            <span className="peer font-[600] text-center text-orange-700">
              {statusFilter}
            </span>
            <div
              className={`peer z-101 top-8 right-0 left-0 absolute hidden group-hover:flex flex-col 
                       backdrop-blur-xs rounded-b-sm rounded-t-sm
                      *:py-1 *:border-orange-700 *:border-b-2 *:border-x-2`}
            >
              {statusFilterKey.map((s) => (
                <Button
                  onClick={() => {
                    setStatusFilter(s);
                    scrollContainerRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className={`bg-orange-50 first:border-t-2 
                    ${
                      s === statusFilter
                        ? "first:border-2 bg-orange-500 font-[600] text-white"
                        : "hover:bg-orange-200 hover:font-[600]"
                    }`}
                  key={s}
                >
                  {s}
                </Button>
              ))}
            </div>
            <span
              className={`${!hasDates && "group-hover:bg-orange-500 group-hover:text-white peer-hover:bg-orange-500 peer-hover:text-white"} text-sm bg-orange-50 ml-2 my-1 px-3 rounded-full border-2 border-orange-700`}
            >
              ⯆
            </span>
          </div>
          <span className="mx-2 text-2xl font-sans font-[500] text-orange-700">
            At
          </span>
          {/* quick date filter dropdown */}
          <div
            className={`group relative flex px-1 min-w-30 items-center justify-between border-2 border-orange-700 rounded-sm font-[600]
                      ${hasDates ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700"}`}
          >
            <div className={`peer`}>
              {hasDates ? (
                dateFilters.on ? (
                  <div>{dateFilters.on}</div>
                ) : dateFilters.max && dateFilters.min ? (
                  <div className="grid grid-cols-[1fr_0.5fr_1fr] *:items-center *:flex">
                    <span>{dateFilters.min}</span>
                    <span className="mx-1 px-2 border-2 justify-center bg-orange-100 text-orange-700 rounded-full">
                      to
                    </span>
                    <span>{dateFilters.max}</span>
                  </div>
                ) : dateFilters.min ? (
                  <div className="grid grid-cols-2">
                    <span className="mr-2 text-center bg-orange-100 text-orange-700 rounded-full">
                      after
                    </span>
                    <span>{dateFilters.min}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2">
                    <span className="mr-2 text-center bg-orange-100 text-orange-700 rounded-full">
                      before
                    </span>
                    <span>{dateFilters.max}</span>
                  </div>
                )
              ) : (
                <span>Date</span>
              )}
            </div>
            <div
              className={`peer z-101 top-8 right-0 left-0 absolute hidden group-hover:flex flex-col 
                                          rounded-b-sm rounded-t-sm 
                                          font-[500] text-orange-700
                                          *:py-1 *:border-orange-700 *:border-b-2 *:border-x-2`}
            >
              {quickDateFilters.map((q) => (
                <Button
                  onClick={() => {
                    setQuickDateFilter(q);
                    handleQuickDateFilterSubmit(q);
                  }}
                  className={`bg-orange-50 first:border-t-2
                            ${
                              q === quickDateFilter
                                ? "bg-orange-500 font-[600] text-white"
                                : "hover:bg-orange-200 hover:font-[600]"
                            }
                          `}
                  key={q}
                >
                  {q}
                </Button>
              ))}
            </div>
            <span
              className={`${!hasDates && "group-hover:bg-orange-500 group-hover:text-white peer-hover:bg-orange-500 peer-hover:text-white"}  ml-2 my-1 px-3 rounded-full border-2 border-orange-700 text-sm text-orange-700 bg-orange-50`}
            >
              ⯆
            </span>
          </div>
          {hasDates && (
            <Button
              onClick={() => {
                setDateFilters({
                  min: undefined,
                  on: undefined,
                  max: undefined,
                });
                setQuickDateFilter(null);
              }}
              className="ml-1 hover:bg-red-500 hover:text-white px-2 font-bold text-sm rounded-r-sm border-2 border-orange-700 text-red-700"
            >
              X
            </Button>
          )}
        </div>
      </div>
      {/* sorter */}
      <button
        id="sortOrder-select"
        onClick={() => {
          if (sortOrder === "asc") {
            setSortOrder("desc");
          } else {
            setSortOrder("asc");
          }
        }}
        type="button"
        className={`absolute top-2 right-2 z-100 px-2 font-mono font-[600] text-white bg-orange-500 rounded-sm border-2 border-orange-700`}
      >
        {sortOrder === "desc" ? (
          <p>
            LATEST <span className="text-xl">⭫</span>
          </p>
        ) : (
          <p>
            OLDEST <span className="text-xl">⭭</span>
          </p>
        )}
      </button>
      <div
        ref={scrollContainerRef}
        className="overflow-y-scroll h-full pt-26 px-2"
      >
        {!account ? (
          <p className="text-center text-sm text-gray-500 p-4">
            Connect your wallet to see activity.
          </p>
        ) : !account || isLoadingActivities ? (
          <p className="animate-pulse text-center text-sm text-gray-500 p-4">
            Loading activities...
          </p>
        ) : filteredActivities.length === 0 ? (
          <p className="text-center text-sm text-gray-500 p-4">
            No recent activity recorded.
          </p>
        ) : (
          filteredActivities.map((activity: ActivityInfoForPanel) => {
            const key = `${activity.txHash}-${activity.evidenceId}-${activity.status}-${activity.type}-${activity.updatedAt}`;
            // currently ignores fetch activities
            return (
              <div
                key={key}
                className={`p-2 border-b rounded-sm border-orange-700 last:border-0 ${
                  activity.status === "failed"
                    ? "**:text-gray-600"
                    : activity.status === "pending" &&
                      "animate-pulse **:text-gray-600"
                } `}
              >
                <div className={`flex justify-between items-center`}>
                  {/* TODO: 
                  update for : status - on_chain, db_only 
                  currently for : status - failed, pending and client_only and type - create, transfer, discontinue, receive */}
                  <span
                    className={`font sans font-[700] text-sm ${
                      activity.type === "transfer"
                        ? "text-yellow-700"
                        : activity.type === "discontinue"
                          ? "text-red-700"
                          : activity.type === "create"
                            ? "text-green-800"
                            : "text-gray-700"
                    }`}
                  >
                    {activity.type === "transfer"
                      ? activity.actor !== account
                        ? "RECEIVE"
                        : "TRANSFER"
                      : activity.type.toUpperCase()}
                    {/* update the error styles, display errors on hover */}
                    {activity.status === "pending"
                      ? ":pending"
                      : activity.status === "failed"
                        ? activity.error
                          ? ":failed, " + activity.error
                          : ":failed, unknown error"
                        : null}
                  </span>

                  <span className="font-mono text-sm text-orange-800">
                    {activity.updatedAt.toLocaleString()}
                  </span>
                </div>

                <Link
                  href={`/evidence/${activity.evidenceId}`}
                  className="block hover:underline font-mono text-sm text-orange-800"
                >
                  <span>Evidence ID:</span> {activity.evidenceId.slice(0, 8)}
                  ...
                  {activity.evidenceId.slice(58, 66)}
                </Link>

                {activity.type === "transfer" && activity.owner && (
                  <div className="font-mono text-sm text-orange-800">
                    {activity.actor === account
                      ? "To: " +
                        activity.owner.slice(0, 8) +
                        "..." +
                        activity.owner.slice(24, 32)
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
      <ScrollToTop scrollContainerRef={scrollContainerRef}></ScrollToTop>
    </div>
  );
}
