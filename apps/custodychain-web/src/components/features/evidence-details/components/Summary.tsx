import { EvidenceSummaryType } from "@/src/lib/types/evidence.types";
import { bigintToDateWithTimeStamp } from "@/src/lib/util/helpers";

export default function EvidenceSummary({
  id,
  status,
  description,
  creator,
  currentOwner,
  createdAt,
  transferredAt,
  source,
  discontinuedAt,
}: EvidenceSummaryType) {
  const isActive = status === "active" ? true : false;
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
          {bigintToDateWithTimeStamp(createdAt).toLocaleString()}
          {!isActive &&
            " to " +
              bigintToDateWithTimeStamp(
                discontinuedAt as bigint,
              ).toLocaleString()}
        </p>
        <p>
          {isActive ? "Current Owner: " : "Last Owner: "}
          <span className="text-orange-700">{currentOwner}</span> @{" "}
          {bigintToDateWithTimeStamp(transferredAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
