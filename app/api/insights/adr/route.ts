import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const guests = await getAllGuests();

    const bookings = guests.filter(
      (g) => g.source !== "Blocked" && g.source !== "Blackout" && g.status !== "cancelled" && g.total_eur && g.nights
    );

    const byMonth: Record<string, { revenue: number; nights: number; count: number }> = {};
    const byYear: Record<string, { revenue: number; nights: number; count: number }> = {};

    for (const b of bookings) {
      const revenue = Number(b.total_eur);
      const nights = Number(b.nights);
      if (!revenue || !nights || !b.check_in) continue;

      const checkIn = new Date(b.check_in);
      if (isNaN(checkIn.getTime())) continue;

      const monthKey = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, "0")}`;
      const yearKey = String(checkIn.getFullYear());

      if (!byMonth[monthKey]) byMonth[monthKey] = { revenue: 0, nights: 0, count: 0 };
      byMonth[monthKey].revenue += revenue;
      byMonth[monthKey].nights += nights;
      byMonth[monthKey].count += 1;

      if (!byYear[yearKey]) byYear[yearKey] = { revenue: 0, nights: 0, count: 0 };
      byYear[yearKey].revenue += revenue;
      byYear[yearKey].nights += nights;
      byYear[yearKey].count += 1;
    }

    const totalRevenue = Object.values(byMonth).reduce((s, m) => s + m.revenue, 0);
    const totalNights = Object.values(byMonth).reduce((s, m) => s + m.nights, 0);
    const bookingCount = Object.values(byMonth).reduce((s, m) => s + m.count, 0);
    const overallAdr = totalNights > 0 ? totalRevenue / totalNights : 0;

    // Monthly array sorted by month
    const monthly = Object.entries(byMonth)
      .map(([month, d]) => ({
        month,
        adr: d.nights > 0 ? d.revenue / d.nights : 0,
        revenue: d.revenue,
        nights: d.nights,
        bookings: d.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Yearly array sorted by year
    const yearly = Object.entries(byYear)
      .map(([year, d]) => ({
        year,
        adr: d.nights > 0 ? d.revenue / d.nights : 0,
        revenue: d.revenue,
        nights: d.nights,
        bookings: d.count,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Trend: last 6 months vs previous 6 months
    const recent6 = monthly.slice(-6);
    const previous6 = monthly.slice(-12, -6);
    const recent6Total = recent6.reduce((s, m) => s + m.revenue, 0);
    const recent6Nights = recent6.reduce((s, m) => s + m.nights, 0);
    const prev6Total = previous6.reduce((s, m) => s + m.revenue, 0);
    const prev6Nights = previous6.reduce((s, m) => s + m.nights, 0);
    const recent6MonthsADR = recent6Nights > 0 ? recent6Total / recent6Nights : 0;
    const previous6MonthsADR = prev6Nights > 0 ? prev6Total / prev6Nights : 0;
    const percentChange = previous6MonthsADR > 0
      ? ((recent6MonthsADR - previous6MonthsADR) / previous6MonthsADR) * 100
      : 0;

    return NextResponse.json({
      overall: {
        adr: overallAdr,
        totalRevenue,
        totalNights,
        bookingCount,
      },
      monthly,
      yearly,
      trend: {
        recent6MonthsADR,
        previous6MonthsADR,
        percentChange,
      },
    });
  } catch (error) {
    console.error("ADR insights error:", error);
    return NextResponse.json({ error: "Failed to fetch ADR insights" }, { status: 500 });
  }
}
