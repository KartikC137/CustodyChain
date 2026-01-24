"use client";

import Input from "@/src/components/ui/Input";
import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { fetchEvidencesByFilter } from "@/src/api/evidences/fetchEvidence";
import { Address } from "@/src/lib/types/solidity.types";
import {
  primaryFilterType,
  secondaryFilterType,
} from "@/src/lib/types/evidence.types";

export default function MyEvidencePage() {
  const { account } = useWeb3();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [evidenceDetails, setEvidenceDetails] = useState<any[]>([]);
  const [primaryFilter, setPrimaryFilter] =
    useState<primaryFilterType>("active");
  const [secondaryFilter, setSecondaryFilter] =
    useState<secondaryFilterType>("created");

  const fetchData = useCallback(
    async (
      _primaryFilter: primaryFilterType,
      _secondaryFilter: secondaryFilterType,
      _account: Address,
    ) => {
      try {
        const data = await fetchEvidencesByFilter(
          _account as Address,
          _primaryFilter,
          _secondaryFilter,
        );
        setEvidenceDetails(data);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );
  useEffect(() => {
    setIsLoading(true);
    if (account) {
      fetchData(primaryFilter, secondaryFilter, account);
      return;
    } else {
      setIsLoading(false);
    }
  }, [primaryFilter, secondaryFilter, account]);

  console.info(
    "----------------EVidence dEtails fetched-------------",
    evidenceDetails,
  );
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
                onClick={() => setPrimaryFilter("all")}
                type="button"
                className={`py-2 px-3 ${
                  primaryFilter === "all"
                    ? "bg-orange-500 font-[600] text-white"
                    : "=hover:font-[600] hover:bg-orange-200"
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setPrimaryFilter("active")}
                type="button"
                className={`py-2 px-3 border-x-2 ${
                  primaryFilter === "active"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setPrimaryFilter("discontinued")}
                type="button"
                className={`py-2 px-3 ${
                  primaryFilter === "discontinued"
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
                onClick={() => setSecondaryFilter("all")}
                type="button"
                className={`py-2 px-3 ${
                  secondaryFilter === "all"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setSecondaryFilter("created")}
                type="button"
                className={`py-2 px-3 border-x-2 ${
                  secondaryFilter === "created"
                    ? "bg-orange-500 font-[600] text-white"
                    : "hover:font-[600] hover:bg-orange-200"
                }`}
              >
                CREATED
              </button>
              <button
                onClick={() => setSecondaryFilter("owned")}
                type="button"
                className={`py-2 px-3 ${
                  secondaryFilter === "owned"
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
