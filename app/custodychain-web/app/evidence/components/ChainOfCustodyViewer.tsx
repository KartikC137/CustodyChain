import { useState } from "react";
import { CustodyRecord } from "@/lib/types/evidence.types";
import { formatTimestamp } from "@/lib/helpers";

interface ChainOfCustodyViewerProps {
  chainOfCustody: CustodyRecord[];
  isActive: boolean;
}

export default function ChainOfCustodyViewer({
  chainOfCustody,
  isActive,
}: ChainOfCustodyViewerProps) {
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("timeline");

  return (
    <div className="space-y-4">
      <p className="font-sans font-[500] text-3xl text-orange-700">
        Chain of Custody:
      </p>

      <nav
        className="grid grid-cols-[1fr_1fr] rounded-t-sm border-2 border-orange-700 bg-orange-50 font-mono font-[500] text-orange-900"
        aria-label="Tabs"
      >
        <button
          onClick={() => setActiveTab("list")}
          type="button"
          className={`py-2 px-3 ${
            activeTab === "list"
              ? "bg-orange-500 font-[600] text-white"
              : "hover:rounded-tl-xs hover:font-[600] hover:bg-orange-200"
          }`}
        >
          LIST VIEW
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          type="button"
          className={`py-2 px-3 ${
            activeTab === "timeline"
              ? "bg-orange-500 font-[600] text-white"
              : "hover:rounded-tr-xs hover:font-[600] hover:bg-orange-200"
          }`}
        >
          TIMELINE VIEW
        </button>
      </nav>

      <div className="max-h-140 overflow-y-scroll p-4 bg-green-50 rounded-b-sm border-2 border-green-700">
        {/* View Select Tabs*/}
        {activeTab === "list" ? (
          <ul className="space-y-1 list-decimal list-inside">
            {chainOfCustody.map((record) => {
              return (
                <li
                  key={`${record.owner}-${record.timestamp}`}
                  className="font-mono font-semibold text-md text-green-800"
                >
                  <span className="text-orange-700">{record.owner}</span>{" "}
                  <span className="text-orange-700">
                    {formatTimestamp(record.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div>
            {chainOfCustody.map((record, index) => {
              const isLastItem = index === chainOfCustody.length - 1;
              const key = `${record.owner}-${record.timestamp}`;
              return (
                <div key={key} className="flex flex-col items-center">
                  <div className="relative p-2 font-mono font-semibold rounded-sm border-2 border-orange-700 bg-orange-50 shadow-sm">
                    <h3 className="text-green-800">
                      {isActive
                        ? index === 0 && isLastItem
                          ? "Creator / Current Owner"
                          : index === 0
                            ? "Creator"
                            : isLastItem
                              ? "Current Owner"
                              : "Owned"
                        : index === 0 && isLastItem
                          ? "Creator / Last Owner"
                          : index === 0
                            ? "Creator"
                            : isLastItem
                              ? "Last Owner"
                              : "Owned"}
                    </h3>
                    <div className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 border-2 border-green-700 rounded-tr-md font-mono text-sm text-green-800">
                      {index + 1}
                    </div>
                    <time className="text-orange-900 block leading-none">
                      {formatTimestamp(record.timestamp)}
                    </time>
                    <p className="text-orange-900 break-all">{record.owner}</p>
                  </div>
                  {!isLastItem && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 my-1 text-orange-800"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a.75.75 0 01.75.75v10.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3.75A.75.75 0 0110 3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
