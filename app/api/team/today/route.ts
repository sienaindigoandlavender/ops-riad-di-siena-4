import { NextRequest, NextResponse } from "next/server";
import { getAllGuests, MasterGuest } from "@/lib/supabase";

function normalizePhone(phone: string | number | undefined): string {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("'")) cleaned = cleaned.slice(1);
  if (cleaned && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const today = dateParam || new Date().toISOString().split("T")[0];

    const guests = await getAllGuests();

    // Filter active bookings for today
    const active = guests.filter((g) => {
      if (!g.check_in || !g.check_out) return false;
      if (g.status === "cancelled" || g.source === "Blocked" || g.source === "Blackout") return false;
      return g.check_in <= today && g.check_out >= today;
    });

    const checkIns = active.filter((g) => g.check_in === today);
    const checkOuts = active.filter((g) => g.check_out === today);

    const formatGuest = (g: MasterGuest) => ({
      booking_id: g.booking_id || "",
      guest_name: `${g.first_name || ""} ${g.last_name || ""}`.trim() || "Guest",
      room: g.room || "",
      property: g.property || "",
      arrival_time: g.arrival_time_confirmed || g.arrival_time_stated || "",
      check_in: g.check_in || "",
      check_out: g.check_out || "",
      nights: g.nights || 0,
      guests: g.guests || 0,
      channel: g.source || "",
      special_requests: g.special_requests || "",
      notes: g.notes || "",
      phone: normalizePhone(g.phone),
      email: g.email || "",
      city_tax_paid: g.city_tax_paid || "",
    });

    return NextResponse.json({
      date: today,
      checkIns: checkIns.map(formatGuest),
      checkOuts: checkOuts.map(formatGuest),
    });
  } catch (error) {
    console.error("Team today error:", error);
    return NextResponse.json({ error: "Failed to fetch today's guests" }, { status: 500 });
  }
}
