import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dhv1s6fgm",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bookingId = (formData.get("bookingId") as string) || "unknown";
    const slot = (formData.get("slot") as string) || "doc"; // e.g. g1-id, g1-stamp

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be JPG, PNG, WebP, or PDF" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // Sensitive documents go to their own folder so they can be
    // managed / purged separately from other uploads.
    const safeBooking = bookingId.replace(/[^a-zA-Z0-9_-]/g, "");
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "riad-passports",
      resource_type: "auto",
      public_id: `${safeBooking}-${slot}-${Date.now()}`,
      // type: "authenticated", // uncomment if your Cloudinary plan supports signed/private delivery
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Passport upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
