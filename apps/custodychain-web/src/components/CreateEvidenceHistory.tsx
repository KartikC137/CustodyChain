"use client";

import none from "../../public/icons/none.svg";
import Image from "next/image";
import { useRef } from "react";
import { useWeb3 } from "@/src/context-and-hooks/Web3Context";
import { useEvidences } from "@/src/context-and-hooks/EvidencesContext";
import { SocketEvidenceDetails } from "@/src/lib/types/socketEvent.types";
import { bigintToDateWithTimeStamp } from "@/src/lib/util/helpers";
import Link from "next/link";
import ScrollToTop from "@/src/components/features/buttons/ScrollToTopButton";

export default function CreateEvidenceHistory() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { account, ledgerId } = useWeb3();
  const { evidences, isLoadingEvidences } = useEvidences();

  const filteredEvidences = evidences.filter((e) => e.creator === account);

  return (
    <div className="relative bg-green-50">
      <div className="absolute top-0 right-0 left-0 bg-orange-200/40 backdrop-blur-xs rounded-sm shadow-xl shadow-orange-500/20 ">
        <p className="ml-5 py-4 text-4xl font-sans font-[500] text-orange-700">
          Recently Created Evidences
        </p>
      </div>
      {/* Evidence list */}
      <div
        ref={scrollContainerRef}
        className={`ml-5 pt-22 pr-5 scroll-smooth overflow-y-scroll h-[560px]`}
      >
        {isLoadingEvidences ? (
          <p className="animate-pulse text-center text-sm text-gray-500">
            Loading evidences...
          </p>
        ) : filteredEvidences.length === 0 ? (
          // todo : if filters are on, add a clear filter button here
          <div className="flex items-center gap-x-4">
            <Image priority src={none} alt="no evidences found" />
            <div className="font-sans text-4xl text-orange-500">
              No recent evidences created
            </div>
          </div>
        ) : (
          filteredEvidences.map((e: SocketEvidenceDetails) => {
            const key = `${e.id}`;
            return (
              <div
                key={key}
                className={`mb-2 p-4 rounded-sm font-mono font-semibold text-lg border-2 ${e.status === "active" ? "text-green-800 bg-orange-50 border-orange-700" : "text-gray-500 bg-gray-100 border-gray-500"}`}
              >
                <Link
                  href={`/ledger/${ledgerId}/evidence/${e.id}`}
                  className="block font-mono"
                >
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
