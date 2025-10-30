"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      setInputError(
        "Invalid Evidence ID format. Must be a 0x-prefixed 66-character hex string."
      );
      return;
    }

    router.push(`/evidence/${evidenceIdInput}`);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <Input
        label="Enter Evidence ID"
        id="evidenceIdInput"
        type="text"
        value={evidenceIdInput}
        onChange={(e) => {
          setEvidenceIdInput(e.target.value);
          setInputError(undefined);
        }}
        placeholder="0x..."
        error={inputError}
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
  );
}
