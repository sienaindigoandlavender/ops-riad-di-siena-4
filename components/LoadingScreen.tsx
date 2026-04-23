"use client";

import { useState, useEffect } from "react";

const PHRASES = [
  "Crossing the medina...",
  "Brewing the mint tea...",
  "Opening the courtyard doors...",
  "Lighting the lanterns...",
  "Arranging the cushions...",
  "Warming the tagine...",
];

export default function LoadingScreen() {
  const [phrase, setPhrase] = useState(PHRASES[0]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * PHRASES.length);
    setPhrase(PHRASES[idx]);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
      {/* Animated sun/moon rising */}
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full bg-gold/20"
          style={{ animation: "breathe 2s ease-in-out infinite" }}
        />
        <div
          className="absolute inset-2 rounded-full bg-gold/40"
          style={{ animation: "breathe 2s ease-in-out infinite 0.3s" }}
        />
        <div
          className="absolute inset-4 rounded-full bg-gold/70"
          style={{ animation: "breathe 2s ease-in-out infinite 0.6s" }}
        />
      </div>
      <p className="text-[12px] font-light text-ink-tertiary tracking-[0.04em] normal-case">{phrase}</p>
    </div>
  );
}
