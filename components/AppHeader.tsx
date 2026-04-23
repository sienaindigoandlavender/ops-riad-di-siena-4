"use client";

import { useState } from "react";

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

      {/* Side navigation */}
      {showNav && (
        <>
          <div className="fixed inset-0 bg-black/20 z-50 modal-overlay" onClick={() => setShowNav(false)} />
          <nav className="fixed top-0 right-0 h-full w-72 bg-white border-l border-border-subtle z-50 flex flex-col" style={{ animation: "slide-in-right 200ms cubic-bezier(0.22, 1, 0.36, 1) both" }}>
            <div className="flex items-center justify-between px-7 py-6 border-b border-border-subtle">
              <span className="text-[11px] font-light text-ink-tertiary tracking-[0.08em]">NAVIGATION</span>
              <button onClick={() => setShowNav(false)} className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            <div className="flex-1 px-7 py-6 space-y-1">
              <a href="/" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Calendar</a>
              <a href="/guests" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Guests</a>
              <a href="/team" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Team</a>
              <a href="/expenses" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Expenses</a>
              <a href="/insights" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Insights</a>
              <a href="/invoice" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Invoices</a>
              <a href="/admin" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Admin</a>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
