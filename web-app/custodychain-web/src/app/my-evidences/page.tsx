"use client";

import Input from "@/src/components/ui/Input";
import { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { useEvidences } from "@/src/context-and-hooks/EvidencesContext";
import { SocketEvidenceDetails } from "@/src/lib/types/socketEvent.types";
import { bigIntToDate } from "@/src/lib/util/helpers";
import Link from "next/link";

export default function MyEvidencePage() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Discontinued"
  >("Active");
  const [roleFilter, setRoleFilter] = useState<"all" | "Owned" | "Created">(
    "Created",
  );
  const [dateFilter, setDateFilter] = useState<"createdAt" | "updatedAt">(
    "updatedAt",
  );
  const { account } = useWeb3();
  const { evidences, isLoadingEvidences } = useEvidences();

  const filterMatch = (e: SocketEvidenceDetails) =>
    (statusFilter === "all"
      ? e.status === "active" || e.status === "discontinued"
      : e.status === statusFilter.toLowerCase()) &&
    (roleFilter === "Created"
      ? e.creator === account
      : roleFilter === "Owned"
        ? e.currentOwner === account
        : e.creator === account || e.currentOwner === account);

  const sortMatch = (e: SocketEvidenceDetails) => e.createdAt === "some date";

  return (
    <div className="flex-none">
      <p className="font-sans font-[500] text-4xl text-orange-700">
        {statusFilter === "all" ? "All" : statusFilter} Evidences{", "}
        {roleFilter === "all" ? "Created or Owned" : roleFilter} by You:
      </p>

      <div className="grid grid-cols-[1fr_1fr] gap-x-2">
        <div className="grid grid-rows-[1fr_1fr] items-center">
          <Input id="search-evidence" placeholder="Search for Evidence" />
          <div className="grid grid-rows-[1fr_1fr] gap-y-1">
            <nav
              className="grid grid-cols-[1fr_1fr_1fr] border-2 border-orange-700 *:border-orange-700 bg-orange-50 font-mono font-[500] text-orange-900"
              aria-label="Tabs"
            >
              <button
                onClick={() => {
                  if (statusFilter !== "all") {
                    setStatusFilter("all");
                  }
                }}
                type="button"
                className={`py-2 px-3 ${
                  statusFilter === "all"
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

            <nav
              className="grid grid-cols-[1fr_1fr_1fr] border-2 border-orange-700 *:border-orange-700 bg-orange-50 font-mono font-[500] text-orange-900"
              aria-label="Tabs"
            >
              <button
                onClick={() => {
                  if (roleFilter !== "all") {
                    setRoleFilter("all");
                  }
                }}
                type="button"
                className={`py-2 px-3 ${
                  roleFilter === "all"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => {
                  if (roleFilter !== "Created") {
                    setRoleFilter("Created");
                  }
                }}
                type="button"
                className={`py-2 px-3 border-x-2 ${
                  roleFilter === "Created"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                CREATED
              </button>
              <button
                onClick={() => {
                  if (roleFilter !== "Owned") {
                    setRoleFilter("Owned");
                  }
                }}
                type="button"
                className={`py-2 px-3 ${
                  roleFilter === "Owned"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                OWNED
              </button>
            </nav>
          </div>
        </div>

        <div className="rounded-t-sm h-full border-2 border-orange-700"></div>
      </div>

      <div className="w-full h-[686px] overflow-y-auto">
        {isLoadingEvidences ? (
          <p className="animate-pulse text-center text-sm text-gray-500 p-4">
            Loading evidences...
          </p>
        ) : evidences.length === 0 ? (
          <p className="text-center text-sm text-gray-500 p-4">
            No evidences recorded.
          </p>
        ) : (
          evidences.map((e: SocketEvidenceDetails) => {
            if (filterMatch(e)) {
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
                    Creator:{" "}
                    <span className="text-orange-700">{e.creator}</span> @{" "}
                    {bigIntToDate(BigInt(e.createdAt)).toLocaleString()}
                    {e.status !== "active" && " to " + "(updatedAt) "}
                  </p>
                  <p>
                    {e.status === "active" ? "Current Owner: " : "Last Owner: "}
                    <span className="text-orange-700">
                      {e.currentOwner}
                    </span> @ {"(updatedAt)"}
                  </p>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
