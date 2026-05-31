import "../css/globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { WalletProvider } from "../context-and-hooks/WalletContext";

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
        className={`bg-orange-100 overflow-x-hidden h-full ${monsterrat.variable}`}
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
