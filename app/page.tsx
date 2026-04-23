"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import PasswordGate from "@/components/PasswordGate";

interface Booking {
  id: string;
  guestName: string;
  room: string;
  property: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  source: string;
  status: string;
  email?: string;
  phone?: string;
  rowIndex?: number;
  firstName?: string;
  lastName?: string;
  country?: string;
  language?: string;
  notes?: string;
}

interface ImportResults {
  added: number;
  updated: number;
  unchanged: number;
  cancelled: number;
  errors: string[];
  changes: string[];
  source?: string;
}

// Booking source colors — muted premium palette
const getSourceColor = (source: string): string => {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("blackout") || s.includes("blocked")) return "bg-[#3D3832]";
  if (s.includes("airbnb")) return "bg-[#CEAEA8]";
  if (s.includes("booking")) return "bg-[#A2B4BF]";
  if (s.includes("website")) return "bg-[#C5AD84]";
  return "bg-[#A3AD95]";
};

const getSourceTextColor = (source: string): string => {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("blackout") || s.includes("blocked")) return "text-[#E8E4DF]";
  if (s.includes("airbnb")) return "text-[#4A3530]";
  if (s.includes("booking")) return "text-[#2E3E47]";
  if (s.includes("website")) return "text-[#3E3318]";
  return "text-[#2E3A28]";
};

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

// Canonical room list
const RIAD_ROOMS = ["Hidden Gem", "Jewel Box", "Trésor Caché"];
const DOUARIA_ROOMS = ["Bliss", "Joy", "Love"];
const ALL_ROOMS = [...RIAD_ROOMS, ...DOUARIA_ROOMS];

