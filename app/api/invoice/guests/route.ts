import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/supabase";

export const revalidate = 0;

export async function GET() {
  try {
    const allGuests = await getAllGuests();

    // Deduplicate by booking_id, keep latest
    const guestMap = new Map<string, typeof allGuests[0]>();
    for (const guest of allGuests) {
      if (guest.booking_id) {
        guestMap.set(guest.booking_id, guest);
      }
    }

    // Transform and sort by check_in descending (most recent first)
    const guests = Array.from(guestMap.values())
      .filter((g) => g.status !== "cancelled")
      .map((g) => ({
        booking_id: g.booking_id,
        first_name: g.first_name || "",
        last_name: g.last_name || "",
        guest_name: [g.first_name, g.last_name].filter(Boolean).join(" ") || "Unknown",
        email: g.email || "",
        phone: g.phone || "",
        country: g.country || "",
        property: g.property || "",
        room: g.room || "",
        check_in: g.check_in || "",
        check_out: g.check_out || "",
        nights: g.nights,
        guests: g.guests,
        adults: g.adults,
        children: g.children,
        total_eur: g.total_eur,
        city_tax: g.city_tax,
        source: g.source || "",
        special_requests: g.special_requests || "",
      }))
      .sort((a, b) => {
        if (!a.check_in) return 1;
        if (!b.check_in) return -1;
        return b.check_in.localeCompare(a.check_in);
      });

    return NextResponse.json({ guests });
  } catch (error) {
    console.error("Error fetching guests for invoice:", error);
    return NextResponse.json({ guests: [] }, { status: 500 });
  }
}
