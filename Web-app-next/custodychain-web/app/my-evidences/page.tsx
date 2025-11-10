"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type AccountProfile,
  type Evidence,
  useMockDb,
} from "@/lib/contexts/MockDBContext";
import { useWeb3 } from "@/lib/contexts/web3/Web3Context";

export default function MyEvidencePage() {
  const { account, isLoading: isWeb3Loading } = useWeb3();
  const { allAccounts } = useMockDb();

  const [createdEvidence, setCreatedEvidence] = useState<Evidence[]>([]);
  const [ownedEvidence, setOwnedEvidence] = useState<Evidence[]>([]);

  useEffect(() => {
    if (account && !isWeb3Loading) {
      const profile: AccountProfile | undefined = allAccounts.find(
        (p) => p.address.toLowerCase() === account.toLowerCase(),
      );

      if (profile) {
        setCreatedEvidence(profile.evidencesCreated);
        const ownedByOthers = profile.evidencesOwned.filter(
          (ownedItem) =>
            ownedItem.creator.toLowerCase() !== account.toLowerCase(),
        );
        setOwnedEvidence(ownedByOthers);
      } else {
        setCreatedEvidence([]);
        setOwnedEvidence([]);
      }
    } else if (!account && !isWeb3Loading) {
      setCreatedEvidence([]);
      setOwnedEvidence([]);
    }
  }, [account, allAccounts, isWeb3Loading]);

  if (isWeb3Loading) {
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
    <div className="p-10 space-y-6 bg-orange-50 rounded-md border-2 border-orange-700">
      <h1 className="font-sans font-[500] text-4xl text-orange-700">
        My Evidence Profile
      </h1>

      {/* Section for Created Evidence */}
      <section className="space-y-4 p-4 bg-green-50 text-green-800 rounded-sm border-2 border-green-700">
        <h2 className="text-xl font-semibold">Evidence You Created</h2>
        {createdEvidence.length > 0 ? (
          <ul className="space-y-2 list-disc list-inside">
            {createdEvidence.map((item) => (
              <li key={item.evidenceId} className="text-orange-800">
                <Link
                  href={`/evidence/${item.evidenceId}`}
                  className="hover:underline font-mono font-semibold text-lg"
                >
                  {item.description} ({item.evidenceId})
                </Link>
                {item.currentOwner.toLowerCase() !== account.toLowerCase() && (
                  <span className="text-lg text-gray-500 ml-2">
                    (Owned by: {item.currentOwner.slice(0, 6)}...)
                  </span>
                )}
                {!item.isActive && (
                  <span className="text-lg text-red-500 ml-2">
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
      <section className="space-y-4 p-4 bg-green-50 text-green-800 rounded-sm border-2 border-green-700">
        <h2 className="text-xl font-semibold">
          Evidence You Own (from others)
        </h2>
        {ownedEvidence.length > 0 ? (
          <ul className="space-y-2 list-disc list-inside">
            {ownedEvidence.map((item) => (
              <li key={item.evidenceId} className="text-orange-800">
                <Link
                  href={`/evidence/${item.evidenceId}`}
                  className="hover:underline font-mono font-semibold text-lg"
                >
                  {item.description} ({item.evidenceId})
                </Link>
                <span className="text-lg text-gray-500 ml-2">
                  (From: {item.creator.slice(0, 6)}...)
                </span>
                {!item.isActive && (
                  <span className="text-lg text-red-500 ml-2">
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
