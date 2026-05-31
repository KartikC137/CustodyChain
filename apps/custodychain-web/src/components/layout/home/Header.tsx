"use client";

import { useEffect, useRef, RefObject } from "react";

import ConnectWalletButton from "../../features/buttons/ConnectWalletButton";
import HomeNavbar from "./HomeNavbar";

export function Header() {
  const headerRef = useRef<HTMLElement>(null);

  const lastScrollY = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;

      const currentScrollY = window.scrollY;
      const headerEl = headerRef.current;

      if (currentScrollY <= 0) {
        headerEl.style.transform = "translateY(0)";
        if (timeoutId.current) clearTimeout(timeoutId.current);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        headerEl.style.transform = "translateY(-100%)";
        if (timeoutId.current) clearTimeout(timeoutId.current);
      } else if (currentScrollY < lastScrollY.current) {
        headerEl.style.transform = "translateY(0)";

        if (timeoutId.current) clearTimeout(timeoutId.current);

        timeoutId.current = setTimeout(() => {
          if (headerRef.current) {
            headerRef.current.style.transform = "translateY(-100%)";
          }
        }, 3000);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  return (
    <div
      ref={headerRef as RefObject<HTMLDivElement>}
      className="z-103 fixed top-0 left-0 right-0
      transition-all duration-300 ease-in-out 
      flex items-center justify-between pr-8 pl-6 pt-2
      font-sans"
    >
      <div className="px-8 pt-6 pb-4 mt-2 ml-2 bg-green-100 backdrop-blur-lg shadow-xl shadow-orange-500/20 rounded-xl border-3 border-green-700">
        <span className="text-5xl/8 font-[500] text-green-900/80">
          Custody Chain
        </span>
        {/* <span className="ml-4 font-[600] text-xl text-yellow-600">
          Decentralized, Secure and Transparent Chain of Custody Manager.
        </span> */}
        {/* <Button className="block mt-2 px-10 py-3 rounded-xl text-3xl text-green-50 bg-orange-700 border-2 border-yellow-500">
          Get started
        </Button> */}
        <ConnectWalletButton />
      </div>
      <HomeNavbar />
    </div>
  );
}
