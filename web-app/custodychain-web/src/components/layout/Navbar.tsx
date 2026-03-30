"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const baseLinkStyle = "flex items-center pl-2 rounded-sm";
  const hoverLinkStyle =
    "border-orange-700 hover:font-[600] hover:bg-orange-200 hover:text-orange-900";
  const activeLinkStyle = "border-none font-[600] bg-orange-500 text-white";

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
    <nav className="min-h-[126px] pt-3 px-3 space-y-1 rounded-md text-lg font-[500] font-mono border-2 text-orange-900 border-orange-700 bg-orange-50">
      <Link
        href="/fetch"
        className={`border-t-1 ${baseLinkStyle} ${
          pathname === "/fetch" ? activeLinkStyle : hoverLinkStyle
        }`}
      >
        FETCH EVIDENCE
      </Link>
      <Link
        href="/create"
        className={`border-y-1 ${baseLinkStyle} ${
          pathname === "/create" ? activeLinkStyle : hoverLinkStyle
        }`}
      >
        CREATE EVIDENCE
      </Link>

      <div>
        <Link
          href="/my-evidences"
          className={`border-b-1 ${baseLinkStyle} ${
            isEvidenceActive ? activeLinkStyle : hoverLinkStyle
          }`}
        >
          MY EVIDENCES
          {evidenceId && (
            <span className="text-sm">: {evidenceId.slice(0, 20)}...</span>
          )}
        </Link>
      </div>
    </nav>
  );
}
