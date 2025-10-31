"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const baseLinkStyle = "flex items-center pl-2 rounded-sm";
  const hoverLinkStyle =
    "hover:font-[600] hover:bg-orange-500 hover:text-white";
  const activeLinkStyle = "font-[600] bg-orange-200 text-orange-900";

  const isEvidenceActive =
    pathname === "/my-evidences" || pathname.startsWith("/evidence/");

  let evidenceId: string | null = null;
  if (pathname.startsWith("/evidence/")) {
    const parts = pathname.split("/");
    if (parts.length === 3 && parts[2]) {
      evidenceId = parts[2];
    }
  }

  return (
    <nav className="p-3 space-y-1 rounded-md text-lg font-[500] font-mono border-2 text-orange-900 border-orange-600 bg-orange-50">
      <Link
        href="/"
        className={`${baseLinkStyle} ${
          pathname === "/" ? activeLinkStyle : hoverLinkStyle
        }`}
      >
        FETCH EVIDENCE
      </Link>
      <Link
        href="/create"
        className={`${baseLinkStyle} ${
          pathname === "/create" ? activeLinkStyle : hoverLinkStyle
        }`}
      >
        CREATE EVIDENCE
      </Link>

      <div>
        <Link
          href="/my-evidences"
          className={`${baseLinkStyle} ${
            isEvidenceActive ? activeLinkStyle : hoverLinkStyle
          }`}
        >
          MY EVIDENCE
        </Link>
        {evidenceId && (
          <div className="pl-4 mt-1 text-xs font-mono text-gray-600 overflow-hidden text-ellipsis">
            <span className="font-semibold">Viewing:</span>{" "}
            {evidenceId.slice(0, 10)}...
          </div>
        )}
      </div>
    </nav>
  );
}
