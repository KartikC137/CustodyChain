import ActivityPanel from "@/src/components/layout/ledger/ActivityPanel";
import LedgerNavbar from "@/src/components/layout/ledger/LedgerNavbar";
import ConnectWalletButton from "@/src/components/features/buttons/ConnectWalletButton";
import { ActivityProvider } from "@/src/context-and-hooks/ActivitiesContext";
import { EvidenceProvider } from "@/src/context-and-hooks/EvidencesContext";
import Title from "@/src/components/layout/ledger/Title";

export default async function EvidenceManagerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`h-screen overflow-hidden p-4 grid grid-cols-[0.8fr_2fr]
            *:overflow-hidden
            `}
    >
      <EvidenceProvider>
        <ActivityProvider>
          {/* Side bar */}
          <div className="mr-4 space-y-2 grid grid-rows-[auto_auto_1fr]">
            <div className="p-5 rounded-md font-mono font-semibold bg-green-100 border-2 border-green-700">
              <Title />
              <div className="pl-1 text-lg text-orange-800">
                <ConnectWalletButton />
              </div>
            </div>
            <LedgerNavbar />
            <ActivityPanel />
          </div>

          <div
            id="evidence-container"
            className="relative h-full overflow-hidden rounded-md bg-orange-100 border-2 border-orange-700"
          >
            {children}
          </div>
        </ActivityProvider>
      </EvidenceProvider>
    </div>
  );
}
