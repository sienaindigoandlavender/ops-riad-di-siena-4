"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import PasswordGate from "@/components/PasswordGate";
import LoadingScreen from "@/components/LoadingScreen";
import ImportModal from "@/components/ImportModal";
import SideNav from "@/components/SideNav";
import NewBookingModal from "@/components/NewBookingModal";
import ViewEditBookingModal from "@/components/ViewEditBookingModal";
import { RIAD_ROOMS, DOUARIA_ROOMS, ALL_ROOMS, BOOKING_SOURCES, getSourceColor, getSourceTextColor } from "@/lib/constants";
import type { Booking } from "@/types/booking";



// Parse individual room names from a booking
const parseRoomNames = (roomStr: string): string[] => {
  if (!roomStr) return [];
  return roomStr.split(/[\/\+]/).map(r => r.trim()).filter(Boolean);
};

// Parse date string as LOCAL date (not UTC) - fixes timezone shift issue
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  // Handle both "2026-01-14" and "2026-01-14T00:00:00" formats
  const parts = dateStr.split("T")[0].split("-");
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

// Format date to YYYY-MM-DD string
const toDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


export default function HomePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 3);
    return today;
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [newBooking, setNewBooking] = useState<{room: string; date: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSource, setImportSource] = useState<"booking" | "airbnb">("booking");

  const DAYS_TO_SHOW = 42;
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  
  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);
  
  
  // Generate calendar days for new booking modal
  
  // Jump to a specific date
  const jumpToDate = (date: Date) => {
    const newStart = new Date(date);
    newStart.setDate(newStart.getDate() - 3); // Show 3 days before selected date
    setStartDate(newStart);
    setShowDatePicker(false);
  };

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/admin/bookings?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      
      // Filter out cancelled bookings
      const activeBookings = (data.bookings || []).filter((b: any) => {
        const status = (b.status || "").toLowerCase();
        return status !== "cancelled" && status !== "canceled";
      });
      
      const mapped = activeBookings.map((b: any, idx: number) => ({
        id: b.Booking_ID || `booking-${idx}`,
        guestName: [b.firstName, b.lastName].filter(Boolean).join(" ") || "Guest",
        room: b.room || "",
        property: b.property || "",
        checkIn: b.checkIn || "",
        checkOut: b.checkOut || "",
        nights: parseInt(b.nights) || 0,
        source: b.source || "Direct",
        status: b.status || "confirmed",
        email: b.email || "",
        phone: b.phone || "",
        rowIndex: idx,
        firstName: b.firstName || "",
        lastName: b.lastName || "",
        country: b.country || "",
        language: b.language || "",
        notes: b.notes || "",
        arrivalTime: b.arrival_time_confirmed || b.arrival_time_stated || "",
      }));
      
      setBookings(mapped);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Generate dates for display
  const dates = useMemo(() => {
    const result = [];
    const current = new Date(startDate);
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate]);

  // Check if a room has a booking on a specific date
  const getBookingForRoomDate = (room: string, date: Date): Booking | null => {
    const dateStr = toDateStr(date);
    
    for (const booking of bookings) {
      if (!booking.checkIn || !booking.checkOut) continue;
      
      const bookingRooms = parseRoomNames(booking.room);
      const isRoomMatch = bookingRooms.some(
        r => r.toLowerCase() === room.toLowerCase()
      );
      
      if (!isRoomMatch) continue;
      
      const checkInStr = booking.checkIn.split("T")[0];
      const checkOutStr = booking.checkOut.split("T")[0];
      
      // Compare as strings to avoid timezone issues
      if (dateStr >= checkInStr && dateStr < checkOutStr) {
        return booking;
      }
    }
    return null;
  };

  // Get booking span (for visual display)
  const getBookingSpan = (booking: Booking, room: string, startIdx: number): number => {
    if (!booking.checkIn || !booking.checkOut) return 1;
    
    const checkOutStr = booking.checkOut.split("T")[0];
    let span = 0;
    
    for (let i = startIdx; i < dates.length; i++) {
      const dateStr = toDateStr(dates[i]);
      if (dateStr < checkOutStr) {
        span++;
      } else {
        break;
      }
    }
    
    return Math.max(1, span);
  };

  // Check if date is start of booking
  const isBookingStart = (booking: Booking, date: Date): boolean => {
    if (!booking.checkIn) return false;
    const checkInStr = booking.checkIn.split("T")[0];
    const dateStr = toDateStr(date);
    return dateStr === checkInStr;
  };

  // Navigation
  const navigateWeek = (direction: number) => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setStartDate(newDate);
    setDatePickerMonth({ year: newDate.getFullYear(), month: newDate.getMonth() });
  };

  const goToToday = () => {
    const today = new Date();
    today.setDate(today.getDate() - 3);
    setStartDate(today);
    setDatePickerMonth({ year: today.getFullYear(), month: today.getMonth() });
  };

  // Handle cell click (for new booking)
  const handleCellClick = (room: string, date: Date) => {
    const existingBooking = getBookingForRoomDate(room, date);
    if (existingBooking) {
      setSelectedBooking(existingBooking);
      return;
    }

    const dateStr = toDateStr(date);
    setNewBooking({ room, date: dateStr });
  };

  const openImportModal = (source: "booking" | "airbnb") => {
    setImportSource(source);
    setShowImportModal(true);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <PasswordGate>
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="md:hidden bg-cream border-b border-border-subtle">
        <div className="px-4 py-4 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-baseline gap-3 shrink-0 md:hidden">
              <h1 className="text-[15px] font-medium text-ink-primary tracking-[0.04em] normal-case">RIAD DI SIENA</h1>
              <p className="text-[11px] text-ink-tertiary tracking-[0.03em] hidden sm:block normal-case font-light">Operations</p>
            </div>

            {/* Import Buttons (desktop only) + Burger */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
              <button
                onClick={() => openImportModal("booking")}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 border border-border hover:border-ink-tertiary text-ink-secondary hover:text-ink-primary transition-colors text-[11px]"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Booking.com
              </button>
              <button
                onClick={() => openImportModal("airbnb")}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 border border-border hover:border-ink-tertiary text-ink-secondary hover:text-ink-primary transition-colors text-[11px]"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Airbnb
              </button>

              {/* Burger menu */}
              <button
                onClick={() => setShowNav(true)}
                className="md:hidden ml-2 w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-full hover:bg-linen transition-colors"
                aria-label="Open navigation"
              >
                <span className="block w-[18px] h-[1.5px] bg-ink-primary" />
                <span className="block w-[18px] h-[1.5px] bg-ink-primary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-cream px-4 md:px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Unified control cluster */}
          <div className="flex items-center border border-border-subtle divide-x divide-border-subtle">
            {/* Month dropdown */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => {
                  if (!showDatePicker) {
                    setDatePickerMonth({ year: dates[0].getFullYear(), month: dates[0].getMonth() });
                  }
                  setShowDatePicker(!showDatePicker);
                }}
                className="flex items-center gap-2 px-3.5 h-[34px] hover:bg-parchment transition-colors text-[12px]"
              >
                <span className="font-medium text-ink-primary normal-case tracking-normal">
                  {new Date(datePickerMonth.year, datePickerMonth.month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </span>
                <svg className={`w-3 h-3 text-ink-tertiary transition-transform ${showDatePicker ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Month list dropdown */}
              {showDatePicker && (
                <div
                  className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-border-subtle shadow-xl z-50 py-2"
                  style={{ width: '200px', maxHeight: '280px', overflowY: 'auto' }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const today = new Date();
                    const year = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);
                    const month = (today.getMonth() + i) % 12;
                    const label = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
                    const isSelected = datePickerMonth.year === year && datePickerMonth.month === month;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setDatePickerMonth({ year, month });
                          const target = new Date(year, month, 1);
                          jumpToDate(target);
                          setShowDatePicker(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-parchment ${isSelected ? "bg-accent-soft text-accent-strong font-medium" : "text-ink-body"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Today button */}
            <button
              onClick={goToToday}
              className="px-3.5 h-[34px] text-[11px] text-ink-secondary hover:bg-parchment transition-colors"
            >
              Today
            </button>

            {/* Week back/forward arrows */}
            <div className="hidden md:contents">
              <button
                onClick={() => navigateWeek(-1)}
                className="w-[34px] h-[34px] flex items-center justify-center hover:bg-parchment transition-colors"
              >
                <svg className="w-4 h-4 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="w-[34px] h-[34px] flex items-center justify-center hover:bg-parchment transition-colors"
              >
                <svg className="w-4 h-4 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => {
                setLoading(true);
                fetchBookings().finally(() => setLoading(false));
              }}
              className="w-[34px] h-[34px] flex items-center justify-center hover:bg-parchment transition-colors"
              title="Refresh bookings"
            >
              <svg className={`w-3.5 h-3.5 text-ink-tertiary ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Import buttons (desktop — moved from header) */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            <button
              onClick={() => openImportModal("booking")}
              className="flex items-center gap-1.5 px-3 h-[34px] border border-border hover:border-ink-tertiary text-ink-secondary hover:text-ink-primary transition-colors text-[11px]"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Booking.com
            </button>
            <button
              onClick={() => openImportModal("airbnb")}
              className="flex items-center gap-1.5 px-3 h-[34px] border border-border hover:border-ink-tertiary text-ink-secondary hover:text-ink-primary transition-colors text-[11px]"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Airbnb
            </button>
          </div>

          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 h-[34px] text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-[#A2B4BF]"></div>
              <span className="text-ink-tertiary normal-case tracking-[0.02em] font-light">Booking.com</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-[#CEAEA8]"></div>
              <span className="text-ink-tertiary normal-case tracking-[0.02em] font-light">Airbnb</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-[#C5AD84]"></div>
              <span className="text-ink-tertiary normal-case tracking-[0.02em] font-light">Website</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-[#A3AD95]"></div>
              <span className="text-ink-tertiary normal-case tracking-[0.02em] font-light">Direct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-[#3D3832]"></div>
              <span className="text-ink-tertiary normal-case tracking-[0.02em] font-light">Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden px-4 pb-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => setDatePickerMonth(prev => {
              const m = prev.month - 1;
              const next = m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
              jumpToDate(new Date(next.year, next.month, 1));
              return next;
            })}
            className="w-11 h-11 flex items-center justify-center -ml-2 hover:bg-linen transition-colors"
          >
            <svg className="w-5 h-5 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[15px] font-medium text-ink-primary normal-case tracking-normal">
            {new Date(datePickerMonth.year, datePickerMonth.month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => setDatePickerMonth(prev => {
              const m = prev.month + 1;
              const next = m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
              jumpToDate(new Date(next.year, next.month, 1));
              return next;
            })}
            className="w-11 h-11 flex items-center justify-center -mr-2 hover:bg-linen transition-colors"
          >
            <svg className="w-5 h-5 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Room mini-calendars */}
        {[
          { label: "The Riad", rooms: RIAD_ROOMS },
          { label: "The Douaria", rooms: DOUARIA_ROOMS },
        ].map((group) => (
          <div key={group.label} className="mb-5">
            <div className="text-[10px] font-medium text-ink-tertiary tracking-[0.1em] mb-3 px-1">{group.label.toUpperCase()}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.rooms.map((room) => {
                // Build calendar cells for this month
                const { year, month } = datePickerMonth;
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                const cells: (number | null)[] = [];
                for (let i = 0; i < startDow; i++) cells.push(null);
                for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
                while (cells.length % 7 !== 0) cells.push(null);

                const todayStr = toDateStr(new Date());

                return (
                  <div key={room} className="bg-white border border-border-subtle overflow-hidden">
                    {/* Mini calendar grid */}
                    <div className="p-3">
                      <div className="grid grid-cols-7 text-center gap-y-1">
                        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                          <div key={i} className="text-[9px] text-ink-tertiary font-medium leading-5 tracking-wide">{d}</div>
                        ))}
                        {cells.map((dayNum, idx) => {
                          if (dayNum === null) return <div key={idx} className="w-full aspect-square" />;
                          const cellDate = new Date(year, month, dayNum);
                          const cellStr = toDateStr(cellDate);
                          const booking = getBookingForRoomDate(room, cellDate);
                          const isToday = cellStr === todayStr;

                          // Determine background color
                          let bgClass = "";
                          let textClass = "text-ink-secondary";
                          if (booking) {
                            const s = (booking.source || "").trim().toLowerCase();
                            if (s.includes("blackout") || s.includes("blocked")) {
                              bgClass = "bg-[#3D3832]/25";
                              textClass = "text-ink-secondary";
                            } else if (s.includes("airbnb")) {
                              bgClass = "bg-[#CEAEA8]/45";
                              textClass = "text-[#4A3530]";
                            } else if (s.includes("booking")) {
                              bgClass = "bg-[#A2B4BF]/45";
                              textClass = "text-[#2E3E47]";
                            } else if (s.includes("website")) {
                              bgClass = "bg-[#C5AD84]/45";
                              textClass = "text-[#3E3318]";
                            } else {
                              bgClass = "bg-[#A3AD95]/45";
                              textClass = "text-[#2E3A28]";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (booking) {
                                  setSelectedBooking(booking);
                                }
                              }}
                              className={`
                                w-full aspect-square flex items-center justify-center text-[12px] active:scale-95 active:bg-linen transition-all duration-150
                                ${bgClass} ${textClass}
                                ${isToday && !booking ? "ring-1 ring-ink-primary text-ink-primary font-semibold" : ""}
                                ${isToday && booking ? "ring-1 ring-accent font-bold" : ""}
                                ${booking ? "font-medium" : ""}
                              `}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Room name */}
                    <div className="px-3 py-2.5 border-t border-border-subtle">
                      <div className="text-[12px] font-light text-ink-primary uppercase tracking-[0.04em]">{room}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Mobile legend */}
        <div className="flex items-center justify-center gap-3 pt-2 text-[10px]">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#A2B4BF]/50"></div><span className="text-ink-tertiary">Booking</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#CEAEA8]/50"></div><span className="text-ink-tertiary">Airbnb</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#C5AD84]/50"></div><span className="text-ink-tertiary">Website</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#A3AD95]/50"></div><span className="text-ink-tertiary">Direct</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3D3832]/40"></div><span className="text-ink-tertiary">Blocked</span></div>
        </div>
      </div>

      {/* Mobile FAB: Add booking */}
      <button
        onClick={() => handleCellClick(RIAD_ROOMS[0], new Date())}
        className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-ink-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="New booking"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 4v12M4 10h12" />
        </svg>
      </button>

      {/* Calendar Grid - Desktop only */}
      <div className="hidden md:block px-4 py-4">
        <div className="bg-cream border border-border-subtle overflow-hidden">
          <div ref={scrollRef} className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1400px] table-fixed">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-cream border-b border-r border-border-subtle px-4 py-3 text-left text-[10px] font-light text-ink-tertiary tracking-[0.08em] w-36">
                    Room
                  </th>
                  {dates.map((date, idx) => (
                    <th
                      key={idx}
                      className={`border-b border-r border-border-subtle p-2 text-center w-[80px] ${
                        isToday(date) ? "bg-parchment" : isWeekend(date) ? "bg-bone" : "bg-cream"
                      }`}
                    >
                      <div className="text-[10px] text-ink-tertiary uppercase">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className={`text-[13px] font-medium ${isToday(date) ? "text-ink-primary" : "text-ink-body"}`}>
                        {date.getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* The Riad */}
                <tr>
                  <td colSpan={dates.length + 1} className="bg-bone px-3 py-2 border-b border-border-subtle">
                    <span className="text-[10px] font-light text-ink-tertiary tracking-[0.1em]">THE RIAD</span>
                  </td>
                </tr>
                {RIAD_ROOMS.map((room) => (
                  <tr key={room}>
                    <td className="sticky left-0 z-10 bg-cream border-b border-r border-border-subtle px-4 py-3 text-[13px] font-light text-ink-primary uppercase tracking-[0.04em]">
                      {room}
                    </td>
                    {(() => {
                      const cells: React.ReactNode[] = [];
                      let skipUntil = -1;
                      
                      dates.forEach((date, idx) => {
                        // Skip cells covered by previous booking's colspan
                        if (idx < skipUntil) {
                          return;
                        }
                        
                        const booking = getBookingForRoomDate(room, date);
                        const isStart = booking && (isBookingStart(booking, date) || idx === 0);
                        const span = isStart ? getBookingSpan(booking!, room, idx) : 1;

                        if (isStart && span > 1) {
                          skipUntil = idx + span;
                        }

                        cells.push(
                          <td
                            key={idx}
                            colSpan={isStart ? span : 1}
                            className={`border-b border-r border-border-subtle p-[3px] h-[54px] ${
                              isToday(date) ? "bg-parchment" : isWeekend(date) ? "bg-bone" : "bg-cream"
                            } ${!booking ? "cursor-pointer hover:bg-parchment group" : ""}`}
                            onClick={() => !booking && handleCellClick(room, date)}
                          >
                            {isStart && booking ? (
                              (() => {
                                const isPast = booking.checkOut && booking.checkOut.split("T")[0] < toDateStr(new Date());
                                return (
                              <div
                                className={`${getSourceColor(booking.source)} ${getSourceTextColor(booking.source)} px-2.5 py-[7px] text-[11px] font-medium cursor-pointer hover:brightness-[0.96] active:scale-[0.98] active:brightness-[0.92] transition-all duration-150 flex flex-col justify-center ${isPast ? "opacity-35" : ""}`}
                                style={{ minHeight: "40px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                }}
                              >
                                <div className="truncate uppercase">{booking.guestName}</div>
                                                              </div>
                                );
                              })()
                            ) : !booking && (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-tertiary">
                                  <path d="M8 3v10M3 8h10" />
                                </svg>
                              </div>
                            )}
                          </td>
                        );
                      });
                      
                      return cells;
                    })()}
                  </tr>
                ))}

                {/* The Douaria */}
                <tr>
                  <td colSpan={dates.length + 1} className="bg-bone px-3 py-2 border-b border-border-subtle">
                    <span className="text-[10px] font-light text-ink-tertiary tracking-[0.1em]">THE DOUARIA</span>
                  </td>
                </tr>
                {DOUARIA_ROOMS.map((room) => (
                  <tr key={room}>
                    <td className="sticky left-0 z-10 bg-cream border-b border-r border-border-subtle px-4 py-3 text-[13px] font-light text-ink-primary uppercase tracking-[0.04em]">
                      {room}
                    </td>
                    {(() => {
                      const cells: React.ReactNode[] = [];
                      let skipUntil = -1;
                      
                      dates.forEach((date, idx) => {
                        // Skip cells covered by previous booking's colspan
                        if (idx < skipUntil) {
                          return;
                        }
                        
                        const booking = getBookingForRoomDate(room, date);
                        const isStart = booking && (isBookingStart(booking, date) || idx === 0);
                        const span = isStart ? getBookingSpan(booking!, room, idx) : 1;

                        if (isStart && span > 1) {
                          skipUntil = idx + span;
                        }

                        cells.push(
                          <td
                            key={idx}
                            colSpan={isStart ? span : 1}
                            className={`border-b border-r border-border-subtle p-[3px] h-[54px] ${
                              isToday(date) ? "bg-parchment" : isWeekend(date) ? "bg-bone" : "bg-cream"
                            } ${!booking ? "cursor-pointer hover:bg-parchment group" : ""}`}
                            onClick={() => !booking && handleCellClick(room, date)}
                          >
                            {isStart && booking ? (
                              (() => {
                                const isPast = booking.checkOut && booking.checkOut.split("T")[0] < toDateStr(new Date());
                                return (
                              <div
                                className={`${getSourceColor(booking.source)} ${getSourceTextColor(booking.source)} px-2.5 py-[7px] text-[11px] font-medium cursor-pointer hover:brightness-[0.96] active:scale-[0.98] active:brightness-[0.92] transition-all duration-150 flex flex-col justify-center ${isPast ? "opacity-35" : ""}`}
                                style={{ minHeight: "40px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                }}
                              >
                                <div className="truncate uppercase">{booking.guestName}</div>
                                                              </div>
                                );
                              })()
                            ) : !booking && (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-tertiary">
                                  <path d="M8 3v10M3 8h10" />
                                </svg>
                              </div>
                            )}
                          </td>
                        );
                      });
                      
                      return cells;
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View/Edit Booking Modal */}
      {selectedBooking && (
        <ViewEditBookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSaved={fetchBookings}
        />
      )}

      {/* New Booking Modal */}
      {newBooking && (
        <NewBookingModal
          initialRoom={newBooking.room}
          initialDate={newBooking.date}
          onClose={() => setNewBooking(null)}
          onSaved={fetchBookings}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          importSource={importSource}
          onClose={() => setShowImportModal(false)}
          onImportComplete={fetchBookings}
        />
      )}
      {showNav && <SideNav onClose={() => setShowNav(false)} />}
    </div>
    </PasswordGate>
  );
}
