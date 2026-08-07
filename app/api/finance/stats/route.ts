import { NextRequest, NextResponse } from "next/server";
import {
  getAllGuests,
  insertGuests,
  updateGuestByBookingId,
  MasterGuest,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// Booking.com "Reservation statements" importer (Finance → Reservation
// statements → Download CSV). These carry the true NET per reservation —
// commission and payment fees already subtracted — which is the honest
// take-home figure. We net by booking number and upsert into master_guests
// as the canonical Booking.com revenue. No cancellation sweep.
//
// Note: statements have no room/listing column, so property/room is left
// untouched on existing rows and defaults to "The Riad" on brand-new ones.
// ─────────────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/** "30 Dec 2024" / "11 Sept 2022" → "YYYY-MM-DD". */
function parseBookingDate(s: string): string {
  if (!s) return "";
  const p = s.trim().split(/\s+/);
  if (p.length !== 3) return "";
  const d = parseInt(p[0], 10);
  const m = MONTHS[p[1].toLowerCase().replace(/\.$/, "")];
  const y = parseInt(p[2], 10);
  if (!d || !m || !y) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function nightsBetween(ci: string, co: string): number {
  if (!ci || !co) return 0;
  const a = new Date(ci).getTime();
  const b = new Date(co).getTime();
  if (isNaN(a) || isNaN(b) || b <= a) return 0;
  return Math.round((b - a) / 86400000);
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

    const hset = new Set(headers.map((h) => h.toLowerCase()));
    const looksRight =
      hset.has("booking number") && hset.has("net") && hset.has("check-in") && hset.has("type");
    if (!looksRight) {
      return NextResponse.json(
        {
          error:
            "This doesn't look like a Booking.com reservation statement. Expected columns include Booking number, Check-in, Net, Type. In the Extranet: Finance → Reservation statements → Download CSV.",
          detectedHeaders: headers.slice(0, 12),
        },
        { status: 400 }
      );
    }

    // Net by booking number. Sum Net across every row that carries the number
    // (reservation + commission adjustments + complaints), so refunds and
    // clawbacks reduce the take-home. Dates/guest come from the Reservation row.
    const agg = new Map<string, AggRecord>();

    for (const r of rows) {
      const code = (r["Booking number"] || "").trim();
      if (!code) continue;

      const netRaw = (r["Net"] || "").replace(/[^\d.-]/g, "");
      const grossRaw = (r["Amount"] || "").replace(/[^\d.-]/g, "");
      const net = netRaw ? parseFloat(netRaw) : 0;
      const gross = grossRaw ? parseFloat(grossRaw) : 0;

      let rec = agg.get(code);
      if (!rec) {
        rec = { net: 0, gross: 0, check_in: "", check_out: "", guest: "", hasReservation: false };
        agg.set(code, rec);
      }
      if (!isNaN(net)) rec.net += net;
      if (!isNaN(gross)) rec.gross += gross;

      if ((r["Type"] || "").trim() === "Reservation") {
        rec.hasReservation = true;
        rec.check_in = parseBookingDate(r["Check-in"] || "");
        rec.check_out = parseBookingDate(r["Checkout"] || r["Check-out"] || "");
        rec.guest = r["Guest name"] || "";
      }
    }

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
      totalNet: 0,
      totalGross: 0,
      byYear: {} as Record<string, number>,
    };

    for (const [code, rec] of Array.from(agg.entries())) {
      if (!rec.hasReservation || !rec.check_in) {
        results.skippedNoDates++;
        continue;
      }

      results.reservations++;
      const net = Math.round(rec.net * 100) / 100;
      results.totalNet += net;
      results.totalGross += rec.gross;
      const y = rec.check_in.slice(0, 4);
      results.byYear[y] = (results.byYear[y] || 0) + net;

      const nights = nightsBetween(rec.check_in, rec.check_out);
      const nameParts = rec.guest.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const existingRow = existingByCode.get(code);
      if (existingRow) {
        // Overwrite the gross that the reservations import stored with true net.
        // Leave room/property/operational fields alone.
        await updateGuestByBookingId(code, {
          source: "Booking.com",
          status: "confirmed",
          check_in: rec.check_in || undefined,
          check_out: rec.check_out || undefined,
          nights: nights || existingRow.nights || null,
          total_eur: net,
        });
        results.updated++;
      } else {
        toAdd.push({
          booking_id: code,
          source: "Booking.com",
          status: "confirmed",
          first_name: firstName,
          last_name: lastName,
          property: "The Riad",
          room: "",
          check_in: rec.check_in || undefined,
          check_out: rec.check_out || undefined,
          nights: nights || null,
          total_eur: net,
        });
        results.added++;
      }
    }

    if (toAdd.length > 0) await insertGuests(toAdd);

    results.totalNet = Math.round(results.totalNet * 100) / 100;
    results.totalGross = Math.round(results.totalGross * 100) / 100;

    return NextResponse.json({ success: true, source: "booking-statements", results });
  } catch (error) {
    console.error("Booking statements import error:", error);
    return NextResponse.json({ error: "Import failed", details: String(error) }, { status: 500 });
  }
}
