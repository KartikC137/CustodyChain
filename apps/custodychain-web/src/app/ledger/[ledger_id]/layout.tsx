import "../../../css/globals.css";
import Link from "next/link";
import ActivityPanel from "@/src/components/layout/ActivityPanel";
import Navbar from "@/src/components/layout/Navbar";
import ConnectWalletButton from "@/src/components/features/buttons/ConnectWalletButton";
import { Web3Provider } from "@/src/context-and-hooks/Web3Context";
import { ActivityProvider } from "@/src/context-and-hooks/ActivitiesContext";
import { EvidenceProvider } from "@/src/context-and-hooks/EvidencesContext";

export default async function LedgerLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ ledger_id: string }>;
}>) {
  const ledgerId = (await params).ledger_id;

  return (
    <div
      className={`h-screen overflow-hidden p-4 grid grid-cols-[0.8fr_2fr]
        *:overflow-hidden
        `}
    >
      <Web3Provider key={ledgerId} _ledgerId={ledgerId}>
        <EvidenceProvider>
          <ActivityProvider>
            {/* Side bar */}
            <div className="mr-4 space-y-2 grid grid-rows-[auto_auto_1fr]">
              <div className="p-5 rounded-md font-mono font-semibold bg-green-100 border-2 border-green-700">
                <Link
                  href="/"
                  className="text-4xl text-green-800 transition-all ease-in-out hover:text-orange-800"
                >
                  Custody-Chain
                </Link>
                <div className="pl-1 text-lg text-orange-800">
                  <ConnectWalletButton />
                </div>
              </div>
              <Navbar />
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
      </Web3Provider>
    </div>
  );
}
