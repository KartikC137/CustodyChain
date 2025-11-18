"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function FetchEvidenceForm() {
  const router = useRouter();
  const [evidenceIdInput, setEvidenceIdInput] = useState<string>("");
  const [inputError, setInputError] = useState<string | undefined>(undefined);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setInputError(undefined);

    if (!evidenceIdInput.startsWith("0x") || evidenceIdInput.length !== 66) {
      setInputError("Must be a 0x-prefixed 66-character hex string.");
      return;
    }

    router.push(`/evidence/${evidenceIdInput}`);
  };

  return (
    <div
      className={`p-10 w-200 rounded-md border-2 bg-green-50 ${!inputError ? "border-green-700" : "border-red-500"}`}
    >
      <p className="mb-2 font-sans font-[400] text-5xl text-orange-700">
        Fetch Evidence
      </p>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="h-5">
          {inputError && (
            <span className="ml-1 block text-xl text-red-700 leading-none">
              {inputError}
            </span>
          )}
        </div>
        <Input
          id="evidenceIdInput"
          label="Enter Evidence ID"
          type="text"
          value={evidenceIdInput}
          onChange={(e) => {
            setEvidenceIdInput(e.target.value);
          }}
          onClick={() => {
            setInputError(undefined);
          }}
          placeholder="0x..."
          required
        />
        <Button
          type="submit"
          variant="primary"
          loadingText="Fetching Evidence Details..."
        >
          Fetch Evidence Details
        </Button>
      </form>
    </div>
  );
}
