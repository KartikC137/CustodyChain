"use client";

import { useLedger } from "@/src/context-and-hooks/LedgerContext";
import Link from "next/link";

export default function Title() {
  const { ledgerName } = useLedger();
  return (
    <p className="text-4xl text-green-800 transition-all ease-in-out hover:text-orange-800">
      {ledgerName}
    </p>
  );
}
