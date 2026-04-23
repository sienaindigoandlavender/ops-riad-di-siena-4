import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // On Vercel, /tmp is the only writable directory.
    // Locally, write to data/ alongside the repo file.
    const isVercel = process.env.VERCEL === "1";
    const dataDir = isVercel ? "/tmp" : path.join(process.cwd(), "data");

    try {
      await mkdir(dataDir, { recursive: true });
    } catch {
      // already exists
    }

    const filePath = path.join(dataDir, "reviews.csv");
    await writeFile(filePath, buffer);

    const content = buffer.toString("utf-8");
    const lines = content.split("\n").filter((line) => line.trim());
    const rowCount = Math.max(0, lines.length - 1);

    return NextResponse.json({
      success: true,
      message: `Uploaded ${rowCount} reviews${isVercel ? " (temporary)" : ""}`,
      rowCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Upload error:", msg);
    return NextResponse.json(
      { error: `Upload failed: ${msg}` },
      { status: 500 }
    );
  }
}
