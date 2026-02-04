import { EvidenceSummaryType } from "@/src/lib/types/evidence.types";
import { bigIntToDate } from "@/src/lib/util/helpers";

export default function EvidenceSummary({
  source,
  id,
  isActive,
  description,
  creator,
  timeOfCreation,
  currentOwner,
  currentOwnerTime,
  timeOfDiscontinuation,
}: EvidenceSummaryType) {
  return (
    <div className="space-y-5">
      <p
        className={`font-sans font-[500] text-4xl ${
          isActive ? "text-orange-700" : "text-gray-600"
        }`}
      >
        {isActive ? "Evidence Details" : "Archived Evidence"} Source: {source}
      </p>
      <div
        className={`p-4 rounded-sm font-mono font-semibold text-lg text-green-800 border-2 ${isActive ? "bg-green-50 border-green-700" : "bg-gray-50 border-gray-500"}`}
      >
        <p>
          ID: <span className="text-orange-700">{id}</span>
        </p>
        <p>
          Description: <span className="text-orange-700">{description}</span>
        </p>
        <p>
          Creator: <span className="text-orange-700">{creator}</span> @{" "}
          {bigIntToDate(timeOfCreation).toLocaleString()}
          {!isActive &&
            " to " + bigIntToDate(timeOfDiscontinuation).toLocaleString()}
        </p>
        <p>
          {isActive ? "Current Owner: " : "Last Owner: "}
          <span className="text-orange-700">{currentOwner}</span> @{" "}
          {bigIntToDate(currentOwnerTime).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