// Source options for new bookings
const BOOKING_SOURCES = ["Website", "WhatsApp", "Direct", "Email", "Airbnb", "Booking.com", "Other"];

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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    checkIn: "",
    checkOut: "",
    email: "",
    phone: "",
    source: "",
    room: "",
    country: "",
    language: "",
    notes: "",
  });
  const [newBooking, setNewBooking] = useState<{room: string; date: string} | null>(null);
  const [newBookingForm, setNewBookingForm] = useState({
    firstName: "",
    lastName: "",
    checkIn: "",
    checkOut: "",
    email: "",
    phone: "",
    country: "",
    language: "",
    notes: "",
    source: "Direct",
    room: "",
    isBlackout: false,
    totalEur: "",
    ratePerNight: "",
  });
  const [savingBooking, setSavingBooking] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [includePaymentLink, setIncludePaymentLink] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // New booking calendar picker state
  const [newBookingCalendarMonth, setNewBookingCalendarMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [selectingDate, setSelectingDate] = useState<"checkIn" | "checkOut">("checkIn");

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSource, setImportSource] = useState<"booking" | "airbnb">("booking");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
  const newBookingCalendarDays = useMemo(() => {
    const { year, month } = newBookingCalendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  }, [newBookingCalendarMonth]);
  
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
      setIsEditing(false);
      return;
    }
    
    const dateStr = toDateStr(date);
    setNewBooking({ room, date: dateStr });
    setNewBookingForm({
      firstName: "",
      lastName: "",
      checkIn: dateStr,
      checkOut: "",
      email: "",
      phone: "",
      country: "",
      language: "",
      notes: "",
      source: "Direct",
      room: room,
      isBlackout: false,
      totalEur: "",
      ratePerNight: "",
    });
    // Reset calendar to the clicked date's month and set to select check-out
    setNewBookingCalendarMonth({ year: date.getFullYear(), month: date.getMonth() });
    setSelectingDate("checkOut");
  };

  // Save new booking
  const saveNewBooking = async () => {
    if (!newBookingForm.checkIn || !newBookingForm.checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }
    
    if (!newBookingForm.isBlackout && !newBookingForm.firstName) {
      alert("Please enter guest name");
      return;
    }

    setSavingBooking(true);
    
    try {
      const property = RIAD_ROOMS.includes(newBookingForm.room) ? "The Riad" : "The Douaria";
      
      const checkIn = new Date(newBookingForm.checkIn);
      const checkOut = new Date(newBookingForm.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newBookingForm.isBlackout ? "BLOCKED" : newBookingForm.firstName,
          last_name: newBookingForm.isBlackout ? "" : newBookingForm.lastName,
          email: newBookingForm.email,
          phone: newBookingForm.phone,
          country: newBookingForm.country,
          language: newBookingForm.language,
          notes: newBookingForm.notes,
          check_in: newBookingForm.checkIn,
          check_out: newBookingForm.checkOut,
          nights: nights.toString(),
          room: newBookingForm.room,
          property: property,
          source: newBookingForm.isBlackout ? "Blocked" : newBookingForm.source,
          status: newBookingForm.isBlackout ? "blocked" : "confirmed",
          rate_per_night: newBookingForm.ratePerNight,
          total_eur: newBookingForm.totalEur,
        }),
      });

      if (res.ok) {
        await fetchBookings();
        setNewBooking(null);
        // Reset form
        setNewBookingForm({
          firstName: "",
          lastName: "",
          checkIn: "",
          checkOut: "",
          email: "",
          phone: "",
          country: "",
          language: "",
          notes: "",
          source: "Direct",
          room: "",
          isBlackout: false,
          totalEur: "",
          ratePerNight: "",
        });
      } else {
        const errorData = await res.json();
        alert("Failed to save booking: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking");
    } finally {
      setSavingBooking(false);
    }
  };

  // Start editing a booking
  const startEditing = () => {
    if (!selectedBooking) return;
    setEditForm({
      firstName: selectedBooking.firstName || selectedBooking.guestName.split(" ")[0] || "",
      lastName: selectedBooking.lastName || selectedBooking.guestName.split(" ").slice(1).join(" ") || "",
      checkIn: selectedBooking.checkIn,
      checkOut: selectedBooking.checkOut,
      email: selectedBooking.email || "",
      phone: selectedBooking.phone || "",
      source: selectedBooking.source,
      room: selectedBooking.room,
      country: selectedBooking.country || "",
      language: selectedBooking.language || "",
      notes: selectedBooking.notes || "",
    });
    setIsEditing(true);
  };

  // Save edited booking
  const saveEditedBooking = async () => {
    if (!selectedBooking || selectedBooking.rowIndex === undefined) {
      alert("Cannot update booking - missing row index");
      return;
    }

    if (!editForm.firstName || !editForm.checkIn || !editForm.checkOut) {
      alert("Please fill in required fields (name, check-in, check-out)");
      return;
    }

    setSavingBooking(true);

    try {
      const property = RIAD_ROOMS.includes(editForm.room) ? "The Riad" : "The Douaria";
      const checkIn = new Date(editForm.checkIn);
      const checkOut = new Date(editForm.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: selectedBooking.rowIndex,
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
          check_in: editForm.checkIn,
          check_out: editForm.checkOut,
          nights: nights.toString(),
          room: editForm.room,
          property: property,
          source: editForm.source,
          country: editForm.country,
          language: editForm.language,
          notes: editForm.notes,
        }),
      });

      if (res.ok) {
        setSelectedBooking(null);
        setIsEditing(false);
        await fetchBookings();
      } else {
        const errorData = await res.json();
        alert("Failed to update booking: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking");
    } finally {
      setSavingBooking(false);
    }
  };

  // Delete booking
  const deleteBooking = async () => {
    if (!selectedBooking || selectedBooking.rowIndex === undefined) {
      alert("Cannot delete booking - missing row index");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the booking for ${selectedBooking.guestName}?`
    );
    
    if (!confirmDelete) return;

    setDeletingBooking(true);

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: selectedBooking.rowIndex,
        }),
      });

      if (res.ok) {
        setSelectedBooking(null);
        setIsEditing(false);
        await fetchBookings();
      } else {
        const errorData = await res.json();
        alert("Failed to delete booking: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking");
    } finally {
      setDeletingBooking(false);
    }
  };

  // Import handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setImportError(null);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : (data.error || "Upload failed");
        setImportError(errorMsg);
        return;
      }

      setImportResults({
        ...data.results,
        source: data.source,
      });
      
      // Refresh bookings after import
      await fetchBookings();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    const fileName = file?.name.toLowerCase() || "";
    if (file && (fileName.endsWith(".csv") || fileName.endsWith(".xls") || fileName.endsWith(".xlsx"))) {
      uploadFile(file);
    } else {
      setImportError("Please upload a CSV, XLS, or XLSX file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const openImportModal = (source: "booking" | "airbnb") => {
    setImportSource(source);
    setImportResults(null);
    setImportError(null);
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-ink-tertiary text-[13px]">Loading calendar...</div>
      </div>
    );
  }

  return (
    <PasswordGate>
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-cream border-b border-border-subtle">
        <div className="px-4 py-5 md:px-10 md:py-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-baseline gap-3 shrink-0">
              <h1 className="text-[15px] md:text-[16px] font-medium text-ink-primary tracking-[0.04em] normal-case">RIAD DI SIENA</h1>
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
                className="ml-2 w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-full hover:bg-linen transition-colors"
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
      <div className="bg-cream border-b border-border-subtle px-4 md:px-10 py-2.5">
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
                                  setIsEditing(false);
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
      <div className="hidden md:block px-10 py-6">
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
                              <div
                                className={`${getSourceColor(booking.source)} ${getSourceTextColor(booking.source)} px-2.5 py-[7px] text-[11px] font-medium cursor-pointer hover:brightness-[0.96] active:scale-[0.98] active:brightness-[0.92] transition-all duration-150 flex flex-col justify-center`}
                                style={{ minHeight: "40px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                  setIsEditing(false);
                                }}
                              >
                                <div className="truncate">{booking.guestName}</div>
                                <div className="text-[10px] opacity-75">{booking.nights}n</div>
                              </div>
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
                              <div
                                className={`${getSourceColor(booking.source)} ${getSourceTextColor(booking.source)} px-2.5 py-[7px] text-[11px] font-medium cursor-pointer hover:brightness-[0.96] active:scale-[0.98] active:brightness-[0.92] transition-all duration-150 flex flex-col justify-center`}
                                style={{ minHeight: "40px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                  setIsEditing(false);
                                }}
                              >
                                <div className="truncate">{booking.guestName}</div>
                                <div className="text-[10px] opacity-75">{booking.nights}n</div>
                              </div>
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
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white shadow-lg w-full max-w-lg mx-4 modal-panel">
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[18px] text-ink-primary">
                  {isEditing ? "Edit Booking" : "Booking Details"}
                </h2>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setIsEditing(false);
                  }}
                  className="p-2 hover:bg-parchment rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {isEditing ? (
                <>
                  {/* Edit Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                      Room
                    </label>
                    <select
                      value={editForm.room}
                      onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                    >
                      {ALL_ROOMS.map((room) => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                      Source
                    </label>
                    <select
                      value={editForm.source}
                      onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                    >
                      {BOOKING_SOURCES.map((src) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                      <option value="Booking.com">Booking.com</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        Check-in *
                      </label>
                      <input
                        type="date"
                        value={editForm.checkIn}
                        onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        Check-out *
                      </label>
                      <input
                        type="date"
                        value={editForm.checkOut}
                        onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                  </div>
                  
                  {/* Country & Language */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                        Language
                      </label>
                      <input
                        type="text"
                        value={editForm.language}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                        className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                      />
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <div className="flex items-start gap-4">
                    <div className={`${getSourceColor(selectedBooking.source)} w-12 h-12 rounded-lg flex items-center justify-center`}>
                      <span className={`${getSourceTextColor(selectedBooking.source)} font-medium text-[15px]`}>
                        {selectedBooking.guestName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-ink-primary">{selectedBooking.guestName}</h3>
                      <p className="text-[13px] text-ink-secondary">{selectedBooking.room}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Check-in</div>
                      <div className="text-[13px] text-ink-primary">{selectedBooking.checkIn}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Check-out</div>
                      <div className="text-[13px] text-ink-primary">{selectedBooking.checkOut}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Nights</div>
                      <div className="text-[13px] text-ink-primary">{selectedBooking.nights}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Source</div>
                      <div className="text-[13px] text-ink-primary">{selectedBooking.source}</div>
                    </div>
                    {selectedBooking.email && (
                      <div className="col-span-2">
                        <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Email</div>
                        <div className="text-[13px] text-ink-primary">{selectedBooking.email}</div>
                      </div>
                    )}
                    {selectedBooking.phone && (
                      <div className="col-span-2">
                        <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Phone</div>
                        <div className="text-[13px] text-ink-primary">{selectedBooking.phone}</div>
                      </div>
                    )}
                    {selectedBooking.country && (
                      <div>
                        <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Country</div>
                        <div className="text-[13px] text-ink-primary">{selectedBooking.country}</div>
                      </div>
                    )}
                    {selectedBooking.language && (
                      <div>
                        <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Language</div>
                        <div className="text-[13px] text-ink-primary">{selectedBooking.language}</div>
                      </div>
                    )}
                    {selectedBooking.notes && (
                      <div className="col-span-2">
                        <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Notes</div>
                        <div className="text-[13px] text-ink-primary whitespace-pre-wrap">{selectedBooking.notes}</div>
                      </div>
                    )}
                  </div>

                  {/* Send Confirmation Section - Only for Direct bookings */}
                  {(selectedBooking.email || selectedBooking.phone) && 
                   selectedBooking.status !== "blocked" && 
                   !selectedBooking.source.toLowerCase().includes("booking") &&
                   !selectedBooking.source.toLowerCase().includes("airbnb") && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <div className="text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-3">
                        Send Confirmation
                      </div>
                      
                      {/* Include Payment Link Checkbox */}
                      <label className="flex items-center gap-2 mb-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includePaymentLink}
                          onChange={(e) => setIncludePaymentLink(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-ink-primary focus:ring-accent/20"
                        />
                        <span className="text-[12px] text-ink-secondary">Include PayPal payment link</span>
                      </label>
                      
                      <div className="flex gap-2">
                        {selectedBooking.email && (
                          <button
                            onClick={() => {
                              const firstName = selectedBooking.firstName || selectedBooking.guestName.split(" ")[0];
                              const subject = encodeURIComponent(`Booking Confirmation - Riad di Siena`);
                              const paymentSection = includePaymentLink 
                                ? `\n\nTo complete your booking, please make your payment via PayPal:\nhttps://www.paypal.com/paypalme/riaddisiena\n` 
                                : '';
                              const body = encodeURIComponent(
`Dear ${firstName},

Thank you for your booking at Riad di Siena!

Here are your reservation details:

Room: ${selectedBooking.room}
Check-in: ${new Date(selectedBooking.checkIn).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
Check-out: ${new Date(selectedBooking.checkOut).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
Nights: ${selectedBooking.nights}${paymentSection}

We look forward to welcoming you!

Warm regards,
Riad di Siena`
                              );
                              window.open(`mailto:${selectedBooking.email}?subject=${subject}&body=${body}`, '_blank');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-parchment hover:bg-linen rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[12px] font-medium text-ink-secondary">Email</span>
                          </button>
                        )}

                        {selectedBooking.phone && (
                          <button
                            onClick={() => {
                              const firstName = selectedBooking.firstName || selectedBooking.guestName.split(" ")[0];
                              const phone = (selectedBooking.phone || "").replace(/[^0-9+]/g, "");
                              const paymentSection = includePaymentLink 
                                ? `\n\n💳 *Payment link:*\nhttps://www.paypal.com/paypalme/riaddisiena` 
                                : '';
                              const message = encodeURIComponent(
`Hello ${firstName}! 🌿

Your booking at *Riad di Siena* is confirmed:

🏠 *${selectedBooking.room}*
📅 ${new Date(selectedBooking.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(selectedBooking.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
🌙 ${selectedBooking.nights} night${selectedBooking.nights > 1 ? 's' : ''}${paymentSection}

We look forward to welcoming you! ✨`
                              );
                              window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#6B7B6E]/10 hover:bg-[#6B7B6E]/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-[#6B7B6E]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span className="text-[12px] font-medium text-[#6B7B6E]">WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-border-subtle flex justify-between">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-[13px] font-medium text-ink-secondary hover:bg-parchment rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedBooking}
                    disabled={savingBooking}
                    className="px-6 py-2 bg-accent text-cream text-[13px] font-medium rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50"
                  >
                    {savingBooking ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={deleteBooking}
                    disabled={deletingBooking}
                    className="px-4 py-2 text-[13px] font-medium text-brick hover:bg-brick/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingBooking ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={startEditing}
                    className="px-6 py-2 bg-accent text-cream text-[13px] font-medium rounded-lg hover:bg-accent-strong transition-colors"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {newBooking && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white shadow-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden modal-panel">
            {/* Source color strip */}
            <div className={`h-1 w-full ${getSourceColor(newBookingForm.isBlackout ? "blocked" : newBookingForm.source)} transition-colors duration-300`} />
            {/* Header */}
            <div className="px-7 py-5 border-b border-border-subtle flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-medium text-ink-primary tracking-[0.02em]">New Booking</h2>
                <button
                  onClick={() => setNewBooking(null)}
                  className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-7 py-6 space-y-7 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Blackout Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newBookingForm.isBlackout}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, isBlackout: e.target.checked })}
                  className="w-4 h-4 accent-[#111]"
                />
                <span className="text-[11px] text-ink-secondary group-hover:text-ink-primary transition-colors normal-case tracking-[0.02em]">Block dates (no guest)</span>
              </label>

              {!newBookingForm.isBlackout && (
                <>
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={newBookingForm.firstName}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, firstName: e.target.value })}
                        className="w-full bg-transparent border-b border-border pb-3 text-[14px] text-ink-primary focus:outline-none focus:border-ink-tertiary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newBookingForm.lastName}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, lastName: e.target.value })}
                        className="w-full bg-transparent border-b border-border pb-3 text-[14px] text-ink-primary focus:outline-none focus:border-ink-tertiary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                      Source
                    </label>
                    <select
                      value={newBookingForm.source}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, source: e.target.value })}
                      className="w-full bg-transparent border-b border-border pb-3 text-[14px] text-ink-primary focus:outline-none focus:border-ink-tertiary transition-colors cursor-pointer"
                    >
                      {BOOKING_SOURCES.map((src) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>

                  {/* Email & Phone Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newBookingForm.email}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, email: e.target.value })}
                        className="w-full bg-transparent border-b border-border pb-3 text-[14px] text-ink-primary focus:outline-none focus:border-ink-tertiary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newBookingForm.phone}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, phone: e.target.value })}
                        className="w-full bg-transparent border-b border-border pb-3 text-[14px] text-ink-primary focus:outline-none focus:border-ink-tertiary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Country & Language Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={newBookingForm.country}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, country: e.target.value })}
                        placeholder="e.g. France"
                        className="w-full bg-transparent border-b border-foreground/20 pb-3 text-[14px] text-foreground/90 placeholder:text-ink-tertiary focus:outline-none focus:border-foreground/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                        Language
                      </label>
                      <select
                        value={newBookingForm.language}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, language: e.target.value })}
                        className="w-full bg-transparent border-b border-border pb-3 text-[14px] text-ink-primary focus:outline-none focus:border-ink-tertiary transition-colors cursor-pointer"
                      >
                        <option value="">Select...</option>
                        <option value="English">English</option>
                        <option value="French">French</option>
                        <option value="Spanish">Spanish</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                      Notes / Comments
                    </label>
                    <textarea
                      value={newBookingForm.notes}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Special requests, arrival details, etc."
                      className="w-full bg-transparent border-b border-foreground/20 pb-3 text-[14px] text-foreground/90 placeholder:text-ink-tertiary focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                    />
                  </div>

                  {/* Agreed Rates Section */}
                  <div className="pt-4 border-t border-border-subtle">
                    <div className="text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-4">
                      Agreed Rates
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                          Rate per Night (€)
                        </label>
                        <input
                          type="number"
                          value={newBookingForm.ratePerNight}
                          onChange={(e) => setNewBookingForm({ ...newBookingForm, ratePerNight: e.target.value })}
                          placeholder="e.g. 150"
                          className="w-full bg-transparent border-b border-foreground/20 pb-3 text-[14px] text-foreground/90 placeholder:text-ink-tertiary focus:outline-none focus:border-foreground/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                          Total (€)
                        </label>
                        <input
                          type="number"
                          value={newBookingForm.totalEur}
                          onChange={(e) => setNewBookingForm({ ...newBookingForm, totalEur: e.target.value })}
                          placeholder="e.g. 450"
                          className="w-full bg-transparent border-b border-foreground/20 pb-3 text-[14px] text-foreground/90 placeholder:text-ink-tertiary focus:outline-none focus:border-foreground/40 transition-colors"
                        />
                      </div>
                    </div>
                    {newBookingForm.checkIn && newBookingForm.checkOut && newBookingForm.ratePerNight && (
                      <div className="mt-3 text-[11px] text-ink-tertiary">
                        {(() => {
                          const nights = Math.ceil((new Date(newBookingForm.checkOut).getTime() - new Date(newBookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                          const calculated = nights * parseFloat(newBookingForm.ratePerNight);
                          return nights > 0 ? `${nights} night${nights > 1 ? 's' : ''} × €${newBookingForm.ratePerNight} = €${calculated.toFixed(0)}` : '';
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Room */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-ink-secondary mb-2">
                  Room
                </label>
                <select
                  value={newBookingForm.room}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, room: e.target.value })}
                  className="w-full bg-transparent border-b border-border pb-3 text-[14px] text-ink-primary focus:outline-none focus:border-ink-tertiary transition-colors cursor-pointer"
                >
                  {ALL_ROOMS.map((room) => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              {/* Calendar Date Picker */}
              <div className="border-t border-border-subtle pt-6">
                {/* Step Indicator */}
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-tertiary mb-4">
                  {selectingDate === "checkIn" ? "Step 1 of 2 — Select Check-in" : "Step 2 of 2 — Select Check-out"}
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const { year, month } = newBookingCalendarMonth;
                      const newMonth = month === 0 ? 11 : month - 1;
                      const newYear = month === 0 ? year - 1 : year;
                      setNewBookingCalendarMonth({ year: newYear, month: newMonth });
                    }}
                    className="w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 4l-4 4 4 4" />
                    </svg>
                  </button>
                  <span className="text-[14px] text-foreground/80">
                    {new Date(newBookingCalendarMonth.year, newBookingCalendarMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => {
                      const { year, month } = newBookingCalendarMonth;
                      const newMonth = month === 11 ? 0 : month + 1;
                      const newYear = month === 11 ? year + 1 : year;
                      setNewBookingCalendarMonth({ year: newYear, month: newMonth });
                    }}
                    className="w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7">
                  {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
                    <div key={day} className="h-10 flex items-center justify-center text-[11px] text-ink-tertiary">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-t border-l border-foreground/10">
                  {newBookingCalendarDays.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="h-10 border-b border-r border-foreground/10" />;
                    }
                    
                    const dateStr = toDateStr(date);
                    const isCheckIn = newBookingForm.checkIn === dateStr;
                    const isCheckOut = newBookingForm.checkOut === dateStr;
                    const isSelected = isCheckIn || isCheckOut;
                    const isInRange = newBookingForm.checkIn && newBookingForm.checkOut && 
                      dateStr > newBookingForm.checkIn && dateStr < newBookingForm.checkOut;
                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                    
                    return (
                      <button
                        key={dateStr}
                        disabled={isPast}
                        onClick={() => {
                          if (selectingDate === "checkIn") {
                            setNewBookingForm({ ...newBookingForm, checkIn: dateStr, checkOut: "" });
                            setSelectingDate("checkOut");
                          } else {
                            if (dateStr > newBookingForm.checkIn) {
                              setNewBookingForm({ ...newBookingForm, checkOut: dateStr });
                              setSelectingDate("checkIn");
                            }
                          }
                        }}
                        className={`h-10 flex items-center justify-center text-[13px] border-b border-r border-foreground/10 transition-colors
                          ${isPast ? "text-foreground/20 cursor-not-allowed" : "hover:bg-foreground/5 cursor-pointer text-foreground/70"}
                          ${isSelected ? "bg-foreground text-cream" : ""}
                          ${isInRange ? "bg-foreground/10" : ""}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-foreground" />
                    <span className="text-[10px] text-ink-tertiary uppercase tracking-[0.08em]">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-foreground/15" />
                    <span className="text-[10px] text-ink-tertiary uppercase tracking-[0.08em]">Unavailable</span>
                  </div>
                </div>

                {/* Selected Dates Display */}
                {newBookingForm.checkIn && (
                  <div className="mt-4 pt-4 border-t border-border-subtle text-[12px] text-ink-secondary">
                    {new Date(newBookingForm.checkIn + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {newBookingForm.checkOut && (
                      <> — {new Date(newBookingForm.checkOut + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-7 py-5 border-t border-border-subtle flex gap-4 flex-shrink-0">
              <button
                onClick={() => setNewBooking(null)}
                className="flex-1 py-3 text-[11px] uppercase tracking-[0.08em] font-medium border border-border text-ink-secondary hover:border-ink-tertiary hover:text-ink-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNewBooking}
                disabled={savingBooking}
                className="flex-1 py-3 text-[11px] uppercase tracking-[0.08em] font-medium bg-ink-primary text-white hover:bg-black transition-colors disabled:opacity-50"
              >
                {savingBooking ? "Saving..." : newBookingForm.isBlackout ? "Block Dates" : "Add Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white shadow-lg w-full max-w-lg mx-4 modal-panel">
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[18px] text-ink-primary">
                  Import {importSource === "booking" ? "Booking.com" : "Airbnb"} Export
                </h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-parchment rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragging
                    ? importSource === "booking"
                      ? "border-[#A8BDC8] bg-[#A8BDC8]/10"
                      : "border-[#C9A5A0] bg-[#C9A5A0]/10"
                    : "border-border-subtle hover:border-border"
                }`}
              >
                {isUploading ? (
                  <div className="text-[13px] text-ink-secondary">Uploading...</div>
                ) : importResults ? (
                  <div className="space-y-3">
                    <div className="text-[15px] font-medium text-ink-primary">Import Complete</div>
                    <div className="grid grid-cols-2 gap-2 text-[13px]">
                      <div className="text-sage">Added: {importResults.added}</div>
                      <div className="text-gold">Updated: {importResults.updated}</div>
                      <div className="text-ink-secondary">Unchanged: {importResults.unchanged}</div>
                      <div className="text-brick">Cancelled: {importResults.cancelled}</div>
                    </div>
                    <button
                      onClick={() => {
                        setImportResults(null);
                        setShowImportModal(false);
                      }}
                      className="mt-4 px-4 py-2 bg-accent text-cream text-[13px] font-medium rounded-lg"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      importSource === "booking" ? "bg-[#A8BDC8]/20" : "bg-[#C9A5A0]/20"
                    }`}>
                      <svg className={`w-6 h-6 ${
                        importSource === "booking" ? "text-[#4A5C66]" : "text-[#6B4E3D]"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-[13px] text-ink-secondary mb-2">Drag and drop your file here</p>
                    <p className="text-[11px] text-ink-tertiary mb-4">CSV, XLS, or XLSX</p>
                    <label className={`inline-block px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer ${
                      importSource === "booking"
                        ? "bg-[#A8BDC8]/20 text-[#4A5C66] hover:bg-[#A8BDC8]/30"
                        : "bg-[#C9A5A0]/20 text-[#6B4E3D] hover:bg-[#C9A5A0]/30"
                    }`}>
                      Browse Files
                      <input
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </>
                )}

                {importError && (
                  <div className="mt-4 p-3 bg-brick/10 rounded-lg text-[13px] text-brick">
                    {importError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Side navigation */}
      {showNav && (
        <>
          <div className="fixed inset-0 bg-black/20 z-50 modal-overlay" onClick={() => setShowNav(false)} />
          <nav className="fixed top-0 right-0 h-full w-72 bg-white border-l border-border-subtle z-50 flex flex-col modal-panel" style={{ animationName: 'none', animation: 'slide-in-right 200ms cubic-bezier(0.22, 1, 0.36, 1) both' }}>
            <div className="flex items-center justify-between px-7 py-6 border-b border-border-subtle">
              <span className="text-[11px] font-medium text-ink-tertiary tracking-[0.08em]">NAVIGATION</span>
              <button onClick={() => setShowNav(false)} className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            <div className="flex-1 px-7 py-6 space-y-1">
              <a href="/" className="block py-3 text-[12px] text-ink-primary font-light uppercase tracking-[0.08em] border-b border-border-subtle">Calendar</a>
              <a href="/guests" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Guests</a>
              <a href="/team" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Team</a>
              <a href="/expenses" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Expenses</a>
              <a href="/insights" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Insights</a>
              <a href="/invoice" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Invoices</a>
              <a href="/admin" className="block py-3 text-[12px] text-ink-secondary font-light uppercase tracking-[0.08em] hover:text-ink-primary border-b border-border-subtle transition-colors">Admin</a>
            </div>
          </nav>
        </>
      )}
    </div>
    </PasswordGate>
  );
}
