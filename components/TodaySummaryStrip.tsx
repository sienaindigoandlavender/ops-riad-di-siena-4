"use client";

import { useState, useEffect } from "react";

interface TodaySummaryStripProps {
  date: string;
  counts?: { arrivals: number; inHouse: number; departures: number };
  onStatTap?: (tab: "arrivals" | "inhouse" | "departures") => void;
  activeTab?: string;
}

export default function TodaySummaryStrip({ date, counts: propCounts, onStatTap, activeTab }: TodaySummaryStripProps) {
  const [fetchedCounts, setFetchedCounts] = useState({ arrivals: 0, departures: 0, inHouse: 0 });

  useEffect(() => {
    if (propCounts) return;
    const fetchCounts = async () => {
      try {
        const res = await fetch(`/api/team/today?date=${date}`);
        const json = await res.json();
        if (!json.error) {
          setFetchedCounts({
            arrivals: (json.checkIns || []).length,
            departures: (json.checkOuts || []).length,
            inHouse: (json.inHouse || []).length,
          });
        }
      } catch {
        // silent
      }
    };
    fetchCounts();
  }, [date, propCounts]);

  const counts = propCounts || fetchedCounts;

  const stats = [
    { key: "arrivals" as const, label: "Arrivals", count: counts.arrivals },
    { key: "inhouse" as const, label: "In-house", count: counts.inHouse },
    { key: "departures" as const, label: "Departures", count: counts.departures },
  ];

  return (
    <div className="flex items-center border-b border-border-subtle overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {stats.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => onStatTap?.(key)}
          disabled={!onStatTap}
          className={`flex-1 min-w-[100px] h-[48px] flex items-center justify-center gap-2 transition-all duration-300 ease-out relative shrink-0 ${
            onStatTap ? "cursor-pointer hover:bg-parchment active:scale-[0.99]" : "cursor-default"
          }`}
        >
          <span className="text-[10px] font-light uppercase tracking-[0.08em] text-ink-tertiary">{label}</span>
          <span className={`text-[15px] font-medium ${activeTab === key ? "text-ink-primary" : "text-ink-tertiary"}`}>{count}</span>
          {activeTab === key && (
            <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-ink-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
