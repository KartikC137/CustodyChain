import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Web3Provider from "@/components/web3/Web3Provider";
import { MockDbProvider } from "@/components/db/MockDBProvider";
import Navbar from "@/components/layout/Navbar";
import ActivityPanel from "@/components/layout/ActivityPanel";
import ConnectWalletButton from "@/components/web3/ConnectWalletButton";

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
        className={`grid grid-cols-[0.8fr_2fr] h-screen ${monsterrat.variable} antialiased`}
      >
        <Web3Provider>
          <MockDbProvider>
            <div className="p-5 flex flex-col space-y-2">
              <div className="p-5 rounded-md font-mono font-semibold bg-green-100 border-2 border-green-600">
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
            <div className="py-5 pr-5">
              <div className="flex items-center justify-center h-full rounded-md bg-orange-50 border-2 border-orange-600">
                {children}
              </div>
            </div>
          </MockDbProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
