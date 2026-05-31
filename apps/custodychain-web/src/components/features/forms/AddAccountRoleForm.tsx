"use client";

import React, { useState } from "react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import {
  dbToRoleNameMap,
  PendingRole,
  Role,
  ROLES,
} from "@/src/lib/types/ledger.types";

interface GrantRoleFormProps {
  onAddAccount: (role: PendingRole) => void;
}

export default function AddAccountRoleForm({
  onAddAccount,
}: GrantRoleFormProps) {
  const [currentRole, setCurrentRole] = useState<Role>("c");
  const [currentAddress, setCurrentAddress] = useState("");

  const handleAddRole = () => {
    if (!currentAddress.trim()) {
      alert("Please enter a valid wallet address.");
      return;
    }
    onAddAccount({
      account: currentAddress.toLowerCase(),
      action: "grant",
      role: currentRole,
    });
    setCurrentAddress("");
  };

  return (
    <div className="p-5 items-center rounded-t-lg border-2 bg-green-50 border-green-800">
      <p className="mb-2 font-[600] text-3xl text-orange-700">Add Account:</p>
      <div className="grid grid-cols-[2fr_1.5fr_1fr] gap-x-2 *:min-h-12">
        <Input
          id="account_address"
          placeholder="Enter Account Address 0x..."
          value={currentAddress}
          onChange={(e) => setCurrentAddress(e.target.value)}
        />

        {/* select role dropdown */}
        <div
          id="role_select"
          className="min-w-50 group relative flex flex-1 px-2 items-center justify-between border-2 border-orange-700 rounded-sm  text-orange-700 bg-orange-100"
        >
          <span className="peer font-sans font-[500] text-3xl text-center w-full">
            {dbToRoleNameMap[currentRole]}
          </span>
          <div
            className={`peer z-101 top-11 right-0 left-0 absolute hidden group-hover:flex flex-col 
              bg-orange-50 rounded-b-sm rounded-t-sm border-orange-700 
              font-mono text-base font-[500] text-orange-700 
              *:py-2 *:border-b-2 *:border-x-2 *:border-orange-700`}
          >
            {ROLES.map((r) => (
              <Button
                onClick={() => {
                  setCurrentRole(r);
                }}
                type="button"
                className={`first:border-t-2
                    ${
                      r === currentRole
                        ? " bg-orange-500 font-[600] text-white"
                        : "hover:bg-orange-200 hover:font-[600]"
                    }`}
                key={r}
              >
                {dbToRoleNameMap[r]}
              </Button>
            ))}
          </div>
          <span className="peer-hover:bg-orange-500 peer-hover:text-white ml-2 px-4 text-base rounded-full border-2 border-orange-700 text-orange-700 bg-orange-50">
            ⯆
          </span>
        </div>

        <Button
          onClick={handleAddRole}
          className="max-w-75 rounded-sm border-2 bg-green-200 font-sans font-[500] text-green-800 text-3xl
            hover:bg-green-700 hover:text-green-50 hover:font-bold"
          disabled={currentAddress === ""}
        >
          ADD ROLE
        </Button>
      </div>
    </div>
  );
}
