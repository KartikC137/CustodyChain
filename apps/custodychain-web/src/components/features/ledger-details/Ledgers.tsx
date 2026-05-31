"use client";

import { useLedgers } from "@/src/context-and-hooks/LedgersContext";

export default function Ledgers() {
  const { ledgers } = useLedgers();

  return (
    <div className="mx-15 px-5 py-5 border-3 border-orange-800 text-4xl text-orange-800">
      {ledgers.length === 0 ? (
        <p>No ledgers found</p>
      ) : (
        ledgers.map((l) => (
          <div className="border-2 border-green-800 mb-2" key={l.txHash}>
            {l.name}: {l.txHash}: {l.status} {l.id}
          </div>
        ))
      )}
    </div>
  );
}
