"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import LoadingScreen from "@/components/LoadingScreen";

type Channel = "direct" | "airbnb" | "booking";

interface ChannelTotals {
  revenue: number;
  nights: number;
  bookings: number;
}

interface FinanceStats {
  years: string[];
  byYear: Record<string, Record<Channel, ChannelTotals>>;
  monthly: Record<string, Record<string, Record<Channel, number>>>;
  cityTaxByYear: Record<string, number>;
  generatedAt: string;
}

const CHANNELS: { key: Channel; label: string; color: string }[] = [
  { key: "direct", label: "Direct", color: "#8A9A80" },
  { key: "airbnb", label: "Airbnb", color: "#B8918B" },
  { key: "booking", label: "Booking.com", color: "#8B9DAD" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const eur0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    fetch("/api/finance/stats")
      .then((res) => res.json())
      .then((data: FinanceStats) => {
        if ((data as unknown as { error?: string }).error) {
          setError("Could not load finance data.");
          return;
        }
        setStats(data);
        const thisYear = String(new Date().getFullYear());
        const initial = data.years?.includes(thisYear)
          ? thisYear
          : data.years?.[data.years.length - 1] || thisYear;
        setYear(initial);
      })
      .catch(() => setError("Could not load finance data."))
      .finally(() => setLoading(false));
  }, []);

  const yearTotals = useMemo(() => {
    const empty = { direct: 0, airbnb: 0, booking: 0, total: 0, nights: 0, bookings: 0 };
    if (!stats || !year || !stats.byYear[year]) return empty;
    const y = stats.byYear[year];
    const direct = y.direct.revenue;
    const airbnb = y.airbnb.revenue;
    const booking = y.booking.revenue;
    return {
      direct,
      airbnb,
      booking,
      total: direct + airbnb + booking,
      nights: y.direct.nights + y.airbnb.nights + y.booking.nights,
      bookings: y.direct.bookings + y.airbnb.bookings + y.booking.bookings,
    };
  }, [stats, year]);

  const monthlyData = useMemo(() => {
    const months = stats?.monthly[year] || {};
    return MONTHS.map((label, i) => {
      const key = String(i + 1).padStart(2, "0");
      const m = months[key] || { direct: 0, airbnb: 0, booking: 0 };
      return { label, ...m, total: m.direct + m.airbnb + m.booking };
    });
  }, [stats, year]);

  const maxMonthlyTotal = useMemo(
    () => Math.max(1, ...monthlyData.map((m) => m.total)),
    [monthlyData]
  );

  if (loading) return <LoadingScreen />;

  const adr = yearTotals.nights > 0 ? yearTotals.total / yearTotals.nights : 0;
  const avgBooking = yearTotals.bookings > 0 ? yearTotals.total / yearTotals.bookings : 0;
  const cityTax = stats?.cityTaxByYear[year] || 0;

  const pct = (v: number) => (yearTotals.total > 0 ? (v / yearTotals.total) * 100 : 0);

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader />

      {/* Header */}
      <header className="border-b border-border-subtle py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-ink-tertiary hover:text-ink-primary transition-colors text-[13px]">
              ← Back
            </Link>
            <div>
              <h1 className="font-serif text-[22px] tracking-[-0.02em]">Finance</h1>
              <p className="text-[11px] text-ink-tertiary">Revenue by channel</p>
            </div>
          </div>

          {/* Year selector */}
          {stats && stats.years.length > 0 && (
            <div className="flex items-center gap-1">
              {stats.years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
                    y === year
                      ? "bg-black/[0.05] text-ink-primary font-medium"
                      : "text-ink-tertiary hover:text-ink-primary"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-8 p-4 bg-brick/10 border border-brick/30 rounded-lg text-brick text-[13px]">
            {error}
          </div>
        )}

        {stats && !error && (
          <>
            {/* Total revenue */}
            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-1">
                Total revenue · {year}
              </p>
              <p className="font-serif text-[44px] leading-none tracking-[-0.02em] text-ink-primary">
                {eur0.format(yearTotals.total)}
              </p>
            </div>

            {/* Channel cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {CHANNELS.map(({ key, label, color }) => (
                <div key={key} className="p-5 bg-cream border border-border-subtle rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[12px] text-ink-secondary">{label}</span>
                  </div>
                  <p className="font-serif text-[28px] tracking-[-0.02em] text-ink-primary">
                    {eur0.format(yearTotals[key])}
                  </p>
                  <p className="text-[11px] text-ink-tertiary mt-1">
                    {pct(yearTotals[key]).toFixed(0)}% of revenue
                  </p>
                </div>
              ))}
            </div>

            {/* Monthly stacked bars */}
            <div className="mb-10 p-6 bg-cream border border-border-subtle rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary">
                  Monthly revenue
                </p>
                <div className="flex items-center gap-4">
                  {CHANNELS.map(({ key, label, color }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[11px] text-ink-tertiary">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between gap-1.5 h-52">
                {monthlyData.map((m) => {
                  const h = (m.total / maxMonthlyTotal) * 100;
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full flex flex-col justify-end h-44">
                        {/* tooltip */}
                        {m.total > 0 && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap bg-ink-primary text-white text-[11px] rounded px-2 py-1">
                            {eur0.format(m.total)}
                          </div>
                        )}
                        <div
                          className="w-full rounded-[3px] overflow-hidden flex flex-col-reverse transition-all"
                          style={{ height: `${Math.max(m.total > 0 ? 3 : 0, h)}%` }}
                        >
                          {CHANNELS.map(({ key, color }) =>
                            m[key] > 0 ? (
                              <div
                                key={key}
                                style={{
                                  backgroundColor: color,
                                  height: `${(m[key] / m.total) * 100}%`,
                                }}
                              />
                            ) : null
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-ink-tertiary">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel mix bar */}
            <div className="mb-10">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-3">Channel mix</p>
              <div className="flex w-full h-3 rounded-full overflow-hidden bg-linen">
                {CHANNELS.map(({ key, color }) =>
                  yearTotals[key] > 0 ? (
                    <div key={key} style={{ backgroundColor: color, width: `${pct(yearTotals[key])}%` }} />
                  ) : null
                )}
              </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-cream border border-border-subtle rounded-lg">
                <p className="font-serif text-[24px] tracking-[-0.02em] text-ink-primary">{eur2.format(adr)}</p>
                <p className="text-[11px] text-ink-tertiary uppercase tracking-[0.08em] mt-1">ADR</p>
              </div>
              <div className="p-4 bg-cream border border-border-subtle rounded-lg">
                <p className="font-serif text-[24px] tracking-[-0.02em] text-ink-primary">{yearTotals.nights}</p>
                <p className="text-[11px] text-ink-tertiary uppercase tracking-[0.08em] mt-1">Nights sold</p>
              </div>
              <div className="p-4 bg-cream border border-border-subtle rounded-lg">
                <p className="font-serif text-[24px] tracking-[-0.02em] text-ink-primary">{yearTotals.bookings}</p>
                <p className="text-[11px] text-ink-tertiary uppercase tracking-[0.08em] mt-1">Bookings</p>
              </div>
              <div className="p-4 bg-cream border border-border-subtle rounded-lg">
                <p className="font-serif text-[24px] tracking-[-0.02em] text-ink-primary">{eur0.format(avgBooking)}</p>
                <p className="text-[11px] text-ink-tertiary uppercase tracking-[0.08em] mt-1">Avg booking</p>
              </div>
            </div>

            {/* City tax note */}
            {cityTax > 0 && (
              <p className="text-[12px] text-ink-tertiary mt-6">
                City tax collected in {year}: {eur2.format(cityTax)}
              </p>
            )}

            {/* Data source note */}
            <div className="mt-10 p-5 bg-bone border border-border-subtle rounded-lg">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-2">Where this comes from</p>
              <p className="text-[13px] text-ink-body leading-relaxed">
                Revenue is read straight from your bookings. Airbnb and Booking.com figures come from the CSV exports you
                drop into{" "}
                <Link href="/import" className="underline hover:text-ink-primary">
                  Import
                </Link>
                ; direct revenue comes from bookings you add by hand. Amounts are bucketed by check-in month.
              </p>
              <p className="text-[12px] text-ink-tertiary mt-3 leading-relaxed">
                Note: Booking.com amounts are gross (before their commission) while Airbnb payouts are net — so the two
                aren&apos;t yet like-for-like. A commission setting can normalise them when you want net figures.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
