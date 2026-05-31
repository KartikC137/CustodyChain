import {
  ActiveRoles,
  Role,
  dbToRoleNameMap,
  PendingRole,
  InputSelectedRoles,
  ROLES,
} from "@/src/lib/types/ledger.types";
import Button from "../../ui/Button";
import React from "react";
import { Address } from "@/src/lib/types/solidity.types";

interface LedgerRolesTableProps {
  isEditMode: boolean;
  currentRoles: ActiveRoles[];
  pendingRoles: InputSelectedRoles;
  onAddRoleToQueue: (role: PendingRole) => void;
  onRemoveRoleFromQueue: (role: PendingRole) => void;
  onNavigateToEditMode: (enableEdit: boolean) => void;
}

export default function LedgerRolesTable({
  isEditMode,
  currentRoles,
  pendingRoles,
  onAddRoleToQueue,
  onRemoveRoleFromQueue,
  onNavigateToEditMode,
}: LedgerRolesTableProps) {
  let displayRoles = currentRoles;

  if (isEditMode) {
    const draftRoles = [...currentRoles];
    const pendingAccounts = Array.from(
      new Set(pendingRoles.map((p) => p.account)),
    );
    pendingAccounts.forEach((pendingAccount) => {
      const existsInDb = draftRoles.some((r) => r.account === pendingAccount);
      if (!existsInDb) {
        draftRoles.unshift({
          account: pendingAccount as Address,
          roles: [],
          updatedAt: new Date(),
        });
      }
    });
    displayRoles = draftRoles;
  }

  if (
    isEditMode
      ? displayRoles.length === 0 || currentRoles.length === 0
      : currentRoles.length === 0
  ) {
    return (
      <div className="bg-orange-500 flex items-center p-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="48px"
          viewBox="0 -960 960 960"
          width="48px"
          className="fill-orange-100"
        >
          <path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM677-227q16-12 30-26t26-30L283-733q-16 12-30 26t-26 30l450 450Z" />
        </svg>

        <div className="ml-5 font-sans font-[500] text-4xl text-orange-50">
          No Active Roles For Ledger.{" "}
          {!isEditMode && (
            <Button
              onClick={() => onNavigateToEditMode(true)}
              className="italic underline hover:cursor-pointer"
            >
              Add Account to continue ➜
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <table className="w-full text-xl border-separate border-spacing-0">
      <thead
        className="z-100 sticky top-0 bg-orange-500 shadow-xl shadow-orange-500/20 
      font-sans text-orange-50"
      >
        <tr className="*:border-orange-700 *:p-2">
          <th className="border-r-2 w-12 text-center">#</th>
          <th className="border-r-2">
            ACCOUNTS{" "}
            <span className="px-2 rounded-full text-orange-500 bg-orange-50">
              {displayRoles.length}
            </span>
          </th>
          <th className="border-r-2">CURRENT ROLES</th>
          <th>GRANTED ON</th>
        </tr>
      </thead>
      <tbody>
        {displayRoles.map((a, accountIndex) => {
          const rolesList = isEditMode ? ROLES : a.roles.map((r) => r.role);
          return (
            <React.Fragment key={a.account}>
              {rolesList.map((r, roleIndex) => {
                const roleObj = a.roles.find((i) => i.role === r);
                const roleName = dbToRoleNameMap[r as Role];
                const isRoleInQueue =
                  isEditMode &&
                  pendingRoles.some(
                    (p) =>
                      p.account === a.account &&
                      (roleObj
                        ? p.action === "revoke"
                        : p.action === "grant") &&
                      p.role === r,
                  );

                return (
                  <tr
                    key={r}
                    className="font-mono font-bold text-orange-700 *:border-orange-700"
                  >
                    {roleIndex === 0 && (
                      <>
                        <td
                          rowSpan={rolesList.length}
                          className="py-2 border-t-2 border-r-2 align-top text-center"
                        >
                          {accountIndex + 1}.
                        </td>
                        <td
                          rowSpan={rolesList.length}
                          className="pl-3 py-2 border-r-2 border-t-2 align-top"
                        >
                          {a.account}
                        </td>
                      </>
                    )}

                    <td
                      className={`border-r-2 max-w-60 px-2 py-1 
                    ${roleIndex === 0 ? "border-t-2" : ""} 
                    ${roleIndex !== rolesList.length - 1 ? "border-b-2" : ""}`}
                    >
                      {isEditMode ? (
                        roleObj ? (
                          <div className="flex flex-row items-center justify-between">
                            <span>{roleName}</span>
                            <Button
                              onClick={() =>
                                isRoleInQueue
                                  ? onRemoveRoleFromQueue({
                                      account: a.account,
                                      role: r,
                                      action: "revoke",
                                    })
                                  : onAddRoleToQueue({
                                      account: a.account,
                                      role: r,
                                      action: "revoke",
                                    })
                              }
                              className={`py-1 px-2 rounded-lg ${isRoleInQueue ? "bg-orange-700" : "bg-yellow-600"} font-mono text-orange-50`}
                            >
                              {`REVOK${isRoleInQueue ? "ING" : "E"}`}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() =>
                              isRoleInQueue
                                ? onRemoveRoleFromQueue({
                                    account: a.account,
                                    role: r,
                                    action: "grant",
                                  })
                                : onAddRoleToQueue({
                                    account: a.account,
                                    role: r,
                                    action: "grant",
                                  })
                            }
                            className={`py-1 px-2 rounded-lg ${isRoleInQueue ? "bg-orange-700" : "bg-yellow-600"} font-mono text-white`}
                          >
                            <span className="text-orange-50">{`GRANT${isRoleInQueue ? "ING" : ""}:`}</span>{" "}
                            {roleName}
                          </Button>
                        )
                      ) : (
                        <span>{roleName}</span>
                      )}
                    </td>
                    <td
                      className={`text-center px-2 py-1 
                    ${roleIndex === 0 ? "border-t-2" : ""} 
                    ${roleIndex !== rolesList.length - 1 ? "border-b-2" : ""}`}
                    >
                      {roleObj
                        ? (roleObj.grantedOn as unknown as string).split(".")[0]
                        : "—"}
                    </td>
                  </tr>
                );
              })}
              <tr className="h-4">
                <td
                  colSpan={4}
                  className="border-orange-700 border-t-2 bg-orange-200"
                ></td>
              </tr>
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
