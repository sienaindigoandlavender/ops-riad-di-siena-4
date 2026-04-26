import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// One-off recovery endpoint: undoes the destructive auto-cancel pass that
// the importer used to run on Booking.com re-imports (now removed).
// Restores future Booking.com bookings whose status was flipped to
// "cancelled" by the importer within a recent window.
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get("since");
    const dryRun = url.searchParams.get("dryRun") === "true";

    const since = sinceParam
      ? new Date(sinceParam)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isNaN(since.getTime())) {
      return NextResponse.json({ error: "Invalid 'since' timestamp" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: candidates, error: selectError } = await supabase
      .from("master_guests")
      .select("id, booking_id, first_name, last_name, check_in, source, status, updated_at")
      .ilike("source", "%booking%")
      .in("status", ["cancelled", "canceled"])
      .gte("check_in", today)
      .gte("updated_at", since.toISOString())
      .order("check_in", { ascending: true });

    if (selectError) {
      return NextResponse.json(
        { error: "Failed to fetch candidates", details: selectError.message },
        { status: 500 }
      );
    }

    const matches = candidates || [];

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        since: since.toISOString(),
        count: matches.length,
        bookings: matches,
      });
    }

    if (matches.length === 0) {
      return NextResponse.json({
        restored: 0,
        since: since.toISOString(),
        bookings: [],
      });
    }

    const ids = matches.map((m) => m.id);
    const { error: updateError } = await supabase
      .from("master_guests")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .in("id", ids);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to restore bookings", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      restored: matches.length,
      since: since.toISOString(),
      bookings: matches,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Restore failed", details: String(error) },
      { status: 500 }
    );
  }
}
