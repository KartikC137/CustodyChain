"use client";

import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";
import expandUp from "../../../public/icons/expand-up.svg";
import expandDown from "../../../public/icons/expand-down.svg";
import none from "../../../public/icons/none.svg";
import bin from "../../../public/icons/bin.svg";
import Image from "next/image";
import { useState } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { useEvidences } from "@/src/context-and-hooks/EvidencesContext";
import { SocketEvidenceDetails } from "@/src/lib/types/socketEvent.types";
import {
  bigintToDateWithTimeStamp,
  bigIntToIsoDate,
} from "@/src/lib/util/helpers";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

const currentYear = new Date().getFullYear();
let pastYear = 0;
if (currentYear > 2026) {
  pastYear = currentYear;
}

// todo fix this
// heirarchy values : no date set: -1, custom date set: 0, days: 1,1,2, weeks: 3,3,4 and so on
const quickDateFilters = {
  Today: ["Today", "Yesterday", "Past 3 Days"],
  Weeks: ["This Week", "Past Week", "Past 3 Weeks"],
  Months: ["This Month", "Past Month", "Past 3 Months", "Past 6 Months"],
  Years:
    pastYear > 0
      ? [
          pastYear.toString(),
          (pastYear - 1).toString(),
          (pastYear - 2).toString(),
          (pastYear - 3).toString(),
        ]
      : ["2026"],
};
const quickDateFilterKey = Object.keys(quickDateFilters);

