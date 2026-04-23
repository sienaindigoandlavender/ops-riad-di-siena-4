import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

// On Vercel, /tmp is writable. Locally, write to data/
function getManualReviewsPath(): string {
  const isVercel = process.env.VERCEL === "1";
  const dir = isVercel ? "/tmp" : path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore
  }
  return path.join(dir, "manual_reviews.csv");
}

function csvEscape(s: string): string {
  const cleaned = (s || "").replace(/"/g, '""');
  return `"${cleaned}"`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      guestName = "",
      reservationNumber = "",
      reviewScore,
      reviewText = "",
      checkIn = "",
      source = "",
    } = body;

    if (!reviewScore || isNaN(parseFloat(reviewScore))) {
      return NextResponse.json({ error: "Score is required" }, { status: 400 });
    }

    const filePath = getManualReviewsPath();
    const headerRow = `"Review date","Guest name","Reservation number","Review title","Positive review","Negative review","Review score","Staff","Cleanliness","Location","Facilities","Comfort","Value for money","Property reply","Platform"`;

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, headerRow + "\n", "utf-8");
    }

    const score = parseFloat(reviewScore);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const reviewDate = checkIn ? `${checkIn} 12:00:00` : now;
    const platform = (source || "").toLowerCase().includes("airbnb") ? "airbnb" : "manual";

    // Split text heuristically: score >=7 treat as positive, <7 as negative
    const positiveText = score >= 7 ? reviewText : "";
    const negativeText = score < 7 ? reviewText : "";

    const row = [
      reviewDate,
      guestName,
      reservationNumber,
      "",
      positiveText,
      negativeText,
      String(score),
      String(score),
      String(score),
      String(score),
      String(score),
      String(score),
      String(score),
      "",
      platform,
    ].map(csvEscape).join(",");

    fs.appendFileSync(filePath, row + "\n", "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual review save error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
