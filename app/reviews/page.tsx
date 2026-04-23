"use client";

import { useState, useEffect } from "react";
import PasswordGate from "@/components/PasswordGate";
import AppHeader from "@/components/AppHeader";

interface Review {
  id: number;
  review_date: string;
  guest_name: string;
  reservation_number: string;
  review_title: string;
  positive_review: string;
  negative_review: string;
  review_score: number;
  staff: number | null;
  cleanliness: number | null;
  location: number | null;
  facilities: number | null;
  comfort: number | null;
  value_for_money: number | null;
  property_reply: string;
  sentiment: string;
  themes: string[];
  expectation_mismatch: boolean;
}

interface Stats {
  avgScore: number;
  total: number;
  positive: number;
  mixed: number;
  negative: number;
  neutral: number;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles: Record<string, string> = {
    positive: "bg-sage/15 text-forest",
    mixed: "bg-gold/15 text-gold",
    negative: "bg-brick/15 text-brick",
    neutral: "bg-linen text-ink-tertiary",
  };
  return (
    <span className={`text-[9px] font-light px-2 py-0.5 tracking-[0.08em] ${styles[sentiment] || styles.neutral}`}>
      {sentiment.toUpperCase()}
    </span>
  );
}

function ThemeTag({ theme }: { theme: string }) {
  const label = theme.replace(/_/g, " ");
  return (
    <span className="text-[9px] font-light px-1.5 py-0.5 border border-border-subtle text-ink-tertiary tracking-[0.04em] normal-case">
      {label}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("sentiment", filter);
      params.set("limit", "200");
      const res = await fetch(`/api/reviews?${params}`);
      const json = await res.json();
      if (!json.error) {
        setReviews(json.reviews || []);
        setStats(json.stats || null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/reviews/import", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await fetchReviews();
      }
    } catch {
      // silent
    } finally {
      setImporting(false);
    }
  };

  return (
    <PasswordGate>
      <div className="min-h-screen bg-white">
        <AppHeader />

        {/* Sub-header */}
        <div className="border-b border-border-subtle px-6 py-3 flex items-center justify-between">
          <h2 className="text-[12px] font-light text-ink-secondary uppercase tracking-[0.08em]">Reviews</h2>
          <button
            onClick={handleImport}
            disabled={importing}
            className="text-[11px] px-4 h-[34px] border border-border text-ink-secondary hover:text-ink-primary hover:border-ink-tertiary active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import from CSV"}
          </button>
        </div>

        {/* Stats strip */}
        {stats && stats.total > 0 && (
          <div className="flex items-center border-b border-border-subtle divide-x divide-border-subtle">
            <div className="flex-1 py-3 px-4 text-center">
              <p className="text-[9px] font-light uppercase tracking-[0.1em] text-ink-tertiary">Avg Score</p>
              <p className="text-[18px] font-medium text-ink-primary">{stats.avgScore}</p>
            </div>
            <div className="flex-1 py-3 px-4 text-center">
              <p className="text-[9px] font-light uppercase tracking-[0.1em] text-ink-tertiary">Total</p>
              <p className="text-[18px] font-medium text-ink-primary">{stats.total}</p>
            </div>
            <div className="flex-1 py-3 px-4 text-center">
              <p className="text-[9px] font-light uppercase tracking-[0.1em] text-sage">Positive</p>
              <p className="text-[18px] font-medium text-sage">{stats.positive}</p>
            </div>
            <div className="flex-1 py-3 px-4 text-center">
              <p className="text-[9px] font-light uppercase tracking-[0.1em] text-gold">Mixed</p>
              <p className="text-[18px] font-medium text-gold">{stats.mixed}</p>
            </div>
            <div className="flex-1 py-3 px-4 text-center">
              <p className="text-[9px] font-light uppercase tracking-[0.1em] text-brick">Negative</p>
              <p className="text-[18px] font-medium text-brick">{stats.negative}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border-subtle flex items-center gap-2">
          {["", "positive", "mixed", "negative"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[10px] px-3 py-1.5 transition-all duration-150 ${
                filter === s
                  ? "bg-ink-primary text-white"
                  : "border border-border text-ink-tertiary hover:text-ink-primary hover:border-ink-tertiary"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        <div className="px-6 py-4">
          {loading ? (
            <p className="text-ink-tertiary text-[13px] py-8 text-center font-light normal-case tracking-normal">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink-tertiary text-[13px] font-light normal-case tracking-normal">No reviews found.</p>
              <p className="text-ink-tertiary text-[11px] mt-2 font-light normal-case tracking-normal">Click &ldquo;Import from CSV&rdquo; to load reviews from data/reviews.csv</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border-subtle">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="py-4 cursor-pointer hover:bg-parchment transition-colors -mx-6 px-6"
                  onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                >
                  {/* Row header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-light text-[14px] text-ink-primary uppercase tracking-[0.04em]">{review.guest_name}</p>
                        <SentimentBadge sentiment={review.sentiment} />
                        {review.expectation_mismatch && (
                          <span className="text-[9px] font-light px-1.5 py-0.5 bg-dusty/15 text-dusty tracking-[0.04em]">MISMATCH</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-ink-tertiary font-light normal-case tracking-normal">
                          {review.review_date?.split(" ")[0]}
                        </span>
                        <div className="flex items-center gap-1">
                          {(review.themes || []).slice(0, 3).map((theme) => (
                            <ThemeTag key={theme} theme={theme} />
                          ))}
                          {(review.themes || []).length > 3 && (
                            <span className="text-[9px] text-ink-tertiary">+{review.themes.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[20px] font-medium text-ink-primary leading-none">{review.review_score}</p>
                      <p className="text-[9px] font-light uppercase tracking-[0.1em] text-ink-tertiary mt-0.5">Score</p>
                    </div>
                  </div>

                  {/* Preview text */}
                  {!expandedId || expandedId !== review.id ? (
                    <p className="text-[12px] text-ink-tertiary mt-2 line-clamp-1 font-light normal-case tracking-normal">
                      {review.positive_review || review.negative_review || "No review text"}
                    </p>
                  ) : null}

                  {/* Expanded view */}
                  {expandedId === review.id && (
                    <div className="mt-4 space-y-4 fade-rise">
                      {/* Sub-scores */}
                      <div className="flex gap-4 flex-wrap">
                        {[
                          { label: "Staff", val: review.staff },
                          { label: "Clean", val: review.cleanliness },
                          { label: "Location", val: review.location },
                          { label: "Facilities", val: review.facilities },
                          { label: "Comfort", val: review.comfort },
                          { label: "Value", val: review.value_for_money },
                        ].map(({ label, val }) => val !== null && (
                          <div key={label} className="text-center">
                            <p className="text-[9px] font-light uppercase tracking-[0.08em] text-ink-tertiary">{label}</p>
                            <p className="text-[14px] font-medium text-ink-primary">{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* All themes */}
                      {review.themes && review.themes.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {review.themes.map((theme) => (
                            <ThemeTag key={theme} theme={theme} />
                          ))}
                        </div>
                      )}

                      {/* Positive text */}
                      {review.positive_review && (
                        <div>
                          <p className="text-[9px] font-light uppercase tracking-[0.1em] text-sage mb-1">Positive</p>
                          <p className="text-[13px] text-ink-body font-light normal-case tracking-normal leading-relaxed">{review.positive_review}</p>
                        </div>
                      )}

                      {/* Negative text */}
                      {review.negative_review && (
                        <div>
                          <p className="text-[9px] font-light uppercase tracking-[0.1em] text-brick mb-1">Negative</p>
                          <p className="text-[13px] text-ink-body font-light normal-case tracking-normal leading-relaxed">{review.negative_review}</p>
                        </div>
                      )}

                      {/* Property reply */}
                      {review.property_reply && (
                        <div className="border-l-2 border-border-subtle pl-4">
                          <p className="text-[9px] font-light uppercase tracking-[0.1em] text-ink-tertiary mb-1">Our Reply</p>
                          <p className="text-[12px] text-ink-tertiary font-light normal-case tracking-normal leading-relaxed">{review.property_reply}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PasswordGate>
  );
}
