import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/components/web3/Web3Provider";

const monsterrat = Montserrat({
  variable: "--font-monsteratt",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
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
          <body className={`${monsterrat.variable} antialiased`}>
            <Web3Provider>
              {children}
            </Web3Provider>
          </body>
    </html>
  );
}
