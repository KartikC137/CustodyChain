"use client";

import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";
import expandUp from "../../../public/icons/expand-up.svg";
import expandDown from "../../../public/icons/expand-down.svg";
import none from "../../../public/icons/none.svg";
import bin from "../../../public/icons/bin.svg";
import Image from "next/image";
import { useState, useRef } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { useEvidences } from "@/src/context-and-hooks/EvidencesContext";
import { SocketEvidenceDetails } from "@/src/lib/types/socketEvent.types";
import {
  bigintToDateWithTimeStamp,
  bigIntToIsoDate,
} from "@/src/lib/util/helpers";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import ScrollToTop from "@/src/components/features/buttons/ScrollToTopButton";
import {
  statusFilterKey,
  statusFilterType,
  ownershipFilterKey,
  ownershipFilterType,
  dateFilters,
  quickDateFiltersKey,
  quickDateFilters,
  customDateFilterKey,
  customDateFilterType,
} from "@/src/lib/util/filters";

export default function MyEvidencePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTopHidden, setIsTopHidden] = useState<boolean>(false);
  //Filters
  const [statusFilter, setStatusFilter] = useState<statusFilterType>("Active");
  const [ownershipFilter, setOwnershipFilter] =
    useState<ownershipFilterType>("all");
  const [customDateFilter, setCustomDateFilter] =
    useState<customDateFilterType>("ON");
  const [quickDateFilter, setQuickDateFilter] =
    useState<quickDateFiltersKey | null>(null);
  const [dateFilters, setDateFilters] = useState<dateFilters>({
    min: undefined,
    on: undefined,
    max: undefined,
  });

  // Sort values
  const [sortBy, setSortBy] = useState<"CREATED" | "UPDATED">("UPDATED");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { account } = useWeb3();
  const { evidences, isLoadingEvidences } = useEvidences();

  // Filter and sort order:
  // 1. status filter -> if discontinued and dates exist -> match discontinued and discontinuedAt
  // 2. Ownership filter -> check dates filter on every type
  // 3. sort on final filtered

  const isStatusFilterMatch = (e: SocketEvidenceDetails) =>
    statusFilter === "Active"
      ? e.status === "active"
      : statusFilter === "Discontinued"
        ? e.status === "discontinued" &&
          isDatesFilterMatch(e.discontinuedAt as bigint)
        : e.status === "active" || e.status === "discontinued";

  const isOwnershipfilterMatch = (e: SocketEvidenceDetails) =>
    ownershipFilter === "created"
      ? e.creator === account && isDatesFilterMatch(e.createdAt)
      : ownershipFilter === "received"
        ? e.currentOwner === account &&
          e.creator !== account &&
          isDatesFilterMatch(e.transferredAt)
        : ownershipFilter === "transferred"
          ? e.currentOwner !== account && isDatesFilterMatch(e.transferredAt)
          : isDatesFilterMatch(e.createdAt) ||
            isDatesFilterMatch(e.transferredAt);

  // for ranges, check if date is after minDate (excluded) and before maxDate (included)
  const isDatesFilterMatch = (rawDate: bigint) => {
    const isoDate = bigIntToIsoDate(rawDate);
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

  const hasDates = dateFilters.max || dateFilters.min || dateFilters.on;
  function handleCustomDateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDateFilters({
      min: undefined,
      on: undefined,
      max: undefined,
    });
    const formData = new FormData(e.currentTarget);
    const _min =
      customDateFilter === "BEFORE" ? undefined : formData.get("minDate");
    const _max =
      customDateFilter === "AFTER" ? undefined : formData.get("maxDate");
    e.currentTarget.reset();
    setDateFilters({
      min: customDateFilter === "ON" ? undefined : (_min as string),
      on: customDateFilter === "ON" ? (_min as string) : undefined,
      max: _max as string,
    });
  }

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

  // TODO 1. filter by description
  // 2. filter by account address
  return (
    <div className="relative h-full ">
      {/* Top Menu */}
      <div className="absolute top-0 right-0 left-0 px-5 pt-5 backdrop-blur-xs bg-orange-50/60 rounded-t-md border-b-2 border-orange-700">
        {/* Search and sort */}
        <div className="gap-x-2 flex items-center grid grid-cols-[5fr_0.8fr_2fr] ">
          <div>
            <Input
              className="rounded-r-none"
              placeholder="Search by ID, Account, Description etc"
            />
          </div>
          {/* hide filter menu button */}
          <Button
            className={`flex items-center justify-between py-1 pl-2 rounded-r-sm border-2 border-orange-700 bg-orange-50 font-mono font-[600] text-orange-700 ${
              isTopHidden
                ? "hover:font-[600] hover:bg-orange-200"
                : "bg-orange-500 font-[600] text-white"
            }`}
            onClick={() => {
              isTopHidden ? setIsTopHidden(false) : setIsTopHidden(true);
            }}
          >
            <span>EXPAND</span>
            <Image
              priority
              src={!isTopHidden ? expandUp : expandDown}
              alt="collapse top menu"
            />
          </Button>
          {/* sorter */}
          <div className="grid grid-cols-[2fr_1fr] gap-x-1">
            <nav
              className="grid grid-cols-[1fr_1fr] rounded-l-sm border-2 border-orange-700 bg-orange-50 font-mono font-[500] text-orange-700"
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
        {/* Filter Menu */}
        {!isTopHidden && (
          <div className="relative grid grid-rows-[1fr_1fr] mt-2 gap-x-3 p-4 bg-orange-100 rounded-sm border-2 border-orange-700">
            {/* clear all filters */}
            <Button
              className="absolute top-1 right-1 rounded-sm"
              variant="delete"
              onClick={() => {
                setDateFilters({
                  min: undefined,
                  on: undefined,
                  max: undefined,
                });
                setStatusFilter("Active");
                setOwnershipFilter("all");
              }}
            >
              <Image src={bin} alt="clear all date filters" />
            </Button>

            {/* row 1 */}
            <div className="grid grid-cols-[2fr_3fr] gap-x-2">
              <div>
                <label
                  htmlFor="filter-select"
                  className="font-mono font-medium text-lg text-orange-700"
                >
                  Status:
                </label>
                <nav
                  className="grid grid-cols-[1fr_1fr_1fr] *:p-3 border-2 border-orange-700 *:border-orange-700 bg-orange-50 font-mono font-[500] text-orange-700"
                  aria-label="Tabs"
                >
                  <button
                    onClick={() => {
                      if (statusFilter !== "All") {
                        setStatusFilter("All");
                      }
                    }}
                    type="button"
                    className={`py-2 px-3 ${
                      statusFilter === "All"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => {
                      if (statusFilter !== "Active") {
                        setStatusFilter("Active");
                      }
                    }}
                    type="button"
                    className={`py-2 px-3 border-x-2 ${
                      statusFilter === "Active"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    ACTIVE
                  </button>
                  <button
                    onClick={() => {
                      if (statusFilter !== "Discontinued") {
                        setStatusFilter("Discontinued");
                      }
                    }}
                    type="button"
                    className={`py-2 px-3 ${
                      statusFilter === "Discontinued"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    DISCONTINUED
                  </button>
                </nav>
              </div>
              {/* Custom date*/}
              <div>
                <label className="block font-mono font-medium text-lg text-orange-700">
                  Custom Date Filter:
                </label>
                <form
                  onSubmit={(e) => {
                    setQuickDateFilter(null);
                    handleCustomDateSubmit(e);
                  }}
                  className="grid grid-cols-[1fr_2fr_2fr_0.5fr] gap-x-1"
                >
                  <div className="group relative flex items-center justify-between text-sm text-orange-700 pl-2 border-2 rounded-sm bg-orange-50">
                    <span className="peer font-[600]">{customDateFilter}</span>
                    <div
                      className={`peer z-101 top-12 right-0 left-0 absolute hidden group-hover:flex flex-col 
                                  bg-orange-50 rounded-b-sm rounded-t-sm border-2 
                                  font-[500] 
                                  *:border-orange-700 *:py-2 *:border-t-2`}
                    >
                      {customDateFilterKey.map((c) => (
                        <Button
                          onClick={() => {
                            setCustomDateFilter(c as customDateFilterType);
                          }}
                          className={
                            c === customDateFilter
                              ? "bg-orange-500 font-[600] text-white"
                              : "hover:bg-orange-200 hover:font-[600]"
                          }
                          key={c}
                        >
                          {c}
                        </Button>
                      ))}
                    </div>
                    <span className="peer-hover:bg-orange-500 peer-hover:text-white mx-2 px-4 text-base rounded-full border-2 border-orange-700 text-orange-700 bg-orange-100">
                      ⯆
                    </span>
                  </div>
                  <Input
                    name="minDate"
                    disabled={customDateFilter === "BEFORE"}
                    className="h-[52px]"
                    type="date"
                    required
                  />
                  <Input
                    name="maxDate"
                    disabled={
                      customDateFilter === "AFTER" || customDateFilter === "ON"
                    }
                    className="h-[52px]"
                    type="date"
                    required
                  />
                  <Button
                    type="submit"
                    variant="add"
                    className="rounded-r-sm text-3xl text-center font-medium font-sans"
                  >
                    +
                  </Button>
                </form>
              </div>
            </div>

            {/* row 2 */}
            <div className="grid grid-cols-[1fr_1fr] gap-x-2">
              {/* todo add scroll to top on filter change */}
              {/* ownership */}
              <div>
                <label
                  htmlFor="filter-select"
                  className="font-mono font-medium text-lg text-orange-700"
                >
                  Ownership:
                </label>
                <nav
                  className="grid grid-cols-[1fr_1fr_1fr_1fr] *:p-3 rounded-r-sm border-2 border-orange-700 *:border-orange-700 bg-orange-50 font-mono font-[500] text-orange-700"
                  aria-label="Tabs"
                >
                  <button
                    onClick={() => {
                      if (ownershipFilter !== "all") {
                        setOwnershipFilter("all");
                      }
                    }}
                    type="button"
                    className={`${
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
                        setOwnershipFilter("created");
                      }
                    }}
                    type="button"
                    className={`border-x-2 ${
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
                        setOwnershipFilter("received");
                      }
                    }}
                    type="button"
                    className={`${
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
                        setOwnershipFilter("transferred");
                      }
                    }}
                    type="button"
                    className={`border-l-2 ${
                      ownershipFilter === "transferred"
                        ? "bg-orange-500 font-[600] text-white"
                        : "hover:rounded-b-sm hover:font-[600] hover:bg-orange-200"
                    }`}
                  >
                    TRANSFERRED
                  </button>
                </nav>
              </div>
              {/* filter by account */}
              <div>
                <label className="block font-mono font-medium text-lg text-orange-700">
                  Account:
                </label>
                <form className="grid grid-cols-[1fr_6fr_1fr] gap-x-1">
                  <button
                    onClick={() => {}}
                    className="p-2 rounded-l-sm text-orange-700 font-mono font-semibold border-2 border-orange-700"
                  >
                    {ownershipFilter === "received"
                      ? "FROM"
                      : ownershipFilter === "transferred"
                        ? "TO"
                        : "BY"}
                  </button>
                  {/* Todo add known account dropdown */}
                  <Input
                    placeholder="Enter Account Address"
                    name="account"
                    className="h-[52px] rounded-l-none"
                    type="search"
                  />
                  <Button
                    type="submit"
                    variant="add"
                    className="rounded-r-sm text-3xl text-center font-medium font-sans"
                  >
                    +
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* title */}
        <div className="flex flex-row py-5 items-center font-sans font-[500] text-orange-700 text-3xl">
          {/* status */}
          <div className="min-w-50 group relative flex items-center justify-between border-2 rounded-sm px-2 bg-orange-100">
            <span className="peer text-center w-full">{statusFilter}</span>
            <div
              className={`peer z-101 top-9 right-0 left-0 min-w-50 absolute hidden group-hover:flex flex-col 
              bg-orange-50 backdrop-blur-xs rounded-b-sm rounded-t-sm border-2 border-orange-700 
              text-base font-[500] text-orange-700 
              *:py-2 *:nth-[2]:border-y-2 *:nth-[2]:border-orange-700 `}
            >
              {statusFilterKey.map((s) => (
                <Button
                  onClick={() => {
                    setStatusFilter(s as statusFilterType);
                    scrollContainerRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className={
                    s === statusFilter
                      ? "bg-orange-500 font-[600] text-white"
                      : "hover:bg-orange-200 hover:font-[600]"
                  }
                  key={s}
                >
                  {s.toUpperCase()}
                </Button>
              ))}
            </div>
            <span className="peer-hover:bg-orange-500 peer-hover:text-white ml-2 px-4 text-base rounded-full border-2 border-orange-700 text-orange-700 bg-orange-50">
              ⯆
            </span>
          </div>
          <span className="mx-2">Evidences,</span>
          {/* ownership */}
          <div className="border-2 min-w-50 group relative flex items-center justify-between rounded-sm px-2 bg-orange-100">
            <span className="peer text-center w-full">{ownershipFilter}</span>
            <div
              className={`peer z-101 top-9 right-0 left-0 min-w-50 absolute hidden group-hover:flex flex-col 
              bg-orange-50 backdrop-blur-xs rounded-b-sm rounded-t-sm border-2 *:border-orange-700 
              text-base font-[500] text-orange-700 
              *:py-2 *:border-t-2 *:first:border-none`}
            >
              {ownershipFilterKey.map((o) => (
                <Button
                  onClick={() => {
                    setOwnershipFilter(o as ownershipFilterType);
                    scrollContainerRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className={`
                      ${
                        o === ownershipFilter
                          ? "bg-orange-500 font-[600] text-white"
                          : "hover:bg-orange-200 hover:font-[600]"
                      }
                    `}
                  key={o}
                >
                  {o.toUpperCase()}
                </Button>
              ))}
            </div>
            <span className="peer-hover:bg-orange-500 peer-hover:text-white ml-2 px-4 text-base rounded-full border-2 border-orange-700 text-orange-700 bg-orange-50">
              ⯆
            </span>
          </div>
          <span className="mx-2 ">by You @</span>
          {/* quick date filter dropdown */}
          <div
            className={`group relative flex items-center justify-between p-1 pl-3 text-lg border-2 border-orange-700 rounded-sm 
              ${hasDates ? "bg-orange-500  text-white" : "bg-orange-100 text-orange-700"}`}
          >
            <div className={`peer font-[600]`}>
              {hasDates ? (
                dateFilters.on ? (
                  <div>{dateFilters.on}</div>
                ) : dateFilters.max && dateFilters.min ? (
                  <div className="grid grid-cols-[2fr_0.5fr_2fr]">
                    <span>{dateFilters.min}</span>
                    <span className="mr-1 px-1 text-center bg-orange-100 text-orange-700 rounded-full">
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
                "Filter By Date"
              )}
            </div>
            <div
              className={`peer z-101 top-9 right-0 left-0 absolute hidden group-hover:flex flex-col min-w-40 
                                  rounded-b-sm rounded-t-sm 
                                  text-orange-700 font-[500] 
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
              className={`${!hasDates && "group-hover:bg-orange-500 group-hover:text-white peer-hover:bg-orange-500 peer-hover:text-white"} bg-orange-50 mx-2 px-3 text-sm rounded-full border-2 border-orange-700 text-orange-700`}
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
              className="ml-1 hover:bg-red-500 hover:text-white p-2 font-bold text-sm rounded-r-sm border-2 border-orange-700 text-red-700"
            >
              X
            </Button>
          )}
          <span className="ml-2">:</span>
        </div>
      </div>
      {/* Evidence list */}
      <div
        ref={scrollContainerRef}
        className={`scroll-smooth overflow-y-scroll h-full ml-5 pr-5 ${isTopHidden ? "pt-38" : "pt-88"}`}
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
                className={`my-2 p-4 rounded-sm font-mono font-semibold text-lg border-2 ${e.status === "active" ? "text-green-800 bg-green-50 border-green-700" : "text-gray-600 bg-gray-50 border-gray-500"}`}
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
      <ScrollToTop scrollContainerRef={scrollContainerRef} />
    </div>
  );
}
