"use client";

import { usePathname } from "next/navigation";

interface SideNavProps {
  onClose: () => void;
}

const NAV_LINKS = [
  { href: "/", label: "Calendar" },
  { href: "/guests", label: "Guests" },
  { href: "/team", label: "Team" },
  { href: "/expenses", label: "Expenses" },
  { href: "/insights", label: "Insights" },
  { href: "/invoice", label: "Invoices" },
  { href: "/admin", label: "Admin" },
];

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
