"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PLACES, CATEGORIES, NEIGHBORHOODS } from "@/lib/guide-data";

export default function PlaceDetailPage() {
  const params = useParams();
  const place = PLACES.find((p) => p.slug === params.slug);

  if (!place) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-tertiary text-[13px]">Place not found</p>
          <Link href="/guides/explore" className="text-[12px] text-ink-secondary hover:text-ink-primary mt-2 block">
            ← Browse all places
          </Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORIES.find((c) => c.slug === place.category);
  const hood = NEIGHBORHOODS.find((n) => n.slug === place.neighborhood);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-10 pb-16 max-w-2xl mx-auto">
        <Link href="/guides/explore" className="text-[12px] text-ink-tertiary hover:text-ink-secondary transition-colors font-light">
          ← Back to explore
        </Link>

        {/* Header */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-[10px] text-ink-tertiary font-light">
            <span>{cat?.icon} {cat?.name}</span>
            <span>·</span>
            <span>{hood?.name}</span>
            {place.hiddenGem && (
              <>
                <span>·</span>
                <span className="px-1.5 py-0.5 bg-gold/10 text-gold">Hidden gem</span>
              </>
            )}
          </div>
          <h1 className="text-[28px] font-light text-ink-primary mt-2 tracking-[-0.01em]">{place.name}</h1>
          <p className="text-[14px] text-ink-tertiary mt-1 font-light">{place.subtitle}</p>
        </div>

        {/* Why it matters */}
        <div className="mt-8">
          <p className="text-[10px] text-ink-tertiary tracking-[0.06em] font-light mb-2">Why it matters</p>
          <p className="text-[15px] text-ink-body leading-relaxed font-light">{place.whyItMatters}</p>
        </div>

        {/* Details grid */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-ink-tertiary tracking-[0.06em] font-light mb-1">Best time</p>
            <p className="text-[14px] text-ink-primary font-normal">{place.bestTime}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-tertiary tracking-[0.06em] font-light mb-1">Duration</p>
            <p className="text-[14px] text-ink-primary font-normal">
              {place.durationMinutes >= 60
                ? `${Math.floor(place.durationMinutes / 60)}h${place.durationMinutes % 60 > 0 ? ` ${place.durationMinutes % 60}min` : ""}`
                : `${place.durationMinutes} min`
              }
            </p>
          </div>
          <div>
            <p className="text-[10px] text-ink-tertiary tracking-[0.06em] font-light mb-1">Price</p>
            <p className="text-[14px] text-ink-primary font-normal">{place.priceRange}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-tertiary tracking-[0.06em] font-light mb-1">Neighborhood</p>
            <p className="text-[14px] text-ink-primary font-normal">{hood?.name}</p>
          </div>
        </div>

        {/* Practical */}
        <div className="mt-8 border-t border-border-subtle pt-6">
          <p className="text-[10px] text-ink-tertiary tracking-[0.06em] font-light mb-2">Practical</p>
          <p className="text-[14px] text-ink-secondary leading-relaxed font-light">{place.practicalNotes}</p>
        </div>
      </div>
    </div>
  );
}
