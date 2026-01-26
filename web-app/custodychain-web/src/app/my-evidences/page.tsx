"use client";

import Input from "@/src/components/ui/Input";
import { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { Address } from "@/src/lib/types/solidity.types";
import {
  StatusFilter,
  RoleFilter,
  EvidenceRow,
} from "@/src/lib/types/evidence.types";
import { useEvidences } from "@/src/context-and-hooks/EvidencesContext";

export default function MyEvidencePage() {
  const { account } = useWeb3();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [evidences, setEvidences] = useState<EvidenceRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("created");

  const { allEvidences } = useEvidences();

  console.info("All evidences fetched/udpated lalu", {
    allEvidences,
  });
  return (
    <div className="flex-none">
      <p className="font-sans font-sans font-[500] text-4xl text-orange-700">
        Your Evidences
      </p>
      <div className="grid grid-rows-[1fr_1fr] *:gap-x-3 items-center  mb-4">
        <div className="grid grid-cols-[1fr_1fr] items-start">
          <Input id="search-evidence" placeholder="Search for Evidence" />
          <div className="rounded-t-sm h-full border-2 border-orange-700">
            DATE SELECTOR
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr] items-center">
          <div className="grid grid-rows-[1fr_1fr] gap-y-1">
            <nav
              className="grid grid-cols-[1fr_1fr_1fr] border-2 border-orange-700 *:border-orange-700 bg-orange-50 font-mono font-[500] text-orange-900"
              aria-label="Tabs"
            >
              <button
                onClick={() => {
                  if (statusFilter !== "all") {
                    setStatusFilter("all");
                    setEvidences(null);
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
                  if (statusFilter !== "active") {
                    setStatusFilter("active");
                    setEvidences(null);
                  }
                }}
                type="button"
                className={`py-2 px-3 border-x-2 ${
                  statusFilter === "active"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => {
                  if (statusFilter !== "discontinued") {
                    setStatusFilter("discontinued");
                    setEvidences(null);
                  }
                }}
                type="button"
                className={`py-2 px-3 ${
                  statusFilter === "discontinued"
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
                    setEvidences(null);
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
                  if (roleFilter !== "created") {
                    setRoleFilter("created");
                    setEvidences(null);
                  }
                }}
                type="button"
                className={`py-2 px-3 border-x-2 ${
                  roleFilter === "created"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                CREATED
              </button>
              <button
                onClick={() => {
                  if (roleFilter !== "owned") {
                    setRoleFilter("owned");
                    setEvidences(null);
                  }
                }}
                type="button"
                className={`py-2 px-3 ${
                  roleFilter === "owned"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                OWNED
              </button>
            </nav>
          </div>
          <div className="h-full border-2 border-orange-700">SORT</div>
        </div>
      </div>

      <div className="flex w-full border-2 rounded-b-sm border-orange-700 overflow-y-auto"></div>
    </div>
  );
}
