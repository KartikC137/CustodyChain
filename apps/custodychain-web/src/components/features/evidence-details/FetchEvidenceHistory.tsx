"use client";

import { useRef } from "react";
import ScrollToTop from "@/src/components/features/buttons/ScrollToTopButton";

export default function FetchEvidenceHistory() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative bg-orange-50">
      <div className="absolute top-0 right-0 left-0 bg-orange-200/40 backdrop-blur-xs rounded-sm shadow-xl shadow-orange-500/20 ">
        <p className="ml-5 py-4 text-4xl font-sans font-[500] text-orange-700">
          Recently Fetched Evidences
        </p>
      </div>

      <ScrollToTop scrollContainerRef={scrollContainerRef} />
    </div>
  );
}
