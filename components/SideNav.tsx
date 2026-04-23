"use client";

import { usePathname } from "next/navigation";

interface SideNavProps {
  onClose: () => void;
}

const NAV_LINKS = [
  { href: "/", label: "Calendar", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><rect x="8" y="14" width="2" height="2" /><rect x="14" y="14" width="2" height="2" /><rect x="8" y="18" width="2" height="2" />
    </svg>
  )},
  { href: "/guests", label: "Guests", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )},
  { href: "/team", label: "Team", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 15.5l-3-3-3 3" /><line x1="19" y1="12.5" x2="19" y2="21" />
    </svg>
  )},
  { href: "/expenses", label: "Expenses", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" /><path d="M12 17.5v.5M12 6v.5" />
    </svg>
  )},
  { href: "/insights", label: "Insights", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )},
  { href: "/invoice", label: "Invoices", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  )},
  { href: "/admin", label: "Admin", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )},
];

// Desktop persistent sidebar (hidden on mobile)
export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 border-r border-border-subtle bg-white shrink-0 md:w-14 lg:w-[220px] transition-all duration-200">
      {/* Logo */}
      <div className="h-14 flex items-center border-b border-border-subtle px-3 lg:px-5">
        <a href="/" className="flex items-center gap-2 overflow-hidden">
          <span className="text-[14px] font-medium text-ink-primary tracking-[0.03em] shrink-0 lg:block hidden">RIAD DI SIENA</span>
          <span className="text-[14px] font-medium text-ink-primary tracking-[0.03em] shrink-0 lg:hidden block">R</span>
        </a>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5">
        {NAV_LINKS.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <a
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 h-10 px-2.5 lg:px-3 rounded transition-colors duration-150 relative group ${
                isActive
                  ? "bg-parchment text-ink-primary"
                  : "text-ink-tertiary hover:bg-parchment hover:text-ink-primary"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-ink-primary rounded-r" />
              )}
              <span className="shrink-0">{icon}</span>
              <span className="text-[12px] font-light tracking-[0.04em] hidden lg:block">{label}</span>

              {/* Tooltip for collapsed state */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-ink-primary text-white text-[11px] rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 lg:hidden z-50">
                {label}
              </span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

// Mobile slide-out (unchanged)
export default function SideNav({ onClose }: SideNavProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50 modal-overlay" onClick={onClose} />
      <nav
        className="fixed top-0 right-0 h-full w-72 bg-white border-l border-border-subtle z-50 flex flex-col"
        style={{ animation: "slide-in-right 200ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
      >
        <div className="flex items-center justify-between px-7 py-6 border-b border-border-subtle">
          <span className="text-[11px] font-light text-ink-tertiary tracking-[0.08em]">NAVIGATION</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="flex-1 px-7 py-6 space-y-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className={`block py-3 text-[12px] uppercase tracking-[0.08em] border-b border-border-subtle transition-colors ${
                  isActive
                    ? "text-ink-primary font-medium"
                    : "text-ink-secondary font-light hover:text-ink-primary"
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
