"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context"; // Adjust path as needed
import MockEvidenceDataManager from "@/app/api/dev/MockEvidenceDataManager"; // Adjust path as needed
import { type Address } from "viem";

interface Evidence {
  isActive: boolean;
  evidenceId: `0x${string}`;
  description: string;
  creator: Address;
  currentOwner: Address;
}

// --- Component ---
export default function MyEvidencePage() {
  const { account } = useWeb3();

  const [createdEvidence, setCreatedEvidence] = useState<Evidence[]>([]);
  const [ownedEvidence, setOwnedEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (account) {
      setIsLoading(true);

      // We must pass a dummy 'evidence' object to satisfy the props interface,
      // even though the 'read' call doesn't use it.
      const dummyEvidence: Evidence = {
        isActive: false,
        evidenceId: "0x0",
        description: "",
        creator: "0x0",
        currentOwner: "0x0",
      };

      // Call the Data Manager to get evidence CREATED by the user
      const createdData = MockEvidenceDataManager({
        account: account,
        accountType: "creator",
        evidence: dummyEvidence,
        call: "read",
      });

      // Call the Data Manager to get evidence OWNED by the user
      const ownedData = MockEvidenceDataManager({
        account: account,
        accountType: "owner",
        evidence: dummyEvidence,
        call: "read",
      });

      // Process the results
      if (Array.isArray(createdData)) {
        setCreatedEvidence(createdData);
      } else {
        setCreatedEvidence([]); // Set to empty if 'false' or error
      }

      if (Array.isArray(ownedData)) {
        // Filter out items the user also created to avoid duplicates
        const ownedByOthers = ownedData.filter(
          (ownedItem) =>
            ownedItem.creator.toLowerCase() !== account.toLowerCase()
        );
        setOwnedEvidence(ownedByOthers);
      } else {
        setOwnedEvidence([]);
      }

      setIsLoading(false);
    } else {
      // No account, clear lists and stop loading
      setCreatedEvidence([]);
      setOwnedEvidence([]);
      setIsLoading(false);
    }
  }, [account]); // Re-run this logic whenever the connected account changes

  // --- Render Logic ---
  if (isLoading) {
    return <div className="p-6 text-center">Loading your evidence...</div>;
  }

  if (!account) {
    return (
      <div className="p-6 text-center text-orange-600">
        Please connect your wallet to view your evidence.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">My Evidence Profile</h1>

      {/* Section for Created Evidence */}
      <section className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Evidence You Created</h2>
        {createdEvidence.length > 0 ? (
          <ul className="space-y-2 list-disc list-inside">
            {createdEvidence.map((item) => (
              <li key={item.evidenceId}>
                <Link
                  href={`/evidence/${item.evidenceId}`}
                  className="text-blue-600 hover:underline font-mono text-sm"
                >
                  {item.description} ({item.evidenceId.slice(0, 10)}...)
                </Link>
                {/* Show status: if user is no longer the owner */}
                {item.currentOwner.toLowerCase() !== account.toLowerCase() && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Owned by: {item.currentOwner.slice(0, 6)}...)
                  </span>
                )}
                {!item.isActive && (
                  <span className="text-xs text-red-500 ml-2">
                    (Discontinued)
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            You haven't created any evidence yet.
          </p>
        )}
      </section>

      {/* Section for Owned Evidence (Created by Others) */}
      <section className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">
          Evidence You Own (from others)
        </h2>
        {ownedEvidence.length > 0 ? (
          <ul className="space-y-2 list-disc list-inside">
            {ownedEvidence.map((item) => (
              <li key={item.evidenceId}>
                <Link
                  href={`/evidence/${item.evidenceId}`}
                  className="text-blue-600 hover:underline font-mono text-sm"
                >
                  {item.description} ({item.evidenceId.slice(0, 10)}...)
                </Link>
                <span className="text-xs text-gray-500 ml-2">
                  (From: {item.creator.slice(0, 6)}...)
                </span>
                {!item.isActive && (
                  <span className="text-xs text-red-500 ml-2">
                    (Discontinued)
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            You do not own any evidence created by other accounts.
          </p>
        )}
      </section>
    </div>
  );
}
