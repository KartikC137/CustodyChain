import { BasicEvidenceDetails } from "@/lib/types/evidence.types";
import { formatTimestamp } from "@/lib/helpers";
export default function EvidenceSummary({
  id,
  isActive,
  description,
  creator,
  timeOfCreation,
  currentOwner,
  currentOwnerTime,
}: BasicEvidenceDetails) {
  return (
    <div className="space-y-5">
      <p
        className={`font-sans font-[500] text-4xl ${
          isActive ? "text-orange-700" : "text-gray-600"
        }`}
      >
        {isActive ? "Evidence Details" : "Archived Evidence"}
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
          Creator:{" "}
          <span className="text-orange-700">
            {creator} : {formatTimestamp(timeOfCreation)}
          </span>
        </p>
        <p>
          {isActive ? "Current Owner: " : "Last Owner: "}
          <span className="text-orange-700">
            {currentOwner} : {formatTimestamp(currentOwnerTime)}
          </span>
        </p>
      </div>
    </div>
  );
}
