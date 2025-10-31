"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// 1. Import 'isLoading' from useWeb3
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";
import {
  useMockDb,
  type Evidence,
  type AccountProfile,
} from "@/lib/contexts/MockDBContext";
import { type Address } from "viem";

// --- Component ---
export default function MyEvidencePage() {
  // 2. Get 'isLoading' from the provider, and rename it to avoid conflict
  const { account, isLoading: isWeb3Loading } = useWeb3();
  const { allAccounts } = useMockDb();

  const [createdEvidence, setCreatedEvidence] = useState<Evidence[]>([]);
  const [ownedEvidence, setOwnedEvidence] = useState<Evidence[]>([]);

  // 3. REMOVE the component's internal 'isLoading' state
  // const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 4. This effect will now only run when the provider is ready AND account is set
    if (account && !isWeb3Loading) {
      // Find the user's profile within the global state
      const profile: AccountProfile | undefined = allAccounts.find(
        (p) => p.address.toLowerCase() === account.toLowerCase()
      );

      if (profile) {
        setCreatedEvidence(profile.evidencesCreated);
        const ownedByOthers = profile.evidencesOwned.filter(
          (ownedItem) =>
            ownedItem.creator.toLowerCase() !== account.toLowerCase()
        );
        setOwnedEvidence(ownedByOthers);
      } else {
        setCreatedEvidence([]);
        setOwnedEvidence([]);
      }
    } else if (!account && !isWeb3Loading) {
      // No account *after* loading, clear lists
      setCreatedEvidence([]);
      setOwnedEvidence([]);
    }
    // 5. This effect now waits for 'isWeb3Loading' to be false
  }, [account, allAccounts, isWeb3Loading]);

  // --- Render Logic ---
  // 6. Use 'isWeb3Loading' as the primary loading check
  if (isWeb3Loading) {
    return <div className="p-6 text-center">Loading your evidence...</div>;
  }

  // 7. This check now happens *after* the provider is done loading
  if (!account) {
    // This is no longer an error, it's the correct state if not connected
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
