"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Booking {
  Booking_ID: string;
  property?: string;
  room?: string;
  tent?: string;
  experience?: string;
  firstName: string;
  lastName: string;
  email: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  total: number;
  paypalStatus?: string;
  Timestamp?: string;
}

interface DashboardStats {
  newBookings: number;
  confirmed: number;
  totalBookings: number;
  totalRevenue: number;
}

interface TaxStats {
  date: string;
  month: string;
  daily: {
    total: number;
    paid: number;
    unpaid: number;
    bookings: Array<{
      booking_id: string;
      guest_name: string;
      tax_amount: number;
      paid: boolean;
      paid_at: string;
    }>;
  };
  monthly: {
    total: number;
    paid: number;
    unpaid: number;
    bookingCount: number;
  };
}

interface RevenueStats {
  month: string;
  monthLabel: string;
  totals: {
    gross: number;
    commission: number;
    net: number;
    airbnbNet: number;
    kathleenShare: number;
    jacquelineNet: number;
    bookingCount: number;
  };
  bySource: Array<{
    source: string;
    gross: number;
    commission: number;
    net: number;
    count: number;
    commissionRate: number;
  }>;
  history: Array<{
    month: string;
    label: string;
    gross: number;
    commission: number;
    net: number;
    bookingCount: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    newBookings: 0,
    confirmed: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [taxStats, setTaxStats] = useState<TaxStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch bookings
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((data) => {
        const bookings = data.bookings || [];
        const confirmed = bookings.filter((b: Booking) => b.paypalStatus === "COMPLETED");
        const revenue = confirmed.reduce((sum: number, b: Booking) => sum + (b.total || 0), 0);
        
        setStats({
          newBookings: bookings.filter((b: Booking) => !b.paypalStatus || b.paypalStatus === "PENDING").length,
          confirmed: confirmed.length,
          totalBookings: bookings.length,
          totalRevenue: revenue,
        });
        setRecentBookings(bookings.slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch tax stats
    fetch("/api/tax/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setTaxStats(data);
        }
      })
      .catch(() => {});

    // Fetch revenue stats
    fetch("/api/revenue/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setRevenueStats(data);
        }
      })
      .catch(() => {});
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getPropertyName = (booking: Booking): string => {
    if (booking.property) return booking.property;
    if (booking.room) return "The Riad";
    return "Unknown";
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-border-subtle py-5 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">Riad di Siena</p>
            <h1 className="font-serif text-[22px] text-ink-primary">Admin Dashboard</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/team" className="text-[13px] text-ink-secondary hover:text-ink-primary transition-colors">
              Team
            </Link>
            <Link href="/expenses" className="text-[13px] text-ink-secondary hover:text-ink-primary transition-colors">
              Expenses
            </Link>
            <Link href="/petty-cash" className="text-[13px] text-ink-secondary hover:text-ink-primary transition-colors">
              Petty Cash
            </Link>
            <a
              href="https://riaddisiena.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-ink-secondary hover:text-ink-primary transition-colors"
            >
              View Site →
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-4xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-border-subtle border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-6 mb-12">
              <div className="text-center bg-cream rounded-lg border border-border-subtle p-5">
                <p className="text-[28px] font-serif text-ink-primary">{stats.newBookings}</p>
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Pending</p>
              </div>
              <div className="text-center bg-cream rounded-lg border border-border-subtle p-5">
                <p className="text-[28px] font-serif text-ink-primary">{stats.confirmed}</p>
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Confirmed</p>
              </div>
              <div className="text-center bg-cream rounded-lg border border-border-subtle p-5">
                <p className="text-[28px] font-serif text-ink-primary">{stats.totalBookings}</p>
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Total</p>
              </div>
              <div className="text-center bg-cream rounded-lg border border-border-subtle p-5">
                <p className="text-[28px] font-serif text-ink-primary">€{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Revenue</p>
              </div>
            </div>

            {/* City Tax Stats */}
            {taxStats && (
              <div className="mb-12 p-6 bg-gold/10 rounded-lg border border-gold/30">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="font-serif text-[18px] text-gold">City Tax (Booking.com)</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Today */}
                  <div className="bg-cream rounded-lg p-4 border border-gold/20">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-gold mb-2">Today</p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-[32px] font-serif text-gold">€{taxStats.daily.total.toFixed(0)}</p>
                      {taxStats.daily.bookings.length > 0 && (
                        <p className="text-[13px] text-gold">
                          {taxStats.daily.bookings.length} guest{taxStats.daily.bookings.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-[12px]">
                      <span className="text-sage">€{taxStats.daily.paid.toFixed(0)} paid</span>
                      {taxStats.daily.unpaid > 0 && (
                        <span className="text-gold">€{taxStats.daily.unpaid.toFixed(0)} pending</span>
                      )}
                    </div>
                  </div>
                  {/* This Month */}
                  <div className="bg-cream rounded-lg p-4 border border-gold/20">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-gold mb-2">
                      {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-[32px] font-serif text-gold">€{taxStats.monthly.total.toFixed(0)}</p>
                      {taxStats.monthly.bookingCount > 0 && (
                        <p className="text-[13px] text-gold">
                          {taxStats.monthly.bookingCount} booking{taxStats.monthly.bookingCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-[12px]">
                      <span className="text-sage">€{taxStats.monthly.paid.toFixed(0)} paid</span>
                      {taxStats.monthly.unpaid > 0 && (
                        <span className="text-gold">€{taxStats.monthly.unpaid.toFixed(0)} pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Revenue */}
            {revenueStats && (
              <div className="mb-12 p-6 bg-sage/10 rounded-lg border border-sage/30">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 className="font-serif text-[18px] text-forest">Revenue — {revenueStats.monthLabel}</h2>
                </div>
                
                {/* Totals Row */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-cream rounded-lg p-4 border border-sage/20">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-sage mb-1">Gross Revenue</p>
                    <p className="text-[24px] font-serif text-forest">€{revenueStats.totals.gross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[11px] text-sage mt-1">{revenueStats.totals.bookingCount} bookings</p>
                  </div>
                  <div className="bg-cream rounded-lg p-4 border border-brick/15">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-brick mb-1">Platform Fees</p>
                    <p className="text-[24px] font-serif text-brick">−€{revenueStats.totals.commission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[11px] text-brick mt-1">Airbnb + Booking.com</p>
                  </div>
                  <div className="bg-cream rounded-lg p-4 border border-rose/20">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-rose mb-1">Kathleen (40% Airbnb)</p>
                    <p className="text-[24px] font-serif text-rose">−€{revenueStats.totals.kathleenShare.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[11px] text-rose mt-1">
                      {revenueStats.totals.airbnbNet > 0 ? `from €${revenueStats.totals.airbnbNet.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Airbnb net` : "no Airbnb bookings"}
                    </p>
                  </div>
                  <div className="bg-sage/20 rounded-lg p-4 border border-sage/30">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-forest mb-1">Your Net</p>
                    <p className="text-[24px] font-serif text-forest">€{revenueStats.totals.jacquelineNet.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[11px] text-forest mt-1">after all deductions</p>
                  </div>
                </div>

                {/* By Source Breakdown */}
                <div className="bg-cream rounded-lg border border-sage/20 overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-sage/20 bg-sage/10/50">
                        <th className="text-left py-2 px-4 font-medium text-forest">Source</th>
                        <th className="text-right py-2 px-4 font-medium text-forest">Bookings</th>
                        <th className="text-right py-2 px-4 font-medium text-forest">Gross</th>
                        <th className="text-right py-2 px-4 font-medium text-forest">Commission</th>
                        <th className="text-right py-2 px-4 font-medium text-forest">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueStats.bySource.map((source) => (
                        <tr key={source.source} className="border-b border-sage/10 last:border-0">
                          <td className="py-2 px-4 text-ink-primary">
                            {source.source}
                            {source.commissionRate > 0 && (
                              <span className="text-[11px] text-ink-tertiary ml-1">({source.commissionRate}%)</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right text-ink-secondary">{source.count}</td>
                          <td className="py-2 px-4 text-right text-ink-primary">€{source.gross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                          <td className="py-2 px-4 text-right text-brick">
                            {source.commission > 0 ? `−€${source.commission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"}
                          </td>
                          <td className="py-2 px-4 text-right font-medium text-forest">€{source.net.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 6-Month History */}
                {revenueStats.history.length > 1 && (
                  <div className="mt-6">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-sage mb-3">Last 6 Months</p>
                    <div className="grid grid-cols-6 gap-2">
                      {revenueStats.history.map((month, i) => (
                        <div 
                          key={month.month} 
                          className={`text-center p-3 rounded-lg ${i === 0 ? 'bg-sage/20 border border-sage/30' : 'bg-cream border border-sage/20'}`}
                        >
                          <p className="text-[10px] uppercase tracking-[0.05em] text-sage mb-1">{month.label}</p>
                          <p className={`text-[16px] font-serif ${i === 0 ? 'text-forest' : 'text-ink-body'}`}>
                            €{(month.net / 1000).toFixed(1)}k
                          </p>
                          <p className="text-[10px] text-sage">{month.bookingCount} bookings</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Primary Tools */}
            <div className="space-y-3 mb-14">
              <Link
                href="/admin/calendar"
                className="block p-6 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors"
              >
                <h2 className="font-serif text-[18px] text-ink-primary mb-1">Calendar</h2>
                <p className="text-[13px] text-ink-secondary">
                  Visual overview of room availability across The Riad and The Douaria
                </p>
              </Link>
              <Link
                href="/admin/bookings"
                className="block p-6 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors"
              >
                <h2 className="font-serif text-[18px] text-ink-primary mb-1">All Bookings</h2>
                <p className="text-[13px] text-ink-secondary">
                  View and manage all reservations across properties
                </p>
              </Link>
              <Link
                href="/admin/reservations/new"
                className="block p-6 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors"
              >
                <h2 className="font-serif text-[18px] text-ink-primary mb-1">Add Reservation</h2>
                <p className="text-[13px] text-ink-secondary">
                  Manually add bookings from Booking.com, Airbnb, WhatsApp, etc.
                </p>
              </Link>
            </div>

            {/* Recent Bookings */}
            {recentBookings.length > 0 && (
              <div className="border-t border-border-subtle pt-10">
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-tertiary mb-5">Recent Bookings</p>
                <div className="space-y-2">
                  {recentBookings.map((booking) => (
                    <div 
                      key={booking.Booking_ID} 
                      className="flex items-center justify-between p-4 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors"
                    >
                      <div>
                        <p className="text-[15px] font-medium text-ink-primary">{booking.firstName} {booking.lastName}</p>
                        <p className="text-[13px] text-ink-secondary">
                          {getPropertyName(booking)} · {booking.room || booking.tent || booking.experience}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] text-ink-body">{formatDate(booking.checkIn || "")} → {formatDate(booking.checkOut || "")}</p>
                        <p className="text-[13px] text-ink-tertiary">€{booking.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link 
                  href="/admin/bookings" 
                  className="block text-center text-[13px] text-ink-tertiary hover:text-ink-primary mt-4"
                >
                  View all →
                </Link>
              </div>
            )}

            {/* Property Quick Links */}
            <div className="border-t border-border-subtle pt-10 mt-10">
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-tertiary mb-5">Filter by Property</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link
                  href="/admin/bookings?property=riad"
                  className="p-4 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors text-center"
                >
                  <p className="text-[13px] text-ink-primary">The Riad</p>
                </Link>
                <Link
                  href="/admin/bookings?property=douaria"
                  className="p-4 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors text-center"
                >
                  <p className="text-[13px] text-ink-primary">The Douaria</p>
                </Link>
                <Link
                  href="/admin/bookings?property=kasbah"
                  className="p-4 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors text-center"
                >
                  <p className="text-[13px] text-ink-primary">The Kasbah</p>
                </Link>
                <Link
                  href="/admin/bookings?property=desert"
                  className="p-4 bg-cream rounded-lg border border-border-subtle hover:border-border transition-colors text-center"
                >
                  <p className="text-[13px] text-ink-primary">Desert Camp</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
