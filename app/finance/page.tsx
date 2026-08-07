"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import LoadingScreen from "@/components/LoadingScreen";
import NewBookingModal from "@/components/NewBookingModal";

type Channel = "direct" | "airbnb" | "booking";

interface ChannelTotals {
  revenue: number;
  nights: number;
  bookings: number;
}

interface FinanceStats {
  years: string[];
  rooms: number;
  byYear: Record<string, Record<Channel, ChannelTotals>>;
  monthly: Record<string, Record<string, Record<Channel, number>>>;
  cityTaxByYear: Record<string, number>;
  occupancyByYear: Record<string, number>;
  occupancyMonthly: Record<string, number[]>;
  today: string;
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

function yearRevenue(stats: FinanceStats, y: string): number {
  const c = stats.byYear[y];
  if (!c) return 0;
  return c.direct.revenue + c.airbnb.revenue + c.booking.revenue;
}

export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>("");
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [importSource, setImportSource] = useState<null | "airbnb" | "booking">(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/finance/stats");
      const data: FinanceStats = await res.json();
      if ((data as unknown as { error?: string }).error) {
        setError("Could not load finance data.");
        return;
      }
      setStats(data);
      setYear((prev) => {
        if (prev) return prev;
        const thisYear = String(new Date().getFullYear());
        return data.years?.includes(thisYear) ? thisYear : data.years?.[data.years.length - 1] || thisYear;
      });
    } catch {
      setError("Could not load finance data.");
    }
  };

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImport = async (file: File, source: "airbnb" | "booking") => {
    setImporting(true);
    setImportMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const endpoint = source === "airbnb" ? "/api/finance/import-airbnb" : "/api/finance/import-booking";
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setImportMsg({ type: "error", text: data.error || "Import failed" });
        return;
      }
      const r = data.results;
      setImportMsg({
        type: "ok",
        text: `${r.reservations} reservations · €${Math.round(r.totalNet).toLocaleString("en-GB")} net · ${r.added} new, ${r.updated} updated`,
      });
      await loadStats();
    } catch {
      setImportMsg({ type: "error", text: "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  const currentYear = String(new Date().getFullYear());
  const currentMonth0 = new Date().getMonth();

  const yearTotals = useMemo(() => {
    const empty = { direct: 0, airbnb: 0, booking: 0, total: 0, nights: 0, bookings: 0 };
    if (!stats || !year || !stats.byYear[year]) return empty;
    const y = stats.byYear[year];
    const direct = y.direct.revenue, airbnb = y.airbnb.revenue, booking = y.booking.revenue;
    return {
      direct, airbnb, booking,
      total: direct + airbnb + booking,
      nights: y.direct.nights + y.airbnb.nights + y.booking.nights,
      bookings: y.direct.bookings + y.airbnb.bookings + y.booking.bookings,
    };
  }, [stats, year]);

  // Year-over-year comparison. For the current year we compare like-for-like
  // (Jan → this month) against the same window last year; completed years
  // compare full-year to full-year.
  const yoy = useMemo(() => {
    if (!stats || !year) return null;
    const idx = stats.years.indexOf(year);
    const prev = idx > 0 ? stats.years[idx - 1] : null;
    if (!prev) return { prev: null as string | null, thisVal: yearRevenue(stats, year), prevVal: 0, delta: null as number | null, samePeriod: false };

    const isCurrent = year === currentYear;
    const sumThrough = (y: string, upto0: number) => {
      const m = stats.monthly[y] || {};
      let s = 0;
      for (let i = 0; i <= upto0; i++) {
        const k = String(i + 1).padStart(2, "0");
        const rec = m[k];
        if (rec) s += rec.direct + rec.airbnb + rec.booking;
      }
      return s;
    };

    let thisVal: number, prevVal: number;
    if (isCurrent) {
      thisVal = sumThrough(year, currentMonth0);
      prevVal = sumThrough(prev, currentMonth0);
    } else {
      thisVal = yearRevenue(stats, year);
      prevVal = yearRevenue(stats, prev);
    }
    const delta = prevVal > 0 ? ((thisVal - prevVal) / prevVal) * 100 : null;
    return { prev, thisVal, prevVal, delta, samePeriod: isCurrent };
  }, [stats, year, currentYear, currentMonth0]);

  const monthlyData = useMemo(() => {
    const months = stats?.monthly[year] || {};
    const occ = stats?.occupancyMonthly[year] || new Array(12).fill(0);
    return MONTHS.map((label, i) => {
      const key = String(i + 1).padStart(2, "0");
      const m = months[key] || { direct: 0, airbnb: 0, booking: 0 };
      return { label, ...m, total: m.direct + m.airbnb + m.booking, occupancy: occ[i] || 0 };
    });
  }, [stats, year]);

  const maxMonthlyTotal = useMemo(() => Math.max(1, ...monthlyData.map((m) => m.total)), [monthlyData]);

  const allYearsMax = useMemo(
    () => (stats ? Math.max(1, ...stats.years.map((y) => yearRevenue(stats, y))) : 1),
    [stats]
  );

  if (loading) return <LoadingScreen />;

  const adr = yearTotals.nights > 0 ? yearTotals.total / yearTotals.nights : 0;
  const avgBooking = yearTotals.bookings > 0 ? yearTotals.total / yearTotals.bookings : 0;
  const occupancy = stats?.occupancyByYear[year] || 0;
  const rooms = stats?.rooms || 6;
  const pct = (v: number) => (yearTotals.total > 0 ? (v / yearTotals.total) * 100 : 0);

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader />

      <header className="border-b border-border-subtle py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-ink-tertiary hover:text-ink-primary transition-colors text-[13px]">← Back</Link>
            <div>
              <h1 className="font-serif text-[22px] tracking-[-0.02em]">Finance</h1>
              <p className="text-[11px] text-ink-tertiary">Revenue &amp; occupancy</p>
            </div>
          </div>
          {stats && stats.years.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {stats.years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
                      y === year ? "bg-black/[0.05] text-ink-primary font-medium" : "text-ink-tertiary hover:text-ink-primary"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setImportSource("airbnb"); setImportMsg(null); }}
                className="px-3 py-1.5 border border-border text-ink-body text-[12px] font-medium rounded-md hover:border-border-strong transition-colors whitespace-nowrap"
              >
                Import Airbnb
              </button>
              <button
                onClick={() => { setImportSource("booking"); setImportMsg(null); }}
                className="px-3 py-1.5 border border-border text-ink-body text-[12px] font-medium rounded-md hover:border-border-strong transition-colors whitespace-nowrap"
              >
                Import Booking
              </button>
              <button
                onClick={() => setShowAddBooking(true)}
                className="px-3.5 py-1.5 bg-accent text-cream text-[12px] font-medium rounded-md hover:bg-accent-strong transition-colors whitespace-nowrap"
              >
                + Direct booking
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-8 p-4 bg-brick/10 border border-brick/30 rounded-lg text-brick text-[13px]">{error}</div>
        )}

        {stats && !error && (
          <>
            {/* Headline: revenue (with YoY) + occupancy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              <div className="p-6 bg-cream border border-border-subtle rounded-lg">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-2">
                  Revenue · {year}
                </p>
                <p className="font-serif text-[40px] leading-none tracking-[-0.02em] text-ink-primary">
                  {eur0.format(yearTotals.total)}
                </p>
                {yoy && yoy.delta !== null && (
                  <p className="text-[12px] mt-3">
                    <span className={yoy.delta >= 0 ? "text-forest font-medium" : "text-brick font-medium"}>
                      {yoy.delta >= 0 ? "▲" : "▼"} {Math.abs(yoy.delta).toFixed(0)}%
                    </span>{" "}
                    <span className="text-ink-tertiary">
                      {yoy.samePeriod ? `vs same period ${yoy.prev}` : `vs ${yoy.prev}`}
                    </span>
                  </p>
                )}
                {yoy && yoy.delta === null && (
                  <p className="text-[12px] text-ink-tertiary mt-3">First year on record</p>
                )}
              </div>

              <div className="p-6 bg-cream border border-border-subtle rounded-lg">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-2">
                  Occupancy · {year}
                </p>
                <p className="font-serif text-[40px] leading-none tracking-[-0.02em] text-ink-primary">
                  {occupancy.toFixed(0)}%
                </p>
                <p className="text-[12px] text-ink-tertiary mt-3">
                  {yearTotals.nights} nights · {rooms} rooms
                  {year === currentYear ? " · year to date" : ""}
                </p>
              </div>
            </div>

            {/* Revenue year over year */}
            {stats.years.length > 1 && (
              <div className="mb-10 p-6 bg-cream border border-border-subtle rounded-lg">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-6">Revenue by year</p>
                <div className="flex items-end justify-start gap-6 h-40">
                  {stats.years.map((y) => {
                    const val = yearRevenue(stats, y);
                    const h = (val / allYearsMax) * 100;
                    return (
                      <div key={y} className="flex flex-col items-center gap-2" style={{ width: 64 }}>
                        <span className="text-[11px] text-ink-secondary">{eur0.format(val)}</span>
                        <div className="w-full flex flex-col justify-end h-28">
                          <div
                            className="w-full rounded-[3px] transition-all"
                            style={{
                              height: `${Math.max(val > 0 ? 4 : 0, h)}%`,
                              backgroundColor: y === year ? "#2C2C2C" : "#D5D5D3",
                            }}
                          />
                        </div>
                        <span className={`text-[11px] ${y === year ? "text-ink-primary font-medium" : "text-ink-tertiary"}`}>{y}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Occupancy by month */}
            <div className="mb-10 p-6 bg-cream border border-border-subtle rounded-lg">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-6">Occupancy by month</p>
              <div className="flex items-end justify-between gap-1.5 h-40">
                {monthlyData.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex flex-col justify-end h-28">
                      {m.occupancy > 0 && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap bg-ink-primary text-white text-[11px] rounded px-2 py-1">
                          {m.occupancy.toFixed(0)}%
                        </div>
                      )}
                      <div
                        className="w-full rounded-[3px] bg-sage transition-all"
                        style={{ height: `${Math.max(m.occupancy > 0 ? 3 : 0, m.occupancy)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-tertiary">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel breakdown */}
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-3">Revenue by channel</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {CHANNELS.map(({ key, label, color }) => (
                <div key={key} className="p-5 bg-cream border border-border-subtle rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[12px] text-ink-secondary">{label}</span>
                  </div>
                  <p className="font-serif text-[26px] tracking-[-0.02em] text-ink-primary">{eur0.format(yearTotals[key])}</p>
                  <p className="text-[11px] text-ink-tertiary mt-1">{pct(yearTotals[key]).toFixed(0)}% of revenue</p>
                </div>
              ))}
            </div>

            {/* Channel mix bar */}
            <div className="mb-10">
              <div className="flex w-full h-3 rounded-full overflow-hidden bg-linen">
                {CHANNELS.map(({ key, color }) =>
                  yearTotals[key] > 0 ? (
                    <div key={key} style={{ backgroundColor: color, width: `${pct(yearTotals[key])}%` }} />
                  ) : null
                )}
              </div>
            </div>

            {/* Monthly revenue (stacked by channel) */}
            <div className="mb-10 p-6 bg-cream border border-border-subtle rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary">Monthly revenue</p>
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
                              <div key={key} style={{ backgroundColor: color, height: `${(m[key] / m.total) * 100}%` }} />
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

            {/* Data source note */}
            <div className="mt-10 p-5 bg-bone border border-border-subtle rounded-lg">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink-tertiary mb-2">Where this comes from</p>
              <p className="text-[13px] text-ink-body leading-relaxed">
                Revenue is read straight from your bookings. Airbnb and Booking.com figures come from the CSV exports you drop into{" "}
                <Link href="/import" className="underline hover:text-ink-primary">Import</Link>; direct revenue comes from bookings you add by hand.
                Occupancy is measured against {rooms} rooms.
              </p>
              <p className="text-[12px] text-ink-tertiary mt-3 leading-relaxed">
                Note: Booking.com amounts are gross (before commission) while Airbnb payouts are net — not yet like-for-like. A commission
                setting can normalise them when you want net figures.
              </p>
            </div>
          </>
        )}
      </main>

      {showAddBooking && (
        <NewBookingModal
          initialRoom="Hidden Gem"
          initialDate=""
          onClose={() => setShowAddBooking(false)}
          onSaved={async () => {
            await loadStats();
          }}
        />
      )}

      {importSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/10" onClick={() => !importing && setImportSource(null)} />
          <div className="relative bg-cream border border-border-subtle rounded-lg w-full max-w-md p-7 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[18px] tracking-[-0.02em]">
                {importSource === "airbnb" ? "Import Airbnb earnings" : "Import Booking.com statements"}
              </h2>
              <button
                onClick={() => !importing && setImportSource(null)}
                className="text-ink-tertiary hover:text-ink-primary transition-colors"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            <p className="text-[12px] text-ink-tertiary leading-relaxed mb-5">
              {importSource === "airbnb"
                ? "Airbnb → Transaction history → set your date range → Export CSV. This is the earnings file (net payouts), not the reservations export."
                : "Booking.com Extranet → Finance → Reservation statements → pick the period → Download CSV. These carry the true net after commission."}
            </p>

            <label
              className={`block border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
                importing ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-border-strong"
              }`}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                disabled={importing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && importSource) handleImport(f, importSource);
                  e.target.value = "";
                }}
              />
              {importing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-border border-t-black rounded-full animate-spin" />
                  <span className="text-[13px] text-ink-secondary">Processing…</span>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-ink-body mb-1">Drop the CSV or click to select</p>
                  <p className="text-[11px] text-ink-tertiary">Net revenue is calculated per booking</p>
                </>
              )}
            </label>

            {importMsg && (
              <div
                className={`mt-4 p-3 rounded-lg text-[12px] ${
                  importMsg.type === "ok"
                    ? "bg-sage/10 border border-sage/30 text-forest"
                    : "bg-brick/10 border border-brick/30 text-brick"
                }`}
              >
                {importMsg.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
