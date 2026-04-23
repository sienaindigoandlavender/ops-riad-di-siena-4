import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
  }
  result.push(current.trim());
  return result;
}

const THEME_KEYWORDS: Record<string, string[]> = {
  staff_friendliness: ["staff", "host", "welcome", "friendly", "helpful", "kind", "attentive", "service", "owner", "manager"],
  breakfast_quality: ["breakfast", "food", "dinner", "meal", "cook", "cuisine"],
  room_comfort: ["room", "bed", "mattress", "shower", "bathroom", "towel", "pillow", "terrace", "balcony"],
  cleanliness: ["clean", "dirty", "dust", "hygiene", "spotless", "tidy"],
  location_convenience: ["location", "close to", "near", "medina", "jemaa", "souks", "centre", "center", "walk"],
  wayfinding_difficulty: ["hard to find", "difficult to locate", "labyrinth", "lost", "confusing", "gps", "navigate"],
  noise: ["noise", "noisy", "quiet", "silence", "loud", "sound", "call to prayer"],
  price_fairness: ["expensive", "overpriced", "value", "worth", "cheap", "price", "cost"],
  expectations_mismatch: ["expected", "luxury", "not what", "disappointed", "misleading", "photos", "description"],
  temperature: ["cold", "hot", "heating", "air condition", "ac", "warm", "temperature", "freezing"],
};

function extractThemes(positiveText: string, negativeText: string): string[] {
  const combined = `${positiveText} ${negativeText}`.toLowerCase();
  const themes: string[] = [];
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      themes.push(theme);
    }
  }
  return themes;
}

function classifySentiment(score: number, positiveText: string, negativeText: string): string {
  const hasPositive = positiveText.trim().length > 10;
  const hasNegative = negativeText.trim().length > 10;

  if (score >= 9 && !hasNegative) return "positive";
  if (score >= 9 && hasNegative) return "mixed";
  if (score >= 7 && hasPositive && !hasNegative) return "positive";
  if (score >= 7) return "mixed";
  if (score <= 6) return "negative";
  return "neutral";
}

function detectExpectationMismatch(score: number, positiveText: string, negativeText: string): boolean {
  const neg = negativeText.toLowerCase();
  const contextualComplaints = [
    "hard to find", "difficult to find", "medina", "labyrinth",
    "no parking", "narrow streets", "traditional", "not a hotel",
    "no elevator", "no lift", "stairs", "cockroach", "insects",
    "call to prayer", "mosque",
  ];
  if (score >= 7 && contextualComplaints.some((c) => neg.includes(c))) {
    return true;
  }
  if (score <= 6 && positiveText.trim().length > 50) {
    return true;
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform") || "booking";

    const csvFile = platform === "airbnb" ? "airbnb_reviews_jan2025_onward.csv" : "reviews.csv";
    const csvPath = path.join(process.cwd(), "data", csvFile);
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: `${csvFile} not found in data/` }, { status: 404 });
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV is empty" }, { status: 400 });
    }

    const rows = lines.slice(1).map(parseCSVLine);

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      if (row.length < 14) { skipped++; continue; }

      const [reviewDate, guestName, reservationNumber, reviewTitle, positiveReview, negativeReview, reviewScore, staff, cleanliness, location, facilities, comfort, valueForMoney, propertyReply] = row;

      if (!reservationNumber) { skipped++; continue; }

      const score = parseFloat(reviewScore) || 0;
      const positive = positiveReview || "";
      const negative = negativeReview || "";

      const sentiment = classifySentiment(score, positive, negative);
      const themes = extractThemes(positive, negative);
      const expectationMismatch = detectExpectationMismatch(score, positive, negative);

      const record = {
        review_date: reviewDate || null,
        guest_name: guestName || "",
        reservation_number: reservationNumber,
        review_title: reviewTitle || "",
        positive_review: positive,
        negative_review: negative,
        review_score: score,
        staff: parseFloat(staff) || null,
        cleanliness: parseFloat(cleanliness) || null,
        location: parseFloat(location) || null,
        facilities: parseFloat(facilities) || null,
        comfort: parseFloat(comfort) || null,
        value_for_money: parseFloat(valueForMoney) || null,
        property_reply: propertyReply || "",
        platform,
        sentiment,
        themes,
        expectation_mismatch: expectationMismatch,
        enriched_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("booking_reviews")
        .upsert(record, { onConflict: "reservation_number" });

      if (error) {
        console.error(`Error upserting ${reservationNumber}:`, error.message);
        skipped++;
      } else {
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: rows.length,
    });
  } catch (error) {
    console.error("Reviews import error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
