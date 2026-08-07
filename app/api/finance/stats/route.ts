import { NextRequest, NextResponse } from "next/server";
import {
  getAllGuests,
  insertGuests,
  updateGuestByBookingId,
  MasterGuest,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// Airbnb Transaction History ("earnings") importer.
//
// This is a DIFFERENT file from the Reservations export handled by /import.
// It contains payouts, adjustments, cancellation fees and multiple rows per
// reservation, across several currencies. We keep only EUR revenue rows,
// net them per confirmation code, and upsert into master_guests as the
// canonical (net) Airbnb revenue. No cancellation sweep — this is history,
// not a clean forward list.
// ─────────────────────────────────────────────────────────────────────

// Transaction "Type" values that represent money we keep (all summed, so
// negative adjustments reduce the net for that reservation).
const REVENUE_TYPES = new Set([
  "Reservation",
  "Resolution Adjustment",
  "Resolution Payout",
  "Adjustment",
  "Cancellation Fee",
  "Cancellation Fee Refund",
  "Paid Photography Adjustment",
]);

const ROOM_MAPPINGS: { pattern: RegExp; room: string; property: string }[] = [
  { pattern: /hidden\s*gem/i, room: "Hidden Gem", property: "The Riad" },
  { pattern: /tresor|trésor/i, room: "Trésor Caché", property: "The Riad" },
  { pattern: /jewel\s*box/i, room: "Jewel Box", property: "The Riad" },
  { pattern: /\blove\b/i, room: "Love", property: "The Douaria" },
  { pattern: /\bjoy\b/i, room: "Joy", property: "The Douaria" },
  { pattern: /\bbliss\b/i, room: "Bliss", property: "The Douaria" },
];

function mapListing(listing: string): { property: string; room: string } {
  if (!listing) return { property: "The Riad", room: "" };
  for (const m of ROOM_MAPPINGS) {
    if (m.pattern.test(listing)) return { property: m.property, room: m.room };
  }
  const lower = listing.toLowerCase();
  if (lower.includes("annex") || lower.includes("douaria")) return { property: "The Douaria", room: "" };
  return { property: "The Riad", room: "" };
}

/** MM/DD/YYYY → YYYY-MM-DD. */
function toISO(dateStr: string): string {
  if (!dateStr) return "";
  const us = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  // Strip BOM, split on newlines, drop blank lines.
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const vals = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
    return obj;
  });
  return { headers, rows };
}

interface AggRecord {
  net: number;
  gross: number;
  check_in: string;
  check_out: string;
  nights: number;
  listing: string;
  guest: string;
  hasReservation: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    // Validate this really is the transaction-history export.
    const hset = new Set(headers.map((h) => h.toLowerCase()));
    const looksRight =
      hset.has("type") && hset.has("confirmation code") && hset.has("amount") && hset.has("currency");
    if (!looksRight) {
      return NextResponse.json(
        {
          error:
            "This doesn't look like an Airbnb transaction/earnings export. Expected columns include Type, Confirmation code, Amount, Currency. For the reservations export, use the Import page instead.",
          detectedHeaders: headers.slice(0, 12),
        },
        { status: 400 }
      );
    }

    // Aggregate EUR revenue rows by confirmation code.
    const agg = new Map<string, AggRecord>();
    let skippedNonEur = 0;
    let payoutRows = 0;

    for (const r of rows) {
      const type = (r["Type"] || "").trim();
      const currency = (r["Currency"] || "").trim().toUpperCase();
      if (type === "Payout") { payoutRows++; continue; }
      if (!REVENUE_TYPES.has(type)) continue;
      if (currency !== "EUR") { skippedNonEur++; continue; }

      const code = (r["Confirmation code"] || "").trim();
      if (!code) continue; // adjustments with no code can't be placed on a stay

      const amount = parseFloat((r["Amount"] || "0").replace(/[^\d.-]/g, "")) || 0;
      const gross = parseFloat((r["Gross earnings"] || "0").replace(/[^\d.-]/g, "")) || 0;

      let rec = agg.get(code);
      if (!rec) {
        rec = { net: 0, gross: 0, check_in: "", check_out: "", nights: 0, listing: "", guest: "", hasReservation: false };
        agg.set(code, rec);
      }
      rec.net += amount;
      rec.gross += gross;

      if (type === "Reservation") {
        rec.hasReservation = true;
        rec.check_in = toISO(r["Start date"] || "");
        rec.check_out = toISO(r["End date"] || "");
        rec.nights = parseInt(r["Nights"] || "0", 10) || 0;
        rec.listing = r["Listing"] || "";
        rec.guest = r["Guest"] || "";
      }
    }

    // Existing bookings keyed by confirmation code, so we upsert.
    const existing = await getAllGuests();
    const existingByCode = new Map<string, MasterGuest>();
    existing.forEach((g) => {
      if (g.booking_id) existingByCode.set(g.booking_id.trim(), g);
    });

    const toAdd: Partial<MasterGuest>[] = [];
    const results = {
      reservations: 0,
      added: 0,
      updated: 0,
      skippedNoDates: 0,
      skippedNonEur,
      payoutRows,
      totalNet: 0,
      byYear: {} as Record<string, number>,
    };

    for (const [code, rec] of Array.from(agg.entries())) {
      // Need a Reservation row (for dates) to place the stay; skip pure-adjustment codes.
      if (!rec.hasReservation || !rec.check_in) {
        results.skippedNoDates++;
        continue;
      }

      results.reservations++;
      const net = Math.round(rec.net * 100) / 100;
      results.totalNet += net;
      const y = rec.check_in.slice(0, 4);
      results.byYear[y] = (results.byYear[y] || 0) + net;

      const { property, room } = mapListing(rec.listing);
      const nameParts = rec.guest.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const existingRow = existingByCode.get(code);
      if (existingRow) {
        // Update only financial + stay fields — leave operational flags intact.
        await updateGuestByBookingId(code, {
          source: "Airbnb",
          status: "confirmed",
          check_in: rec.check_in || undefined,
          check_out: rec.check_out || undefined,
          nights: rec.nights || null,
          property,
          room,
          total_eur: net,
        });
        results.updated++;
      } else {
        toAdd.push({
          booking_id: code,
          source: "Airbnb",
          status: "confirmed",
          first_name: firstName,
          last_name: lastName,
          property,
          room,
          check_in: rec.check_in || undefined,
          check_out: rec.check_out || undefined,
          nights: rec.nights || null,
          total_eur: net,
        });
        results.added++;
      }
    }

    if (toAdd.length > 0) await insertGuests(toAdd);

    results.totalNet = Math.round(results.totalNet * 100) / 100;

    return NextResponse.json({ success: true, source: "airbnb-earnings", results });
  } catch (error) {
    console.error("Airbnb earnings import error:", error);
    return NextResponse.json({ error: "Import failed", details: String(error) }, { status: 500 });
  }
}
