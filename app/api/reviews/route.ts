import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
      .select("sentiment, review_score");

    let avgScore = 0;
    let scoredCount = 0;
    if (allReviews && allReviews.length > 0) {
      allReviews.forEach((r: { sentiment: string; review_score: number }) => {
        const s = (r.sentiment || "neutral") as keyof typeof sentimentCounts;
        if (s in sentimentCounts) sentimentCounts[s]++;
        if (r.review_score && r.review_score > 0) {
          avgScore += r.review_score;
          scoredCount++;
        }
      });
      if (scoredCount > 0) avgScore = avgScore / scoredCount;
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
