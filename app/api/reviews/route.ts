import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Booking.com uses a recency-weighted score over the last 36 months.
// Newer reviews count more than older ones.
function calculateWeightedScore(reviews: { review_date: string | null; review_score: number }[]): number {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 36);

  const eligible = reviews.filter((r) => {
    if (!r.review_score || r.review_score <= 0) return false;
    if (!r.review_date) return false;
    const d = new Date(r.review_date);
    return d >= cutoff;
  });

  if (eligible.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;
  for (const r of eligible) {
    const d = new Date(r.review_date!);
    const ageInMonths = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30);
    // Linear decay: newest = 1.0, 36 months old = ~0.1
    const weight = Math.max(0.1, 1 - (ageInMonths / 36) * 0.9);
    weightedSum += r.review_score * weight;
    totalWeight += weight;
  }

  return weightedSum / totalWeight;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sentiment = searchParams.get("sentiment");
    const theme = searchParams.get("theme");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("booking_reviews")
      .select("*", { count: "exact" })
      .order("review_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (sentiment) {
      query = query.eq("sentiment", sentiment);
    }
    if (theme) {
      query = query.contains("themes", [theme]);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const sentimentCounts = { positive: 0, mixed: 0, negative: 0, neutral: 0 };
    const { data: allReviews } = await supabase
      .from("booking_reviews")
      .select("sentiment, review_score, review_date");

    let avgScore = 0;
    if (allReviews && allReviews.length > 0) {
      allReviews.forEach((r: { sentiment: string }) => {
        const s = (r.sentiment || "neutral") as keyof typeof sentimentCounts;
        if (s in sentimentCounts) sentimentCounts[s]++;
      });
      // Use Booking.com-style weighted 36-month score
      avgScore = calculateWeightedScore(allReviews);
    }

    return NextResponse.json({
      reviews: data || [],
      total: count || 0,
      stats: {
        avgScore: Math.round(avgScore * 10) / 10,
        total: allReviews?.length || 0,
        ...sentimentCounts,
      },
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