type SortDateValueType = "CREATED" | "UPDATED";
type statusFilterType = "All" | "Active" | "Discontinued";
const statusFilterKey = ["All", "Active", "Discontinued"];
interface dateFilters {
  range: string[]; // minDate,maxDate
  distinct: string[]; // separate dates
  hValue: number; // heirarchy value
}
export default function MyEvidencePage() {
  const [isTopHidden, setIsTopHidden] = useState<boolean>(false);
  //Filters
  const [statusFilter, setStatusFilter] = useState<statusFilterType>("Active");
  const [ownershipFilter, setRoleFilter] = useState<
    "all" | "created" | "received" | "transferred"
  >("all");
  const [dateFilters, setDateFilters] = useState<dateFilters>({
    range: [],
    distinct: [],
    hValue: -1,
  });
  console.info("Dates filter set,", dateFilters);

  // Sort values
  const [sortBy, setSortBy] = useState<SortDateValueType>("UPDATED");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { account } = useWeb3();
  const { evidences, isLoadingEvidences } = useEvidences();

  // Filter and sort order:
  // 1. status filter -> if discontinued and dates exist -> match discontinued and discontinuedAt
  // 2. Ownership filter -> check dates filter on every type
  // 3. sort on final filtered
  const rLen = dateFilters.range.length;
  const dLen = dateFilters.distinct.length;
  const isStatusFilterMatch = (e: SocketEvidenceDetails) =>
    statusFilter === "All"
      ? e.status === "active" ||
        (e.status === "discontinued" &&
          isDatesFilterMatch(e.discontinuedAt as bigint))
      : e.status === statusFilter.toLowerCase();

  const isOwnershipfilterMatch = (e: SocketEvidenceDetails) =>
    ownershipFilter === "created"
      ? e.creator === account && isDatesFilterMatch(e.createdAt)
      : ownershipFilter === "received"
        ? e.currentOwner === account &&
          e.creator !== account &&
          isDatesFilterMatch(e.transferredAt)
        : ownershipFilter === "transferred"
          ? e.currentOwner !== account && isDatesFilterMatch(e.createdAt)
          : (e.creator === account && isDatesFilterMatch(e.createdAt)) ||
            (e.currentOwner === account && isDatesFilterMatch(e.transferredAt));

  /**
   *
   * @param firstDate only firstDate: checks if firstDate is unique filter
   * @param maxDate firstDate != maxDate : checks if the range matches, firstDate == maxDate: checks if the firstDate is within the range
   * @returns boolean
   */
  const isDateIncluded = (
    firstDate: Temporal.PlainDate | string,
    maxDate?: Temporal.PlainDate | string,
  ) => {
    const d = firstDate.toString();
    if (!maxDate) {
      return dateFilters.distinct.includes(d);
    } else {
      const maxD = maxDate.toString();
      return d >= dateFilters.range[0] && dateFilters.range[1] <= maxD;
    }
  };

  // for ranges, check if date is after minDate and before maxDate (exclusive)
  const isDatesFilterMatch = (rawDate: bigint) => {
    const isoDate = bigIntToIsoDate(rawDate);
    // empty arrays / invalid arrays = include all i.e return true
    let distinctMatch = true;
    let rangeMatch = true;
    if (rLen === 2) {
      rangeMatch = isDateIncluded(isoDate, isoDate);
    }
    if (dLen > 0) {
      distinctMatch = isDateIncluded(isoDate);
    }
    return distinctMatch && rangeMatch;
  };

  const filteredEvidences = evidences.filter(
    (e) => isStatusFilterMatch(e) && isOwnershipfilterMatch(e),
  );

  /**
   * @notice Currently sorting directly on the filtered
   */
  filteredEvidences.sort((a, b) => {
    const aUpdatedAt = a.discontinuedAt || a.transferredAt;
    const bUpdatedAt = b.discontinuedAt || b.transferredAt;

    const valA = sortBy === "CREATED" ? a.createdAt : aUpdatedAt;
    const valB = sortBy === "CREATED" ? b.createdAt : bUpdatedAt;
    if (valA === valB) return 0;
    if (sortOrder === "asc") {
      return valA < valB ? -1 : 1;
    } else {
      return valA > valB ? -1 : 1;
    }
  });

  function handleCustomDateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const minDate = formData.get("minDate") as string;
    const maxDate = formData.get("maxDate") as string;
    setDateFilters((prev) => ({
      ...prev,
      range: [minDate, maxDate],
    }));
  }

  function handleQuickDateFilterSubmit(i: string) {
    const currentDate = Temporal.Now.plainDateISO();
    let dis: string = "";
    let dur: string[] = [];
    if (i === "Today") {
      if (dateFilters.distinct.includes(currentDate.toString())) {
      } else {
        dis = currentDate.toString();
      }
    } else if (i === "Yesterday") {
      const yd = currentDate.subtract({ days: 1 }).toString();
      if (dateFilters.distinct.includes(yd)) {
      } else {
        dis = yd;
      }
    } else if (i === "Past 3 Days") {
      const minDate = currentDate.subtract({ days: 3 }).toString();
      const maxDate = currentDate.toString();
      dur.push(minDate, maxDate);
    }
    setDateFilters((prev) => ({
      ...prev,
      distinct: dis === "" ? [...prev.distinct] : [...prev.distinct, dis],
      range: dur,
    }));
  }

  const isQuickDateFilterDisabled = (hToCheck: number) => {
    const currH = dateFilters.hValue;
    return currH > hToCheck;
  };

  return (
    <div className="relative h-full rounded-t-sm">
      {/* Top Menu */}
      <div className="absolute top-0 right-0 left-0 backdrop-blur-xs bg-orange-100/60 rounded-t-md  border-orange-700">
        <div className="pt-5 mb-7 px-3 flex flex-row justify-between">
          {/* title */}
          <div>
            <span className="font-sans font-[500] text-orange-700 text-3xl">
              {statusFilter} Evidences{", "}
              {ownershipFilter === "all"
                ? "created, received or transferred"
                : ownershipFilter}{" "}
              by You:
            </span>
            {/* Date chips */}
            <div
              className={`${(rLen == 2 || dLen > 0) && "border-none"} border-2 h-5 mt-4 rounded-full  bg-orange-100 text-orange-700 text-sm *:font-sans *:font-bold *:border-y-2 *:border-orange-700`}
            >
              {rLen == 2 && (
                <>
                  <span className="pl-2 py-2 border-l-2 rounded-full">
                    {dateFilters.range[0]}
                  </span>
                  <span className="px-1 border-x-2 mx-1 rounded-full">to</span>
                  <span className="pr-2 py-2 border-r-2 rounded-full">
                    {dateFilters.range[1]}
                    <Button className="ml-2 px-2 rounded-full border-2 border-red-600 text-red-600 hover:text-white hover:bg-red-600/75 hover:border-red-600">
                      X
                    </Button>
                  </span>
                </>
              )}
              {dLen > 0 &&
                dateFilters.distinct.map((d) => (
                  <>
                    <span key={d} className="ml-2 p-2 border-2 rounded-full">
                      {d}
                      <Button className="ml-2 px-2 rounded-full border-2 border-red-600 text-red-600 hover:text-white hover:bg-red-600/75 hover:border-red-600">
                        X
                      </Button>
                    </span>
                    {/* <Button className="hover:bg-orange-500! hover:text-white px-2 border-2 rounded-full">
                      X
                    </Button> */}
                  </>
                ))}
            </div>
          </div>
          <div>
            {/* Sorter */}
            <div className="grid grid-cols-[2fr_1fr] gap-x-1">
              <nav
                className="grid grid-cols-[1fr_1fr] rounded-l-sm border-2 border-orange-700 bg-orange-50 font-mono font-[500] text-orange-900"
                aria-label="Tabs"
              >
                <button
                  onClick={() => {
                    if (sortBy !== "UPDATED") {
                      setSortBy("UPDATED");
                    }
                  }}
                  type="button"
                  className={
                    sortBy === "UPDATED"
                      ? "bg-orange-500 font-[600] text-white"
                      : "hover:rounded-sm hover:font-[600] hover:bg-orange-200"
                  }
                >
                  UPDATED
                </button>
                <button
                  onClick={() => {
                    if (sortBy !== "CREATED") {
                      setSortBy("CREATED");
                    }
                  }}
                  type="button"
                  className={
                    sortBy === "CREATED"
                      ? "bg-orange-500 font-[600] text-white"
                      : "hover:font-[600] hover:bg-orange-200"
                  }
                >
                  CREATED
                </button>
              </nav>
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
                className={`px-2 font-mono font-[600] text-white bg-orange-500 rounded-r-sm border-2 border-orange-700`}
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
            </div>
          </div>
        </div>
        {/* Filter Menu */}
        {!isTopHidden && (
          <div className="relative grid grid-cols-[1fr_1fr] gap-x-3 p-4 bg-orange-100 m-2 rounded-sm border-2 border-orange-700">
            {/* clear all filters */}
            <Button
              className="absolute top-1 right-1 rounded-sm"
              variant="delete"
              onClick={() => {
                setDateFilters({
                  range: [],
                  distinct: [],
                  hValue: -1,
                });
                setStatusFilter("Active");
                setRoleFilter("all");
              }}
            >
              <Image src={bin} alt="clear all date filters" />
            </Button>

            {/* 1. search and status cum account filter */}
            <div>
              {/* search bar */}
              <label
                htmlFor="filter-select"
                className="block font-mono font-medium text-lg text-orange-900"
              >
                Search Evidence:
              </label>
              <Input
                className="mb-2 h-[52px] rounded-t-sm rounded-b-none"
                placeholder="Search by ID, Creator, Current Owner etc"
              />
              {/* filter by status */}
              <label
                htmlFor="filter-select"
                className="grid grid-cols-[2fr_5fr] gap-x-2 font-mono font-medium text-lg text-orange-900"
              >
                Status:<span>Filter By Ownership:</span>
              </label>
              <div className="grid grid-cols-[2fr_5fr] gap-x-2">
                {/* Status */}
                <div className="relative group rounded-sm flex items-center justify-between px-4 py-3 bg-orange-500 text-md text-white font-mono font-[600] border-2 border-orange-700">
                  <p>{statusFilter}</p>
                  <div
                    className="text-center h-[20px] w-[20px] rounded-full 
                          bg-orange-50 text-orange-500"
                  >
                    ⯆
                  </div>
                  <div className="z-100 absolute hidden group-hover:flex flex-col top-12 right-0 left-0 bg-orange-50 backdrop-blur-xs rounded-b-sm border-2 border-orange-700 text-orange-700 *:py-2 *:border-b-2 *:last:border-none">
                    {statusFilterKey.map((s) => (
                      <Button
                        onClick={() => {
                          setStatusFilter(s as statusFilterType);
                        }}
                        className="hover:bg-orange-500 hover:text-white hover:font-bold"
                        key={s}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <nav
                  className="grid grid-cols-[1fr_1fr_1fr_1fr] rounded-b-sm border-2 border-orange-700 *:border-orange-700 bg-orange-50 font-mono font-[500] text-orange-900"
                  aria-label="Tabs"
                >
                  <button
                    onClick={() => {
                      if (ownershipFilter !== "all") {
                        setRoleFilter("all");
                      }
                    }}
                    type="button"
                    className={`py-2 px-3 ${
                      ownershipFilter === "all"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:rounded-b-sm hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => {
                      if (ownershipFilter !== "created") {
                        setRoleFilter("created");
                      }
                    }}
                    type="button"
                    className={`py-2 px-3 border-x-2 ${
                      ownershipFilter === "created"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    CREATED
                  </button>
                  <button
                    onClick={() => {
                      if (ownershipFilter !== "received") {
                        setRoleFilter("received");
                      }
                    }}
                    type="button"
                    className={`py-2 px-3 ${
                      ownershipFilter === "received"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:rounded-b-sm hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    RECEIVED
                  </button>
                  <button
                    onClick={() => {
                      if (ownershipFilter !== "transferred") {
                        setRoleFilter("transferred");
                      }
                    }}
                    type="button"
                    className={`py-2 px-3 border-l-2 ${
                      ownershipFilter === "transferred"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:rounded-b-sm hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    TRANSFERRED
                  </button>
                </nav>
              </div>
            </div>

            {/* 2. date filter */}

            <div>
              <label className="block font-mono font-medium text-lg text-orange-900">
                Filter By Date:
              </label>
              {/* Quick date select */}
              <div
                className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-x-1 mb-2
                        *:rounded-sm *:flex *:items-center *:justify-between *:px-4 *:py-3 *:bg-orange-500 *:text-md *:text-white *:font-mono *:font-[600] *:border-2 *:border-orange-700"
              >
                {Object.entries(quickDateFilters).map(([key, values]) => (
                  <div key={key} className="relative group hover:rounded-sm">
                    <p>{key}</p>
                    <div
                      className="flex items-center justify-center h-[20px] w-[20px] rounded-full 
                          bg-orange-50 text-orange-500"
                    >
                      ⯆
                    </div>
                    <div className="hidden group-hover:flex flex-col absolute top-12 right-0 left-0 bg-orange-50 backdrop-blur-xs rounded-b-sm border-2 border-orange-700 text-orange-700 *:py-2 *:border-b-2 *:last:border-none">
                      {values.map((i: any) => (
                        <Button
                          onClick={() => {
                            handleQuickDateFilterSubmit(i);
                          }}
                          className="hover:bg-orange-500 hover:text-white hover:font-bold"
                          key={i}
                        >
                          {i}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom date select */}
              <label className="block font-mono font-medium text-lg text-orange-900">
                Custom Date Filter:
              </label>
              <form
                onSubmit={handleCustomDateSubmit}
                className="grid grid-cols-[1fr_1fr_1fr_0.5fr] gap-x-1"
              >
                <button
                  onClick={() => {}}
                  className="flex items-center justify-between p-2 rounded-l-sm bg-orange-500 text-sm text-white font-sans font-[600] border-2 border-orange-700"
                >
                  <p>On</p>
                  <div className="h-[20px] w-[20px] rounded-full bg-orange-50 text-orange-500">
                    ⯆
                  </div>
                </button>
                <Input name="minDate" className="h-[52px]" type="date" />
                <Input name="maxDate" className="h-[52px]" type="date" />
                <Button
                  type="submit"
                  variant="add"
                  className="rounded-full text-3xl text-center font-medium font-sans"
                >
                  +
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* TODO fix this button's bg and placement in firefox */}
        {/* Hide Menu button */}
        <button
          className="flex flex-row items-center place-self-end mr-2 mb-[-50px] pr-2 rounded-full font-sans text-sm text-orange-700 font-semibold bg-orange-100 border-2 border-orange-700 "
          onClick={() => {
            isTopHidden ? setIsTopHidden(false) : setIsTopHidden(true);
          }}
        >
          <Image
            priority
            src={!isTopHidden ? expandUp : expandDown}
            alt="collapse top menu"
          />
          <span>Show filters</span>
        </button>
      </div>
      {/* Evidence list */}
      <div
        className={`overflow-y-scroll h-full ${isTopHidden ? "pt-30" : "pt-84"}`}
      >
        {isLoadingEvidences ? (
          <p className="p-4 animate-pulse text-center text-sm text-gray-500">
            Loading evidences...
          </p>
        ) : filteredEvidences.length === 0 ? (
          // todo : if filters are on, add a clear filter button here
          <div className="flex items-center justify-center gap-4 p-4">
            <Image priority src={none} alt="no evidences found" />
            <div className="font-sans text-4xl text-orange-700">
              No evidences found
            </div>
          </div>
        ) : (
          filteredEvidences.map((e: SocketEvidenceDetails) => {
            const key = `${e.id}`;
            return (
              <div
                key={key}
                className={`mx-2 my-2 p-4 rounded-sm font-mono font-semibold text-lg border-2 ${e.status === "active" ? "text-green-800 bg-green-50 border-green-700" : "text-gray-600 bg-gray-50 border-gray-500"}`}
              >
                <Link href={`/evidence/${e.id}`} className="block font-mono">
                  ID:{" "}
                  <span className="hover:underline text-orange-700">
                    {e.id}
                  </span>
                </Link>
                <p>
                  Description:{" "}
                  <span className="text-orange-700">{e.description}</span>
                </p>
                <p>
                  Creator: <span className="text-orange-700">{e.creator}</span>{" "}
                  @ {bigintToDateWithTimeStamp(e.createdAt).toLocaleString()}
                  {e.status !== "active" &&
                    " to " +
                      bigintToDateWithTimeStamp(
                        e.discontinuedAt as bigint,
                      ).toLocaleString()}
                </p>
                <p>
                  {e.status === "active" ? "Current Owner: " : "Last Owner: "}
                  <span className="text-orange-700">
                    {e.currentOwner}
                  </span> @{" "}
                  {bigintToDateWithTimeStamp(e.transferredAt).toLocaleString()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
