import {
  InputSelectedRoles,
  PendingRole,
  ParseSelectedRoleSchema,
  ParsedSelectedRoles,
  dbToRoleNameMap,
  Role,
} from "@/src/lib/types/ledger.types";
import Button from "../../ui/Button";

interface LedgerRolesPendingQueueProps {
  pendingRoles: InputSelectedRoles;
  isSubmitting: boolean;
  onSubmitAllRoles: (roles: ParsedSelectedRoles) => void;
  onRemoveRoleFromQueue: (role: PendingRole) => void;
}

export default function LedgerRolesPendingQueue({
  isSubmitting,
  pendingRoles,
  onSubmitAllRoles,
  onRemoveRoleFromQueue,
}: LedgerRolesPendingQueueProps) {
  if (pendingRoles.length === 0) {
    return (
      <p className="px-2 text-xl font-bold font-mono text-orange-600">
        No Pending Roles Queued.
      </p>
    );
  }
  const parsedPendingRoles = ParseSelectedRoleSchema.safeParse(pendingRoles);
  if (!parsedPendingRoles.success || !parsedPendingRoles.data) {
    console.error("pending roles raw:", pendingRoles);
    throw new Error("parse failed. invalid roles");
  }

  const groupedPendingRoles = Object.values(
    pendingRoles.reduce(
      (acc, current) => {
        if (!acc[current.account]) {
          acc[current.account] = {
            account: current.account,
            grant: [],
            revoke: [],
          };
        }
        acc[current.account][current.action].push(current.role);
        return acc;
      },
      {} as Record<
        string,
        { account: string; grant: string[]; revoke: string[] }
      >,
    ),
  );

  return (
    <>
      <ul>
        {groupedPendingRoles.map((r, index) => (
          <li
            className={`py-1 
            ${index === groupedPendingRoles.length ? "border-t-2" : "border-b-2 "} border-orange-500 
            text-[18px] font-mono font-bold 
           `}
            key={`${r.account}-${index}`}
          >
            <p className="bg-orange-100 text-orange-800">
              {index + 1}.{r.account}
            </p>
            {r.grant.length > 0 && (
              <p className="text-green-900">
                Granting:{" "}
                {r.grant.map((g) => (
                  <span className="bg-green-100 py-1 pl-2 pr-1">
                    {dbToRoleNameMap[g as Role]},
                  </span>
                ))}
              </p>
            )}
            {r.revoke.length > 0 && (
              <p className="text-red-700">
                Revoking:{" "}
                {r.revoke.map((r) => (
                  <span className="bg-red-100 py-1 pl-2 pr-1">
                    {dbToRoleNameMap[r as Role]},
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
      <Button
        className="font-mono font-bold bg-orange-700 text-orange-50 text-lg rounded-md py-3"
        onClick={() => onSubmitAllRoles(parsedPendingRoles.data)}
        isLoading={isSubmitting}
      >
        SUBMIT ROLES
      </Button>
    </>
  );
}
