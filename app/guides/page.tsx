"use client";

import Link from "next/link";

const PATHS = [
  {
    href: "/guides/essentials",
    title: "Show me the essentials",
    description: "10 things every first-timer should know",
    icon: "✦",
  },
  {
    href: "/guides/plans",
    title: "Help me plan my days",
    description: "Curated itineraries — half day to two days",
    icon: "◇",
  },
  {
    href: "/guides/explore",
    title: "I want to explore",
    description: "Browse places by category or neighborhood",
    icon: "○",
  },
];

export default function GuidesLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="px-6 pt-16 pb-12 md:pt-24 md:pb-16 max-w-2xl mx-auto">
        <p className="text-[11px] text-ink-tertiary tracking-[0.1em] mb-4 font-light">MARRAKECH GUIDE</p>
        <h1 className="text-[32px] md:text-[42px] font-light text-ink-primary leading-[1.15] tracking-[-0.01em]">
          Your calm guide to a vivid city
        </h1>
        <p className="text-[15px] text-ink-secondary mt-4 leading-relaxed font-light max-w-md">
          Not everything. The right things — in the right order, at the right time, with the context that matters.
        </p>
      </div>

      {/* Paths */}
      <div className="px-6 pb-20 max-w-2xl mx-auto">
        <p className="text-[11px] text-ink-tertiary tracking-[0.06em] mb-6 font-light">Where would you like to start?</p>
        <div className="space-y-3">
          {PATHS.map((path) => (
            <Link
              key={path.href}
              href={path.href}
              className="block p-5 border border-border-subtle hover:border-border hover:bg-black/[0.01] transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <span className="text-[18px] text-ink-tertiary mt-0.5 group-hover:text-ink-secondary transition-colors">{path.icon}</span>
                <div>
                  <h2 className="text-[15px] text-ink-primary font-normal">{path.title}</h2>
                  <p className="text-[13px] text-ink-tertiary mt-1 font-light">{path.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 border-t border-border-subtle max-w-2xl mx-auto">
        <p className="text-[11px] text-ink-tertiary font-light">
          A guide by Riad di Siena · Marrakech
        </p>
      </div>
    </div>
  );
}
