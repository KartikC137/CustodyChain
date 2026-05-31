import Ledgers from "@/src/components/features/ledger-details/Ledgers";

export default function LedgersPage() {
  return (
    <div className="mt-40">
      <p className="pl-15 py-10 text-5xl font-sans font-[500] text-orange-700">
        Your Ledgers
      </p>
      <Ledgers />
    </div>
  );
}
