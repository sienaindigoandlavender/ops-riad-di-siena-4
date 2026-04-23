"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import LoadingScreen from "@/components/LoadingScreen";

interface ReviewStats {
  totalReviews: number;
  overallAverage: number;
  distribution: Record<string, number>;
  issues: Array<{
    issue: string;
    count: number;
    recentCount: number;
    previousCount: number;
    trend: "up" | "down" | "flat";
    examples: string[];
    category: string;
  }>;
  highlights: Array<{
    highlight: string;
    count: number;
    recentCount: number;
    previousCount: number;
    trend: "up" | "down" | "flat";
    category: string;
  }>;
  monthlyRatings: Array<{
    month: string;
    avgScore: number;
    count: number;
    categories: Record<string, number>;
  }>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    keywords: Array<{ word: string; count: number; sentiment: "positive" | "negative" }>;
  };
  correlation: {
    coefficient: number;
    interpretation: string;
    data: Array<{ month: string; avgRating: number; occupancyNights: number }>;
  };
}

interface ChecklistItem {
  issue_id: string;
  issue_text: string;
  category: string;
  resolved: boolean;
  resolved_date: string;
}

export default function InsightsPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "issues" | "trends" | "correlation">("overview");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/insights/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadMessage({ type: "success", text: data.message });
        // Refresh the data
        setLoading(true);
        await fetchData();
      } else {
        setUploadMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch (error) {
      setUploadMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [reviewsRes, checklistRes] = await Promise.all([
        fetch("/api/insights/reviews"),
        fetch("/api/insights/checklist"),
      ]);

      const reviewsData = await reviewsRes.json();
      const checklistData = await checklistRes.json();

      setStats(reviewsData);
      setChecklist(checklistData.items || []);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleIssue(issue: { issue: string; category: string }, resolved: boolean) {
    const issueId = issue.issue.toLowerCase().replace(/[^a-z0-9]/g, "-");
    setUpdating(issueId);
    
    try {
      await fetch("/api/insights/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: issueId,
          issue_text: issue.issue,
          category: issue.category,
          resolved,
        }),
      });
      
      // Update local state
      setChecklist(prev => {
        const existing = prev.find(item => item.issue_id === issueId);
        if (existing) {
          return prev.map(item =>
            item.issue_id === issueId
              ? { ...item, resolved, resolved_date: resolved ? new Date().toISOString().split("T")[0] : "" }
              : item
          );
        } else {
          return [...prev, {
            issue_id: issueId,
            issue_text: issue.issue,
            category: issue.category,
            resolved,
            resolved_date: resolved ? new Date().toISOString().split("T")[0] : "",
          }];
        }
      });
    } catch (error) {
      console.error("Error updating checklist:", error);
    } finally {
      setUpdating(null);
    }
  }

  function isResolved(issueText: string): boolean {
    const issueId = issueText.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return checklist.find(item => item.issue_id === issueId)?.resolved || false;
  }

  function getResolvedDate(issueText: string): string {
    const issueId = issueText.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return checklist.find(item => item.issue_id === issueId)?.resolved_date || "";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <AppHeader />
        <LoadingScreen />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-brick">Failed to load review data</div>
      </div>
    );
  }

  // Get last 36 months for the chart
  const last36Months = stats.monthlyRatings.slice(-36);
  const maxNights = Math.max(...(stats.correlation?.data || []).map(d => d.occupancyNights), 1);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept=".csv"
        className="hidden"
      />

      {/* Header */}
      <header className="bg-cream border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-serif text-ink-primary">Review Insights</h1>
              <p className="text-[11px] font-light text-ink-tertiary tracking-[0.04em] mt-1 normal-case">Based on guest reviews from January 2025 onward</p>
            </div>
            <div className="flex items-center gap-6">
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 text-[12px] tracking-[0.02em] text-ink-secondary hover:text-ink-primary border border-border hover:border-border-strong rounded transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload CSV
                  </>
                )}
              </button>
              <div className="text-right">
                <p className="text-[32px] font-serif text-gold">{stats.overallAverage.toFixed(1)}</p>
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-secondary">{stats.totalReviews} reviews</p>
                {(() => {
                  // Projected score: if the last 12 months' average quality
                  // continues, where does the 36-month weighted score trend?
                  const last12 = stats.monthlyRatings.slice(-12);
                  const last12Count = last12.reduce((s, m) => s + m.count, 0);
                  const last12Avg = last12Count > 0
                    ? last12.reduce((s, m) => s + m.avgScore * m.count, 0) / last12Count
                    : 0;
                  if (last12Avg === 0 || last12Count < 10) return null;
                  const delta = last12Avg - stats.overallAverage;
                  // If we keep scoring the last-12-month average for the next
                  // 12 months, the weighted score decays toward that value
                  const projected = stats.overallAverage + delta * 0.65;
                  const arrow = projected > stats.overallAverage ? "↑" : projected < stats.overallAverage ? "↓" : "→";
                  const arrowColor = projected > stats.overallAverage + 0.05 ? "text-sage" : projected < stats.overallAverage - 0.05 ? "text-brick" : "text-ink-tertiary";
                  return (
                    <p className="text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mt-2 font-light">
                      Trending <span className={`${arrowColor} font-medium`}>{arrow} {projected.toFixed(1)}</span>
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
          {/* Upload message */}
          {uploadMessage && (
            <div className={`mt-3 text-[12px] ${uploadMessage.type === "success" ? "text-sage" : "text-brick"}`}>
              {uploadMessage.text}
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-cream border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "issues", label: "Issues Checklist" },
              { id: "trends", label: "3-Year Trends" },
              { id: "correlation", label: "Occupancy" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 text-[13px] tracking-[0.02em] border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-gold text-gold"
                    : "border-transparent text-ink-secondary hover:text-ink-body"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Score Distribution */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary mb-4">Score Distribution</h2>
              <div className="flex items-end gap-2 h-32">
                {(["below7", "7", "8", "9", "10"] as const).map((score) => {
                  const count = stats.distribution[score] || 0;
                  const percentage = (count / stats.totalReviews) * 100;
                  const label = score === "below7" ? "<7" : score;
                  const color =
                    score === "10" ? "bg-forest" :
                    score === "9" ? "bg-sage" :
                    score === "8" ? "bg-gold" :
                    score === "7" ? "bg-brick/70" :
                    "bg-brick";
                  return (
                    <div key={score} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-[11px] text-ink-secondary mb-1">{percentage.toFixed(0)}%</span>
                        <div
                          className={`w-full ${color} rounded-t transition-all`}
                          style={{ height: `${Math.max(4, percentage * 1.2)}px` }}
                        />
                      </div>
                      <span className="text-[13px] font-medium text-ink-body mt-2">{label}</span>
                      <span className="text-[11px] text-ink-tertiary">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Top Actionable Issues */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary">Top Actionable Issues</h2>
                <p className="text-[10px] font-light uppercase tracking-[0.08em] text-ink-tertiary">Last 12 months · vs previous year</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.issues.slice(0, 6).map((item) => {
                  const trendArrow = item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→";
                  const trendColor = item.trend === "up" ? "text-brick" : item.trend === "down" ? "text-sage" : "text-ink-tertiary";
                  const trendLabel = item.trend === "up" ? "Increasing" : item.trend === "down" ? "Improving" : "Stable";
                  const delta = item.recentCount - item.previousCount;
                  return (
                    <div key={item.issue} className="flex items-center justify-between p-4 border border-border-subtle bg-white">
                      <div className="min-w-0">
                        <p className="text-[10px] font-light uppercase tracking-[0.08em] text-ink-tertiary">{item.category}</p>
                        <p className="text-[14px] font-light text-ink-primary uppercase tracking-[0.02em] mt-1">{item.issue}</p>
                        <p className="text-[11px] text-ink-tertiary mt-1 font-light normal-case tracking-normal">
                          {item.recentCount} {item.recentCount === 1 ? "mention" : "mentions"} recently
                          {item.previousCount > 0 && `, ${item.previousCount} before`}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={`text-[24px] font-medium ${trendColor} leading-none`}>{trendArrow}</p>
                        <p className={`text-[9px] uppercase tracking-[0.08em] font-light mt-1 ${trendColor}`}>{trendLabel}</p>
                        {delta !== 0 && (
                          <p className="text-[10px] text-ink-tertiary mt-0.5 font-light">{delta > 0 ? "+" : ""}{delta}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {stats.issues.length === 0 && (
                <p className="text-ink-tertiary text-[13px] py-4 text-center font-light normal-case tracking-normal">No issues flagged</p>
              )}
            </section>

            {/* Top Highlights - what guests love */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary">Top Highlights</h2>
                <p className="text-[10px] font-light uppercase tracking-[0.08em] text-ink-tertiary">Last 12 months · what guests love most</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(stats.highlights || []).slice(0, 6).map((item) => {
                  const trendArrow = item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→";
                  const trendColor = item.trend === "up" ? "text-sage" : item.trend === "down" ? "text-brick" : "text-ink-tertiary";
                  const trendLabel = item.trend === "up" ? "Growing" : item.trend === "down" ? "Less mentioned" : "Stable";
                  const delta = item.recentCount - item.previousCount;
                  return (
                    <div key={item.highlight} className="flex items-center justify-between p-4 border border-border-subtle bg-white">
                      <div className="min-w-0">
                        <p className="text-[10px] font-light uppercase tracking-[0.08em] text-ink-tertiary">{item.category}</p>
                        <p className="text-[14px] font-light text-ink-primary uppercase tracking-[0.02em] mt-1">{item.highlight}</p>
                        <p className="text-[11px] text-ink-tertiary mt-1 font-light normal-case tracking-normal">
                          {item.recentCount} {item.recentCount === 1 ? "mention" : "mentions"} recently
                          {item.previousCount > 0 && `, ${item.previousCount} before`}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={`text-[24px] font-medium ${trendColor} leading-none`}>{trendArrow}</p>
                        <p className={`text-[9px] uppercase tracking-[0.08em] font-light mt-1 ${trendColor}`}>{trendLabel}</p>
                        {delta !== 0 && (
                          <p className="text-[10px] text-ink-tertiary mt-0.5 font-light">{delta > 0 ? "+" : ""}{delta}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {(!stats.highlights || stats.highlights.length === 0) && (
                <p className="text-ink-tertiary text-[13px] py-4 text-center font-light normal-case tracking-normal">No highlights yet</p>
              )}
            </section>

            {/* Sentiment Analysis */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary mb-4">Sentiment Analysis</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-sage/10 rounded-lg">
                  <p className="text-[28px] font-serif text-sage">{stats.sentiment.positive}</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-forest">Positive (9-10)</p>
                  <p className="text-[13px] text-sage mt-1">
                    {((stats.sentiment.positive / stats.totalReviews) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-gold/10 rounded-lg">
                  <p className="text-[28px] font-serif text-gold">{stats.sentiment.neutral}</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-gold">Neutral (7-8)</p>
                  <p className="text-[13px] text-gold mt-1">
                    {((stats.sentiment.neutral / stats.totalReviews) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-brick/10 rounded-lg">
                  <p className="text-[28px] font-serif text-brick">{stats.sentiment.negative}</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-brick">Negative (&lt;7)</p>
                  <p className="text-[13px] text-brick mt-1">
                    {((stats.sentiment.negative / stats.totalReviews) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              
              {/* Keywords */}
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mb-3">Frequent Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.sentiment.keywords.slice(0, 15).map(kw => (
                    <span
                      key={kw.word}
                      className={`px-3 py-1 rounded-full text-[12px] ${
                        kw.sentiment === "positive"
                          ? "bg-sage/20 text-forest"
                          : "bg-brick/15 text-brick"
                      }`}
                    >
                      {kw.word} ({kw.count})
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Top Issues Preview */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary">Top Issues to Address</h2>
                <button
                  onClick={() => setActiveTab("issues")}
                  className="text-[12px] text-gold hover:text-gold"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {stats.issues.slice(0, 5).map((issue, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium ${
                      isResolved(issue.issue) ? "bg-sage/20 text-forest" : "bg-gold/20 text-gold"
                    }`}>
                      {isResolved(issue.issue) ? "✓" : issue.count}
                    </span>
                    <span className={`flex-1 text-[14px] ${isResolved(issue.issue) ? "text-ink-tertiary line-through" : "text-ink-body"}`}>
                      {issue.issue}
                    </span>
                    <span className="text-[11px] text-ink-tertiary uppercase tracking-[0.05em]">{issue.category}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Issues Checklist Tab */}
        {activeTab === "issues" && (
          <div className="space-y-6">
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <p className="text-[13px] text-gold">
                <strong>Issues extracted from negative reviews.</strong> Check items when resolved. 
                The count shows how many reviews mentioned this issue.
              </p>
            </div>

            <div className="bg-cream rounded-lg border border-border-subtle divide-y divide-border-subtle">
              {stats.issues.map((issue, idx) => {
                const resolved = isResolved(issue.issue);
                const resolvedDate = getResolvedDate(issue.issue);
                const issueId = issue.issue.toLowerCase().replace(/[^a-z0-9]/g, "-");
                
                return (
                  <div key={idx} className={`p-4 ${resolved ? "bg-sage/10/50" : ""}`}>
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleIssue(issue, !resolved)}
                        disabled={updating === issueId}
                        className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          resolved
                            ? "bg-sage border-sage text-cream"
                            : "border-border hover:border-gold"
                        } ${updating === issueId ? "opacity-50" : ""}`}
                      >
                        {resolved && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`text-[15px] font-medium ${resolved ? "text-ink-tertiary line-through" : "text-ink-primary"}`}>
                            {issue.issue}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.05em] ${
                            resolved ? "bg-sage/20 text-forest" : "bg-linen text-ink-secondary"
                          }`}>
                            {issue.category}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gold/20 text-gold text-[10px]">
                            {issue.count} mentions
                          </span>
                        </div>
                        
                        {resolved && resolvedDate && (
                          <p className="text-[11px] text-sage mb-2">Resolved on {resolvedDate}</p>
                        )}
                        
                        {!resolved && issue.examples.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">Example feedback:</p>
                            {issue.examples.map((ex, i) => (
                              <p key={i} className="text-[12px] text-ink-secondary italic pl-3 border-l-2 border-border-subtle mb-1">
                                "{ex}..."
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3-Year Trends Tab */}
        {activeTab === "trends" && (
          <div className="space-y-6">
            {/* Category Trends */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary mb-4">Category Averages (Last 12 Months)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["staff", "cleanliness", "location", "facilities", "comfort", "value"].map(cat => {
                  const recent = last36Months.slice(-12);
                  const avg = recent.reduce((sum, m) => sum + (m.categories?.[cat] || 0), 0) / (recent.filter(m => m.categories?.[cat] && m.categories[cat] > 0).length || 1);
                  const color = avg >= 9.5 ? "text-sage" : avg >= 9 ? "text-sage" : avg >= 8.5 ? "text-gold" : "text-gold";
                  
                  return (
                    <div key={cat} className="p-4 bg-parchment rounded-lg">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-secondary mb-1 capitalize">{cat}</p>
                      <p className={`text-[24px] font-serif ${color}`}>
                        {isNaN(avg) ? "-" : avg.toFixed(1)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Year-over-Year Comparison */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary mb-4">Year-over-Year Comparison</h2>
              <div className="grid grid-cols-2 gap-4">
                {[2025, 2026].map(year => {
                  const yearMonths = stats.monthlyRatings.filter(m => m.month.startsWith(year.toString()));
                  // Weight each month's avgScore by its review count so the
                  // year average reflects actual reviews, not monthly averages
                  const count = yearMonths.reduce((sum, m) => sum + m.count, 0);
                  const weightedTotal = yearMonths.reduce((sum, m) => sum + m.avgScore * m.count, 0);
                  const avg = count > 0 ? weightedTotal / count : 0;
                  
                  return (
                    <div key={year} className="text-center p-4 bg-parchment rounded-lg">
                      <p className="text-[13px] text-ink-secondary mb-2">{year}</p>
                      <p className="text-[32px] font-serif text-ink-primary">{avg > 0 ? avg.toFixed(1) : "-"}</p>
                      <p className="text-[11px] text-ink-tertiary">{count} reviews</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Occupancy Tab */}
        {activeTab === "correlation" && (
          <div className="space-y-6">
            {/* 3-Year Occupancy Chart */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary">Monthly Occupancy Rate</h2>
                <p className="text-[10px] font-light text-ink-tertiary normal-case">6 rooms · max ~180 room-nights/month</p>
              </div>
              <div className="h-64 flex items-end gap-[2px]">
                {(() => {
                  const TOTAL_ROOMS = 6;
                  const data = (stats.correlation?.data || []).slice(-36);
                  return data.map((point, idx) => {
                    const daysInMonth = new Date(
                      parseInt(point.month.split("-")[0]),
                      parseInt(point.month.split("-")[1]),
                      0
                    ).getDate();
                    const maxNightsInMonth = TOTAL_ROOMS * daysInMonth;
                    const rate = Math.min(100, Math.round((point.occupancyNights / maxNightsInMonth) * 100));
                    const isHighSeason = rate >= 70;
                    const isLowSeason = rate < 40;
                    const color = isHighSeason ? "bg-sage" : isLowSeason ? "bg-gold/80" : "bg-ink-tertiary/40";
                    const isJan = point.month.endsWith("-01");

                    return (
                      <div key={point.month} className="flex-1 flex flex-col items-center group relative">
                        <div
                          className={`w-full ${color} rounded-t transition-all hover:brightness-90`}
                          style={{ height: `${Math.max(2, rate * 2.4)}px` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-ink-primary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                          {point.month}: {rate}% ({point.occupancyNights} nights)
                        </div>
                        {/* Year labels */}
                        {isJan && (
                          <span className="text-[9px] text-ink-tertiary mt-1">
                            {point.month.substring(0, 4)}
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex items-center gap-4 mt-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-sage"></div>
                  <span className="text-ink-tertiary">High season (≥70%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-ink-tertiary/40"></div>
                  <span className="text-ink-tertiary">Mid season</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold/80"></div>
                  <span className="text-ink-tertiary">Low season (&lt;40%)</span>
                </div>
              </div>
            </section>

            {/* Year-over-Year Occupancy Comparison */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary mb-4">Year-over-Year Occupancy</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(() => {
                  const TOTAL_ROOMS = 6;
                  const data = stats.correlation?.data || [];
                  const years: Record<string, { nights: number; months: number }> = {};
                  data.forEach((p) => {
                    const yr = p.month.substring(0, 4);
                    if (!years[yr]) years[yr] = { nights: 0, months: 0 };
                    years[yr].nights += p.occupancyNights;
                    years[yr].months += 1;
                  });
                  return Object.entries(years).sort().map(([year, d]) => {
                    const avgMonthlyCapacity = TOTAL_ROOMS * 30;
                    const avgRate = d.months > 0 ? Math.round((d.nights / (d.months * avgMonthlyCapacity)) * 100) : 0;
                    return (
                      <div key={year} className="text-center p-4 bg-parchment rounded-lg">
                        <p className="text-[13px] text-ink-secondary mb-2">{year}</p>
                        <p className="text-[32px] font-serif text-ink-primary">{avgRate}%</p>
                        <p className="text-[11px] text-ink-tertiary">{d.nights.toLocaleString()} nights · {d.months} months</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            {/* Monthly Data Table */}
            <section className="bg-cream rounded-lg border border-border-subtle p-6">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-secondary mb-4">Last 12 Months</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-2 px-3 text-[11px] uppercase tracking-[0.05em] text-ink-secondary">Month</th>
                      <th className="text-right py-2 px-3 text-[11px] uppercase tracking-[0.05em] text-ink-secondary">Nights</th>
                      <th className="text-right py-2 px-3 text-[11px] uppercase tracking-[0.05em] text-ink-secondary">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.correlation?.data || []).slice(-12).reverse().map((row, idx) => {
                      const daysInMonth = new Date(
                        parseInt(row.month.split("-")[0]),
                        parseInt(row.month.split("-")[1]),
                        0
                      ).getDate();
                      const rate = Math.min(100, Math.round((row.occupancyNights / (6 * daysInMonth)) * 100));
                      return (
                        <tr key={idx} className="border-b border-border-subtle hover:bg-parchment">
                          <td className="py-2 px-3 text-ink-body">{row.month}</td>
                          <td className="py-2 px-3 text-right text-ink-body">{row.occupancyNights}</td>
                          <td className="py-2 px-3 text-right text-ink-body">{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
}
