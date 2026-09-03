import { NextRequest, NextResponse } from "next/server";
import { updateGuestByBookingId } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, urls, public_ids } = body as {
      bookingId: string;
      urls: {
        guest1_id?: string | null;
        guest1_stamp?: string | null;
        guest2_id?: string | null;
        guest2_stamp?: string | null;
      };
      public_ids?: string[];
    };

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Store all passport URLs as JSON, the Cloudinary public_ids (for later deletion),
    // plus a flag + timestamp.
    const updates: Record<string, unknown> = {
      passport_docs: JSON.stringify(urls || {}),
      passport_public_ids: JSON.stringify(public_ids || []),
      passport_uploaded: true,
      passport_uploaded_at: new Date().toISOString(),
    };

    await updateGuestByBookingId(bookingId, updates as unknown as Parameters<typeof updateGuestByBookingId>[1]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Passport save error:", msg);
    return NextResponse.json({ error: "Failed to save passport records", detail: msg }, { status: 500 });
  }
}
