"use client";

import { useState } from "react";
import SideNav from "@/components/SideNav";

export default function AppHeader() {
  const [showNav, setShowNav] = useState(false);

  return (
    <>
      <div className="bg-white border-b border-border-subtle">
        <div className="px-4 py-4 md:px-10 md:py-5 flex items-center justify-between">
          <a href="/" className="flex items-baseline gap-3 shrink-0">
            <span className="text-[15px] md:text-[16px] font-medium text-ink-primary tracking-[0.04em] normal-case">RIAD DI SIENA</span>
            <span className="text-[11px] text-ink-tertiary tracking-[0.03em] hidden sm:block normal-case font-light">Operations</span>
          </a>

          <button
            onClick={() => setShowNav(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-full hover:bg-linen transition-colors"
            aria-label="Open navigation"
          >
            <span className="block w-[18px] h-[1.5px] bg-ink-primary" />
            <span className="block w-[18px] h-[1.5px] bg-ink-primary" />
          </button>
        </div>
      </div>

      {showNav && <SideNav onClose={() => setShowNav(false)} />}
    </>
  );
}
