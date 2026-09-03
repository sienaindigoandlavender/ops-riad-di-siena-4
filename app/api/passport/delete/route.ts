import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getGuestByBookingId, updateGuestByBookingId } from "@/lib/supabase";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dhv1s6fgm",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = (await request.json()) as { bookingId: string };
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Read the stored public_ids off the booking.
    const guest = await getGuestByBookingId(bookingId);
    if (!guest) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    let publicIds: string[] = [];
    const raw = (guest as unknown as Record<string, unknown>).passport_public_ids;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) publicIds = parsed.filter((x) => typeof x === "string");
      } catch {
        // ignore parse errors — nothing to delete from Cloudinary
      }
    }

    // Delete each image from Cloudinary. resource_type "image" covers scans;
    // "auto" uploads of PDFs land as "image" too on most plans, but we try both.
    const results: Record<string, string> = {};
    for (const pid of publicIds) {
      try {
        const r = await cloudinary.uploader.destroy(pid, { resource_type: "image", invalidate: true });
        results[pid] = r.result;
        if (r.result !== "ok") {
          // fallback: try raw (for PDFs stored as raw)
          const r2 = await cloudinary.uploader.destroy(pid, { resource_type: "raw", invalidate: true });
          results[pid] = r2.result;
        }
      } catch (e) {
        results[pid] = e instanceof Error ? e.message : "error";
      }
    }

    // Clear the record on the booking regardless of individual Cloudinary results,
    // so the app no longer references deleted scans.
    await updateGuestByBookingId(bookingId, {
      passport_docs: null,
      passport_public_ids: null,
      passport_uploaded: false,
      passport_uploaded_at: null,
    } as unknown as Parameters<typeof updateGuestByBookingId>[1]);

    return NextResponse.json({ success: true, deleted: results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Passport delete error:", msg);
    return NextResponse.json({ error: "Failed to delete scans", detail: msg }, { status: 500 });
  }
}
