"use client";

// Inline loading indicator for in-page content swaps.
// Matches LoadingScreen's breathing-dot aesthetic but sits inline with no
// background or full-viewport height, so the surrounding page chrome
// (header, nav, container) stays visible and calm.
export default function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="relative w-10 h-10">
        <div
          className="absolute inset-0 rounded-full bg-gold/20"
          style={{ animation: "breathe 2s ease-in-out infinite" }}
        />
        <div
          className="absolute inset-1.5 rounded-full bg-gold/40"
          style={{ animation: "breathe 2s ease-in-out infinite 0.3s" }}
        />
        <div
          className="absolute inset-3 rounded-full bg-gold/70"
          style={{ animation: "breathe 2s ease-in-out infinite 0.6s" }}
        />
      </div>
    </div>
  );
}
