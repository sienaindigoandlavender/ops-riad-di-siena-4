import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/supabase";
import fs from "fs";
import path from "path";

// Parse CSV with proper handling of quoted fields and newlines
function parseCSV(content: string): any[] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === "\n" && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length === 0) return [];
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  
  // Parse rows
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= header.length) {
      const row: any = {};
      header.forEach((key, idx) => {
        row[key.trim().replace(/"/g, "")] = values[idx]?.replace(/"/g, "").trim() || "";
      });
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

// Extract issues from negative reviews, with recent-vs-previous trend
function extractIssues(reviews: any[]): { issue: string; count: number; recentCount: number; previousCount: number; trend: "up" | "down" | "flat"; examples: string[]; category: string }[] {
  const issuePatterns: { pattern: RegExp; category: string; issue: string }[] = [
    { pattern: /cold|fre[díi]o|freddo|heating|heater|climatiza/i, category: "Temperature", issue: "Heating / room too cold" },
    { pattern: /hot|calor|caldo|air condition|ac |a\/c/i, category: "Temperature", issue: "Cooling / AC issues" },
    { pattern: /humid|moisture|damp|mold|mould|mildew|moisi|muffa/i, category: "Humidity", issue: "Humidity / dampness" },
    { pattern: /plumb|leak|drain|water pressure|water didn|pipe|tuyau|fuite|tubatura/i, category: "Plumbing", issue: "Plumbing / water issues" },
    { pattern: /noise|noisy|ruido|bruit|rumore|loud|music|prayer|azan|muezzin|dog|bark|rooster|cockerel|neighbor|neighbour|voisin|vicin|wall.*thin|thin.*wall|sound|ear.?plug|sleep.*disturb|disturb.*sleep|wake.*up|woke.*up|couldn.t sleep/i, category: "Noise", issue: "Noise complaints" },
    { pattern: /smell|odor|olor|odeur|stink/i, category: "Cleanliness", issue: "Odor / smell" },
    { pattern: /light|luz|luce|lamp|lighting|dark/i, category: "Facilities", issue: "Lighting" },
    { pattern: /bathroom|baño|bagno|shower|douche|toilet/i, category: "Bathroom", issue: "Bathroom" },
    { pattern: /window|ventana|finestra|ventilation|ventilación|air flow/i, category: "Room", issue: "Ventilation / windows" },
    { pattern: /wifi|internet|connection|connexion/i, category: "Facilities", issue: "WiFi / internet" },
    { pattern: /direction|map|find|encontrar|trouver|lost|perdu|hard to find/i, category: "Access", issue: "Wayfinding" },
    { pattern: /staff|personal|personnel|unfriendly|rude/i, category: "Service", issue: "Staff feedback" },
    { pattern: /breakfast|desayuno|petit.déjeuner|colazione/i, category: "Food", issue: "Breakfast" },
    { pattern: /tax|city.tax|tourist.tax/i, category: "Pricing", issue: "City tax surprise" },
    { pattern: /clean|limpi|propre|pulito|dirt|dust/i, category: "Cleanliness", issue: "Cleanliness" },
    { pattern: /bed|cama|lit|letto|mattress|pillow/i, category: "Comfort", issue: "Bed / mattress" },
  ];

  // 12-month rolling window
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const twentyFourMonthsAgo = new Date(now);
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

  const issueMap: Map<string, { count: number; recentCount: number; previousCount: number; examples: string[]; category: string }> = new Map();

  reviews.forEach(review => {
    const negativeText = review["Negative review"] || "";
    if (!negativeText || negativeText.toLowerCase() === "nada" || negativeText.toLowerCase() === "nothing" || negativeText.toLowerCase() === "niente" || negativeText.toLowerCase() === "rien") {
      return;
    }

    const reviewDate = review["Review date"] ? new Date(review["Review date"]) : null;
    const isRecent = reviewDate && reviewDate >= twelveMonthsAgo;
    const isPrevious = reviewDate && reviewDate >= twentyFourMonthsAgo && reviewDate < twelveMonthsAgo;

    issuePatterns.forEach(({ pattern, category, issue }) => {
      if (pattern.test(negativeText)) {
        const existing = issueMap.get(issue) || { count: 0, recentCount: 0, previousCount: 0, examples: [], category };
        existing.count++;
        if (isRecent) existing.recentCount++;
        if (isPrevious) existing.previousCount++;
        if (existing.examples.length < 3 && negativeText.length > 5) {
          existing.examples.push(negativeText.substring(0, 150));
        }
        issueMap.set(issue, existing);
      }
    });
  });

  return Array.from(issueMap.entries())
    .map(([issue, data]) => {
      // Trend: compare recent 12 months vs previous 12 months
      let trend: "up" | "down" | "flat" = "flat";
      const delta = data.recentCount - data.previousCount;
      if (delta >= 2) trend = "up";
      else if (delta <= -2) trend = "down";
      return { issue, ...data, trend };
    })
    .sort((a, b) => b.recentCount - a.recentCount);
}

// Calculate monthly ratings
function calculateMonthlyRatings(reviews: any[]): { month: string; avgScore: number; count: number; categories: Record<string, number> }[] {
  const monthlyData: Map<string, { scores: number[]; staff: number[]; cleanliness: number[]; location: number[]; facilities: number[]; comfort: number[]; value: number[] }> = new Map();
  
  reviews.forEach(review => {
    const dateStr = review["Review date"];
    if (!dateStr) return;
    
    const date = new Date(dateStr);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    const score = parseFloat(review["Review score"]);
    if (isNaN(score)) return;
    
    const existing = monthlyData.get(monthKey) || { scores: [], staff: [], cleanliness: [], location: [], facilities: [], comfort: [], value: [] };
    existing.scores.push(score);
    
    const staff = parseFloat(review["Staff"]);
    const cleanliness = parseFloat(review["Cleanliness"]);
    const location = parseFloat(review["Location"]);
    const facilities = parseFloat(review["Facilities"]);
    const comfort = parseFloat(review["Comfort"]);
    const value = parseFloat(review["Value for money"]);
    
    if (!isNaN(staff) && staff > 0) existing.staff.push(staff);
    if (!isNaN(cleanliness) && cleanliness > 0) existing.cleanliness.push(cleanliness);
    if (!isNaN(location) && location > 0) existing.location.push(location);
    if (!isNaN(facilities) && facilities > 0) existing.facilities.push(facilities);
    if (!isNaN(comfort) && comfort > 0) existing.comfort.push(comfort);
    if (!isNaN(value) && value > 0) existing.value.push(value);
    
    monthlyData.set(monthKey, existing);
  });
  
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      avgScore: avg(data.scores),
      count: data.scores.length,
      categories: {
        staff: avg(data.staff),
        cleanliness: avg(data.cleanliness),
        location: avg(data.location),
        facilities: avg(data.facilities),
        comfort: avg(data.comfort),
        value: avg(data.value),
      }
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Simple sentiment analysis
function analyzeSentiment(reviews: any[]): { positive: number; neutral: number; negative: number; keywords: { word: string; count: number; sentiment: "positive" | "negative" }[] } {
  const positiveWords = ["excellent", "amazing", "perfect", "wonderful", "fantastic", "great", "best", "love", "beautiful", "delicious", "friendly", "helpful", "clean", "comfortable", "recommend", "parfait", "perfecto", "ottimo", "bellissimo", "excelente", "magnifique", "super", "top", "bravo"];
  const negativeWords = ["bad", "terrible", "awful", "dirty", "cold", "noise", "smell", "problem", "issue", "disappointing", "worst", "horrible", "poor", "malo", "mauvais", "brutto", "freddo", "rumore"];
  
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  
  const wordCounts: Map<string, { count: number; sentiment: "positive" | "negative" }> = new Map();
  
  reviews.forEach(review => {
    const score = parseFloat(review["Review score"]);
    if (score >= 9) positive++;
    else if (score >= 7) neutral++;
    else negative++;
    
    const text = `${review["Positive review"] || ""} ${review["Negative review"] || ""}`.toLowerCase();
    
    positiveWords.forEach(word => {
      if (text.includes(word)) {
        const existing = wordCounts.get(word) || { count: 0, sentiment: "positive" as const };
        existing.count++;
        wordCounts.set(word, existing);
      }
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) {
        const existing = wordCounts.get(word) || { count: 0, sentiment: "negative" as const };
        existing.count++;
        wordCounts.set(word, existing);
      }
    });
  });
  
  const keywords = Array.from(wordCounts.entries())
    .map(([word, data]) => ({ word, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  return { positive, neutral, negative, keywords };
}

// Get occupancy data from master_guests (Supabase)
async function getOccupancyData(): Promise<Map<string, { bookings: number; nights: number }>> {
  const guests = await getAllGuests();
  
  const monthlyData: Map<string, { bookings: number; nights: number }> = new Map();
  
  for (const guest of guests) {
    if (!guest.check_in || guest.status === "cancelled" || guest.source === "Blocked" || guest.source === "Blackout") continue;
    
    const date = new Date(guest.check_in);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    let nights = guest.nights || 1;
    if (!guest.nights && guest.check_out) {
      const checkoutDate = new Date(guest.check_out);
      nights = Math.max(1, Math.round((checkoutDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
    }
    
    const existing = monthlyData.get(monthKey) || { bookings: 0, nights: 0 };
    existing.bookings++;
    existing.nights += nights;
    monthlyData.set(monthKey, existing);
  }
  
  return monthlyData;
}

export async function GET() {
  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), "data", "reviews.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const reviews = parseCSV(csvContent);
    
    // Filter reviews to Jan 2025 onward only
    const cutoffDate = new Date("2025-01-01");
    const filteredReviews = reviews.filter(r => {
      const dateStr = r["Review date"];
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d >= cutoffDate;
    });

    // Issues use ALL reviews for accurate trend comparison
    // (recent 12mo vs previous 12mo, regardless of display cutoff)
    const issues = extractIssues(reviews);

    // Everything else uses filtered reviews (Jan 2025+)
    const monthlyRatings = calculateMonthlyRatings(filteredReviews);
    const sentiment = analyzeSentiment(filteredReviews);
    const occupancy = await getOccupancyData();
    
    // Calculate correlation between ratings and occupancy
    const correlationData: { month: string; avgRating: number; occupancyNights: number }[] = [];
    monthlyRatings.forEach(({ month, avgScore }) => {
      const occ = occupancy.get(month);
      if (occ) {
        correlationData.push({
          month,
          avgRating: avgScore,
          occupancyNights: occ.nights,
        });
      }
    });
    
    // Calculate Pearson correlation coefficient
    let correlation = 0;
    if (correlationData.length > 2) {
      const n = correlationData.length;
      const sumX = correlationData.reduce((a, b) => a + b.avgRating, 0);
      const sumY = correlationData.reduce((a, b) => a + b.occupancyNights, 0);
      const sumXY = correlationData.reduce((a, b) => a + b.avgRating * b.occupancyNights, 0);
      const sumX2 = correlationData.reduce((a, b) => a + b.avgRating * b.avgRating, 0);
      const sumY2 = correlationData.reduce((a, b) => a + b.occupancyNights * b.occupancyNights, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      correlation = denominator !== 0 ? numerator / denominator : 0;
    }
    
    // Overall stats — weighted by recency (Booking.com model)
    const now = new Date();
    const reviewsWithScores = filteredReviews
      .map(r => ({ score: parseFloat(r["Review score"]), date: r["Review date"] }))
      .filter(r => !isNaN(r.score) && r.score > 0 && r.date);

    let overallAvg = 0;
    if (reviewsWithScores.length > 0) {
      let totalWeight = 0;
      let weightedSum = 0;
      for (const r of reviewsWithScores) {
        const d = new Date(r.date);
        const ageInMonths = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30);
        const weight = Math.max(0.1, 1 - (ageInMonths / 36) * 0.9);
        weightedSum += r.score * weight;
        totalWeight += weight;
      }
      overallAvg = weightedSum / totalWeight;
    }

    // Score distribution (filtered reviews only)
    const allScores = reviewsWithScores.map(r => r.score);
    const distribution = { "10": 0, "9": 0, "8": 0, "7": 0, "below7": 0 };
    allScores.forEach(score => {
      if (score === 10) distribution["10"]++;
      else if (score === 9) distribution["9"]++;
      else if (score === 8) distribution["8"]++;
      else if (score === 7) distribution["7"]++;
      else distribution["below7"]++;
    });
    
    return NextResponse.json({
      totalReviews: filteredReviews.length,
      overallAverage: overallAvg,
      distribution,
      issues,
      monthlyRatings,
      sentiment,
      correlation: {
        coefficient: correlation,
        interpretation: Math.abs(correlation) < 0.3 ? "weak" : Math.abs(correlation) < 0.7 ? "moderate" : "strong",
        data: correlationData,
      },
    });
  } catch (error) {
    console.error("Error analyzing reviews:", error);
    return NextResponse.json({ error: "Failed to analyze reviews" }, { status: 500 });
  }
}
