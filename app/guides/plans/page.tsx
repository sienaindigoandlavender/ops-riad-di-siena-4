"use client";

import Link from "next/link";
import { DAY_PLANS, PLACES } from "@/lib/guide-data";

const DURATION_LABELS = {
  half_day: "Half day",
  full_day: "Full day",
  two_day: "Two days",
};

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-10 pb-6 max-w-2xl mx-auto">
        <Link href="/guides" className="text-[12px] text-ink-tertiary hover:text-ink-secondary transition-colors font-light">
          ← Back
        </Link>
        <h1 className="text-[28px] font-light text-ink-primary mt-4 tracking-[-0.01em]">Day Plans</h1>
        <p className="text-[14px] text-ink-tertiary mt-2 font-light">
          Ready-made itineraries — just follow the sequence
        </p>
      </div>

      <div className="px-6 pb-16 max-w-2xl mx-auto space-y-8">
        {DAY_PLANS.map((plan) => (
          <div key={plan.slug} className="border border-border-subtle">
            {/* Plan header */}
            <div className="p-5 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-parchment text-ink-tertiary font-light">
                  {DURATION_LABELS[plan.durationType]}
                </span>
              </div>
              <h2 className="text-[18px] text-ink-primary font-normal mt-2">{plan.title}</h2>
              <p className="text-[13px] text-ink-secondary mt-1 font-light">{plan.description}</p>
            </div>

            {/* Stops */}
            <div className="divide-y divide-border-subtle">
              {plan.stops.map((stop, idx) => {
                const place = PLACES.find((p) => p.slug === stop.placeSlug);
                if (!place) return null;
                return (
                  <Link
                    key={stop.placeSlug}
                    href={`/guides/place/${stop.placeSlug}`}
                    className="block p-5 hover:bg-black/[0.01] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-center shrink-0 w-10">
                        <p className="text-[14px] text-ink-primary font-normal">{stop.timeSlug}</p>
                        <p className="text-[10px] text-ink-tertiary font-light mt-0.5">{idx + 1}/{plan.stops.length}</p>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] text-ink-primary font-normal">{place.name}</h3>
                        <p className="text-[12px] text-ink-tertiary font-light mt-0.5">{place.subtitle}</p>
                        {stop.transitionNote && (
                          <p className="text-[11px] text-ink-tertiary mt-2 font-light italic">{stop.transitionNote}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-ink-tertiary font-light">{place.durationMinutes} min</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
