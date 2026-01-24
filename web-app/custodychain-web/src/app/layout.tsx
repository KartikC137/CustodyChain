import "../css/globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import ActivityPanel from "@/src/components/layout/ActivityPanel";
import Navbar from "@/src/components/layout/Navbar";
import ConnectWalletButton from "@/src/components/features/buttons/ConnectWalletButton";
import { Web3Provider } from "@/src/context-and-hooks/Web3Context";
import { ActivityProvider } from "@/src/context-and-hooks/ActivitiesContext";

const monsterrat = Montserrat({
  variable: "--font-monsteratt",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Custody-Chain",
  description: "Blockchain Based Evidence Management And Chain Of Custody",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`h-screen p-4 flex flex-col grid grid-cols-[0.8fr_2fr] overflow-hidden ${monsterrat.variable} antialiased`}
      >
        <Web3Provider>
          <ActivityProvider>
            <div className="pr-4 space-y-2 grid grid-rows-[auto_auto_1fr]">
              <div className="p-5 rounded-md font-mono font-semibold bg-green-100 border-2 border-green-700">
                <Link
                  href="/"
                  className="text-4xl text-blue-600 hover:text-blue-800"
                >
                  Custody-Chain
                </Link>
                <div className="pl-1 text-lg text-green-900">
                  <ConnectWalletButton />
                </div>
              </div>
              <Navbar />
              <ActivityPanel />
            </div>
            <div
              id="evidence-container"
              className="h-full px-8 pt-8 space-y-5 rounded-md bg-orange-50 border-2 border-orange-700"
            >
              {children}
            </div>
          </ActivityProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
