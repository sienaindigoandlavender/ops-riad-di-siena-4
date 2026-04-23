"use client";

import { useState } from "react";
import Link from "next/link";
import { PLACES, CATEGORIES, NEIGHBORHOODS } from "@/lib/guide-data";

export default function ExplorePage() {
  const [filterCategory, setFilterCategory] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");

  const filtered = PLACES.filter((p) => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterNeighborhood && p.neighborhood !== filterNeighborhood) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-10 pb-6 max-w-2xl mx-auto">
        <Link href="/guides" className="text-[12px] text-ink-tertiary hover:text-ink-secondary transition-colors font-light">
          ← Back
        </Link>
        <h1 className="text-[28px] font-light text-ink-primary mt-4 tracking-[-0.01em]">Explore</h1>
        <p className="text-[14px] text-ink-tertiary mt-2 font-light">
          {PLACES.length} curated places
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 pb-4 max-w-2xl mx-auto">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setFilterCategory(""); setFilterNeighborhood(""); }}
            className={`text-[11px] px-3 py-1.5 transition-colors ${
              !filterCategory && !filterNeighborhood
                ? "bg-ink-primary text-white"
                : "border border-border-subtle text-ink-tertiary hover:text-ink-primary"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => { setFilterCategory(filterCategory === cat.slug ? "" : cat.slug); setFilterNeighborhood(""); }}
              className={`text-[11px] px-3 py-1.5 transition-colors ${
                filterCategory === cat.slug
                  ? "bg-ink-primary text-white"
                  : "border border-border-subtle text-ink-tertiary hover:text-ink-primary"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          {NEIGHBORHOODS.map((n) => (
            <button
              key={n.slug}
              onClick={() => { setFilterNeighborhood(filterNeighborhood === n.slug ? "" : n.slug); setFilterCategory(""); }}
              className={`text-[11px] px-3 py-1.5 transition-colors ${
                filterNeighborhood === n.slug
                  ? "bg-ink-primary text-white"
                  : "border border-border-subtle text-ink-tertiary hover:text-ink-primary"
              }`}
            >
              {n.name}
            </button>
          ))}
        </div>
      </div>

      {/* Places */}
      <div className="px-6 pb-16 max-w-2xl mx-auto space-y-3">
        {filtered.map((place) => {
          const cat = CATEGORIES.find((c) => c.slug === place.category);
          const hood = NEIGHBORHOODS.find((n) => n.slug === place.neighborhood);
          return (
            <Link
              key={place.slug}
              href={`/guides/place/${place.slug}`}
              className="block p-5 border border-border-subtle hover:border-border transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] text-ink-primary font-normal group-hover:text-ink-primary">{place.name}</h2>
                    {place.hiddenGem && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-gold/10 text-gold font-light">Hidden gem</span>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-tertiary mt-0.5 font-light">{place.subtitle}</p>
                  <p className="text-[13px] text-ink-secondary mt-2 font-light line-clamp-2">{place.whyItMatters}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-ink-tertiary font-light">{cat?.icon} {cat?.name}</p>
                  <p className="text-[10px] text-ink-tertiary font-light mt-0.5">{hood?.name}</p>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-[13px] text-ink-tertiary py-8 text-center font-light">No places match these filters</p>
        )}
      </div>
    </div>
  );
}
