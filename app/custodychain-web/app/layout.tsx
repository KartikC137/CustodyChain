import "./globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import ActivityPanel from "@/components/layout/ActivityPanel";
import Navbar from "@/components/layout/Navbar";
import ConnectWalletButton from "@/components/web3/ConnectWalletButton";
import { Web3Provider } from "../contexts/web3/Web3Context";
import { ActivityProvider } from "@/contexts/ActivitiesContext";

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
                <div className="text-lg text-green-900">
                  <ConnectWalletButton />
                </div>
              </div>
              <Navbar />
              <ActivityPanel />
            </div>
            {children}
          </ActivityProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
