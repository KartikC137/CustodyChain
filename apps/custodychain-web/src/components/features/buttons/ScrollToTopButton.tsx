"use client";

import { RefObject, useEffect, useState } from "react";
import Button from "../../ui/Button";

interface ScrollToTopProps {
  scrollContainerRef: RefObject<HTMLElement | null>;
}

export default function ScrollToTop({ scrollContainerRef }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop > 10
    ) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const div = scrollContainerRef.current;
    if (div) {
      div.addEventListener("scroll", toggleVisibility);
    }
    return () => {
      if (div) {
        div.removeEventListener("scroll", toggleVisibility);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-8 right-8">
      <Button
        className="p-3 rounded-full backdrop-blur-xs border-2 border-orange-700 bg-orange-100/60 text-orange-700
        hover:bg-orange-500 hover:text-white
        "
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </Button>
    </div>
  );
}
