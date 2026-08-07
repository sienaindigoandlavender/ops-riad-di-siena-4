import { NextResponse } from "next/server";
import { getAllGuests, MasterGuest } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Channel = "direct" | "airbnb" | "booking";

/** Classify a booking source into one of the three revenue channels. */
function classifyChannel(source: string): Channel {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("airbnb")) return "airbnb";
  if (s.includes("booking")) return "booking";
  // Website, WhatsApp, Direct, Email, Other → all count as direct
  return "direct";
}

interface ChannelTotals {
  revenue: number;
  nights: number;
  bookings: number;
}

function emptyChannelTotals(): ChannelTotals {
  return { revenue: 0, nights: 0, bookings: 0 };
}

export async function GET() {
  try {
    const guests = await getAllGuests();

    // Real, revenue-bearing bookings only — drop blocks, blackouts, cancellations.
    const bookings = guests.filter((g: MasterGuest) => {
      const src = (g.source || "").toLowerCase();
      if (src === "blocked" || src === "blackout") return false;
      if ((g.status || "").toLowerCase() === "cancelled") return false;
      if (!g.check_in) return false;
      return true;
    });

    // Per-year → per-channel totals, and per-year → per-month → per-channel revenue.
    const byYear: Record<string, Record<Channel, ChannelTotals>> = {};
    const monthly: Record<string, Record<string, Record<Channel, number>>> = {};
    const cityTaxByYear: Record<string, number> = {};
    const years = new Set<string>();

    for (const b of bookings) {
      const checkIn = new Date(b.check_in);
      if (isNaN(checkIn.getTime())) continue;

      const year = String(checkIn.getFullYear());
      const monthKey = String(checkIn.getMonth() + 1).padStart(2, "0"); // "01".."12"
      const channel = classifyChannel(b.source);
      const revenue = Number(b.total_eur) || 0;
      const nights = Number(b.nights) || 0;
      const cityTax = Number(b.city_tax) || 0;

      years.add(year);

      if (!byYear[year]) {
        byYear[year] = { direct: emptyChannelTotals(), airbnb: emptyChannelTotals(), booking: emptyChannelTotals() };
      }
      byYear[year][channel].revenue += revenue;
      byYear[year][channel].nights += nights;
      byYear[year][channel].bookings += 1;

      if (!monthly[year]) monthly[year] = {};
      if (!monthly[year][monthKey]) monthly[year][monthKey] = { direct: 0, airbnb: 0, booking: 0 };
      monthly[year][monthKey][channel] += revenue;

      cityTaxByYear[year] = (cityTaxByYear[year] || 0) + cityTax;
    }

    const sortedYears = Array.from(years).sort();

    return NextResponse.json({
      years: sortedYears,
      byYear,
      monthly,
      cityTaxByYear,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Finance stats error:", error);
    return NextResponse.json({ error: "Failed to fetch finance stats" }, { status: 500 });
  }
}
