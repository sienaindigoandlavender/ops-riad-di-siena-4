import { NextResponse } from "next/server";
import { supabase, MasterGuest } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Fetch every master_guests row, paging past PostgREST's 1000-row cap. */
async function fetchAllGuests(): Promise<MasterGuest[]> {
  const pageSize = 1000;
  let from = 0;
  const all: MasterGuest[] = [];
  // Hard stop at 100k rows so a bug can never loop forever.
  for (let guard = 0; guard < 100; guard++) {
    const { data, error } = await supabase
      .from("master_guests")
      .select("*")
      .order("check_in", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as MasterGuest[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// ── Sellable inventory ───────────────────────────────────────────────
// Rooms available to sell, used as the occupancy denominator.
// Jewel Box is Jacqueline's own room but is released now and then — mostly
// for direct reservations outside Booking.com / Airbnb — so it counts as
// inventory. Remove it here only if it's fully off the market.
const SELLABLE_ROOMS = [
  "Hidden Gem",   // The Riad
  "Jewel Box",    // The Riad — occasionally released for direct stays
  "Trésor Caché", // The Riad
  "Bliss",        // The Douaria
  "Joy",          // The Douaria
  "Love",         // The Douaria
];
const TOTAL_ROOMS = SELLABLE_ROOMS.length;

type Channel = "direct" | "airbnb" | "booking";

function classifyChannel(source: string): Channel {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("airbnb")) return "airbnb";
  if (s.includes("booking")) return "booking";
  return "direct";
}

/** Parse "YYYY-MM-DD" or "M/D/YYYY" into a Date (local, midnight). */
function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface ChannelTotals {
  revenue: number;
  nights: number;
  bookings: number;
}
const emptyChannel = (): ChannelTotals => ({ revenue: 0, nights: 0, bookings: 0 });

function daysInYear(y: number): number {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}
function daysInMonth(y: number, m0: number): number {
  return new Date(y, m0 + 1, 0).getDate();
}

export async function GET() {
  try {
    const guests = await fetchAllGuests();

    const bookings = guests.filter((g: MasterGuest) => {
      const src = (g.source || "").toLowerCase();
      if (src === "blocked" || src === "blackout") return false;
      if ((g.status || "").toLowerCase() === "cancelled") return false;
      if (!g.check_in) return false;
      return true;
    });

    const byYear: Record<string, Record<Channel, ChannelTotals>> = {};
    const monthly: Record<string, Record<string, Record<Channel, number>>> = {};
    const cityTaxByYear: Record<string, number> = {};
    const years = new Set<string>();

    // Occupancy is measured in room-nights distributed across the actual
    // calendar. soldByYearMonth[year][m0] = nights physically occupied that month.
    const soldByYearMonth: Record<string, number[]> = {};
    // Realized nights = nights that fall on or before "today" (for YTD occupancy).
    const realizedSoldByYear: Record<string, number> = {};

    const today = new Date();
    const todayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (const b of bookings) {
      const checkIn = parseDate(b.check_in);
      if (!checkIn) continue;

      const yearNum = checkIn.getFullYear();
      // Skip garbage dates that would create nonsense year tabs or huge loops.
      if (yearNum < 2010 || yearNum > 2100) continue;

      const year = String(yearNum);
      const monthKey = String(checkIn.getMonth() + 1).padStart(2, "0");
      const channel = classifyChannel(b.source);
      const revenue = Number(b.total_eur) || 0;
      const nights = Number(b.nights) || 0;
      const cityTax = Number(b.city_tax) || 0;

      years.add(year);

      // Revenue + bookings are recognised at check-in month (standard, simple).
      if (!byYear[year]) {
        byYear[year] = { direct: emptyChannel(), airbnb: emptyChannel(), booking: emptyChannel() };
      }
      byYear[year][channel].revenue += revenue;
      byYear[year][channel].nights += nights;
      byYear[year][channel].bookings += 1;

      if (!monthly[year]) monthly[year] = {};
      if (!monthly[year][monthKey]) monthly[year][monthKey] = { direct: 0, airbnb: 0, booking: 0 };
      monthly[year][monthKey][channel] += revenue;

      cityTaxByYear[year] = (cityTaxByYear[year] || 0) + cityTax;

      // Occupancy: walk the actual nights (check-in .. check-out-1). Fall back
      // to check-in + nights when check-out is missing.
      let checkOut = parseDate(b.check_out);
      if (!checkOut && nights > 0) {
        checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + Math.min(nights, 400));
      }
      if (checkOut && checkOut > checkIn) {
        const cur = new Date(checkIn);
        // Cap at 400 nights so one dirty check-out can't stall the request.
        let guard = 0;
        while (cur < checkOut && guard < 400) {
          const yy = String(cur.getFullYear());
          const mm = cur.getMonth();
          years.add(yy);
          if (!soldByYearMonth[yy]) soldByYearMonth[yy] = new Array(12).fill(0);
          soldByYearMonth[yy][mm] += 1;
          if (cur <= todayFloor) realizedSoldByYear[yy] = (realizedSoldByYear[yy] || 0) + 1;
          cur.setDate(cur.getDate() + 1);
          guard++;
        }
      }
    }

    // Occupancy % by month (full-month divisor) and a realized YTD headline.
    const occupancyMonthly: Record<string, number[]> = {};
    const occupancyByYear: Record<string, number> = {};
    const revparByYear: Record<string, number> = {};

    for (const yStr of Array.from(years)) {
      const y = Number(yStr);
      const sold = soldByYearMonth[yStr] || new Array(12).fill(0);

      occupancyMonthly[yStr] = sold.map((n, m0) => {
        const avail = TOTAL_ROOMS * daysInMonth(y, m0);
        return avail > 0 ? (n / avail) * 100 : 0;
      });

      // Realized occupancy: nights through today ÷ rooms × elapsed days.
      // Past years use the full year; current year uses days elapsed so the
      // number reflects how full we've actually been, not a diluted annual figure.
      const isCurrent = y === today.getFullYear();
      let elapsedDays: number;
      if (y < today.getFullYear()) elapsedDays = daysInYear(y);
      else if (y > today.getFullYear()) elapsedDays = daysInYear(y);
      else {
        const start = new Date(y, 0, 1);
        elapsedDays = Math.floor((todayFloor.getTime() - start.getTime()) / 86400000) + 1;
      }
      const realizedSold = isCurrent
        ? realizedSoldByYear[yStr] || 0
        : (soldByYearMonth[yStr] || []).reduce((a, b) => a + b, 0);
      const avail = TOTAL_ROOMS * elapsedDays;
      occupancyByYear[yStr] = avail > 0 ? (realizedSold / avail) * 100 : 0;

      // RevPAR = total room revenue ÷ available room-nights (same basis as
      // the realized occupancy above, so occupancy and RevPAR reconcile).
      const yc = byYear[yStr];
      const totalRev = yc ? yc.direct.revenue + yc.airbnb.revenue + yc.booking.revenue : 0;
      revparByYear[yStr] = avail > 0 ? totalRev / avail : 0;
    }

    const sortedYears = Array.from(years).sort();

    return NextResponse.json({
      years: sortedYears,
      rooms: TOTAL_ROOMS,
      byYear,
      monthly,
      cityTaxByYear,
      occupancyByYear,
      occupancyMonthly,
      revparByYear,
      today: todayFloor.toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Finance stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance stats", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
