"use client";

import Link from "next/link";
import ConnectWalletButton from "../web3/ConnectWalletButton";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-100 border-b border-gray-300 shadow-sm">
      {/* Logo/Title and Links */}
      <div className="flex items-center space-x-6">
        <Link
          href="/"
          className="text-xl font-bold text-blue-600 hover:text-blue-800"
        >
          CustodyChain
        </Link>
        <div className="flex space-x-4">
          <Link href="/" className="text-gray-700 hover:text-blue-600">
            Fetch Evidence
          </Link>
          <Link href="/create" className="text-gray-700 hover:text-blue-600">
            Create Evidence
          </Link>
          <Link
            href="/my-evidences"
            className="text-gray-700 hover:text-blue-600"
          >
            My Evidences
          </Link>
        </div>
      </div>

      {/* Connect Wallet Button */}
      <div>
        <ConnectWalletButton />
      </div>
    </nav>
  );
}
