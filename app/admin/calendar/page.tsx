"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

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
}

interface Room {
  id: string;
  name: string;
  property: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "Booking.com": "bg-[#A8BDC8]", // Powder blue
  "Booking": "bg-[#A8BDC8]",     // Powder blue (alternate)
  "booking.com": "bg-[#A8BDC8]", // Powder blue (lowercase)
  "booking": "bg-[#A8BDC8]",     // Powder blue (lowercase)
  "Airbnb": "bg-[#C9A5A0]",      // Brick red/rose
  "airbnb": "bg-[#C9A5A0]",      // Brick red (lowercase)
  "Direct": "bg-[#9DA88F]",      // Olive green
  "direct": "bg-[#9DA88F]",      // Olive green (lowercase)
};

const SOURCE_TEXT_COLORS: Record<string, string> = {
  "Booking.com": "text-[#4A5C66]", // Dark blue text
  "Booking": "text-[#4A5C66]",     // Dark blue text
  "booking.com": "text-[#4A5C66]", // Dark blue text
  "booking": "text-[#4A5C66]",     // Dark blue text
  "Airbnb": "text-[#6B4E3D]",      // Dark rose text
  "airbnb": "text-[#6B4E3D]",      // Dark rose text
  "Direct": "text-[#4A5440]",      // Dark olive text
  "direct": "text-[#4A5440]",      // Dark olive text
};

// Helper to get color with flexible matching
const getSourceColor = (source: string): string => {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("blackout") || s.includes("blocked")) return "bg-[#5C4F45]";  // Dark gray
  if (s.includes("airbnb")) return "bg-[#C9A5A0]";      // Brick red
  if (s.includes("direct")) return "bg-[#9DA88F]";      // Olive green
  return "bg-[#A8BDC8]";                                 // Default: Powder blue (Booking.com)
};

const getSourceTextColor = (source: string): string => {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("blackout") || s.includes("blocked")) return "text-ink-inverse"; // Light text
  if (s.includes("airbnb")) return "text-[#6B4E3D]";    // Dark rose
  if (s.includes("direct")) return "text-[#4A5440]";    // Dark olive
  return "text-[#4A5C66]";                               // Default: Dark blue
};

// Parse individual room names from a booking (handles "Bliss / Joy / Hidden Gem")
const parseRoomNames = (roomStr: string): string[] => {
  if (!roomStr) return [];
  // Split by "/" or "+" and trim whitespace
  return roomStr.split(/[\/\+]/).map(r => r.trim()).filter(Boolean);
};

// Canonical room list for The Riad and The Douaria
const RIAD_ROOMS = ["Hidden Gem", "Jewel Box", "Trésor Caché"];
const DOUARIA_ROOMS = ["Bliss", "Joy", "Love"];

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 3);
    return today;
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newBooking, setNewBooking] = useState<{room: string; date: string} | null>(null);
  const [newBookingForm, setNewBookingForm] = useState({
    firstName: "",
    lastName: "",
    checkIn: "",
    checkOut: "",
    email: "",
    phone: "",
    source: "Direct",
    room: "",
    isBlackout: false,
  });
  const [savingBooking, setSavingBooking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const DAYS_TO_SHOW = 42;

  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, [startDate]);

  // Fetch bookings and use canonical rooms
  useEffect(() => {
    fetch(`/api/admin/bookings?_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const allBookings = (data.bookings || []).map((b: any) => ({
          id: b.Booking_ID || b.booking_id,
          guestName: [b.firstName || b.first_name, b.lastName || b.last_name].filter(Boolean).join(" "),
          room: b.room || "",
          property: b.property || "The Riad",
          checkIn: b.checkIn || b.check_in,
          checkOut: b.checkOut || b.check_out,
          nights: parseInt(b.nights || "1", 10),
          source: b.source || "Direct",
          status: b.status || "",
        }));

        // Deduplicate bookings by id (but keep bookings without id)
        const bookingMap = new Map<string, Booking>();
        const bookingsWithoutId: Booking[] = [];
        
        for (const b of allBookings) {
          if (b.id && b.id.trim()) {
            bookingMap.set(b.id, b);
          } else {
            bookingsWithoutId.push(b);
          }
        }
        const deduped = [...Array.from(bookingMap.values()), ...bookingsWithoutId];

        // Filter out cancelled
        const filtered = deduped.filter((b: Booking) => {
          const s = (b.status || "").toLowerCase();
          return s !== "cancelled" && s !== "canceled";
        });

        setBookings(filtered);

        // Use canonical room list instead of extracting from bookings
        const roomList: Room[] = [
          ...RIAD_ROOMS.map(name => ({
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            property: "The Riad",
          })),
          ...DOUARIA_ROOMS.map(name => ({
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            property: "The Douaria",
          })),
        ];

        setRooms(roomList);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch bookings:", e);
        setLoading(false);
      });
  }, []);

  // Scroll to today
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const todayIndex = dates.findIndex((d) => isToday(d));
      if (todayIndex > 0) {
        scrollRef.current.scrollLeft = Math.max(0, (todayIndex - 2) * 48);
      }
    }
  }, [loading, dates]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short" });
  };

  const getBookingForCell = (room: Room, date: Date): Booking | null => {
    const dateStr = date.toISOString().split("T")[0];
    
    const found = bookings.find((b) => {
      // Check if this booking includes this room (handles bundles like "Bliss / Joy")
      const bookingRooms = parseRoomNames(b.room);
      const roomMatches = bookingRooms.some(br => 
        br.toLowerCase() === room.name.toLowerCase() ||
        room.name.toLowerCase().includes(br.toLowerCase()) ||
        br.toLowerCase().includes(room.name.toLowerCase())
      );
      
      if (!roomMatches) return false;
      if (!b.checkIn || !b.checkOut) return false;
      
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      const current = new Date(dateStr);
      
      return current >= checkIn && current < checkOut;
    }) || null;
    
    return found;
  };

  const isBookingStart = (room: Room, date: Date, booking: Booking): boolean => {
    const checkIn = new Date(booking.checkIn);
    return date.toDateString() === checkIn.toDateString();
  };

  const getBookingSpan = (booking: Booking, startCellDate: Date): number => {
    const checkOut = new Date(booking.checkOut);
    const endDate = dates[dates.length - 1];
    const visibleEnd = checkOut > endDate ? endDate : checkOut;
    const diffTime = visibleEnd.getTime() - startCellDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const goBack = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 14);
    setStartDate(newStart);
  };

  const goForward = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 14);
    setStartDate(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    today.setDate(today.getDate() - 3);
    setStartDate(today);
  };

  // Handle clicking an empty cell
  const handleEmptyCellClick = (room: Room, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    setNewBooking({ room: room.name, date: dateStr });
    setNewBookingForm({
      firstName: "",
      lastName: "",
      checkIn: dateStr,
      checkOut: (() => {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        return next.toISOString().split("T")[0];
      })(),
      email: "",
      phone: "",
      source: "Direct",
      room: room.name,
      isBlackout: false,
    });
  };

  // Save new booking (direct or blackout)
  const saveNewBooking = async () => {
    if (!newBooking) return;
    
    // Validation - blackouts need less info
    if (newBookingForm.isBlackout) {
      if (!newBookingForm.checkIn || !newBookingForm.checkOut) return;
    } else {
      if (!newBookingForm.firstName || !newBookingForm.checkIn || !newBookingForm.checkOut || !newBookingForm.phone) return;
    }
    
    // Use the room from form (can be changed)
    const selectedRoom = newBookingForm.room || newBooking.room;
    
    // Determine property based on room
    const property = RIAD_ROOMS.includes(selectedRoom) ? "The Riad" : "The Douaria";
    
    // Calculate nights
    const checkIn = new Date(newBookingForm.checkIn);
    const checkOut = new Date(newBookingForm.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    setSavingBooking(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: selectedRoom,
          property: property,
          firstName: newBookingForm.isBlackout ? "BLOCKED" : newBookingForm.firstName,
          lastName: newBookingForm.isBlackout ? "" : newBookingForm.lastName,
          check_in: newBookingForm.checkIn,
          check_out: newBookingForm.checkOut,
          nights: nights.toString(),
          email: newBookingForm.email,
          phone: newBookingForm.phone,
          source: newBookingForm.isBlackout ? "Blackout" : newBookingForm.source,
          status: newBookingForm.isBlackout ? "blocked" : "confirmed",
        }),
      });

      if (res.ok) {
        // Refresh bookings
        const data = await fetch("/api/admin/bookings").then(r => r.json());
        const allBookings = (data.bookings || []).map((b: any) => ({
          id: b.Booking_ID || b.booking_id,
          guestName: [b.firstName || b.first_name, b.lastName || b.last_name].filter(Boolean).join(" ") || "BLOCKED",
          room: b.room || "",
          property: b.property || "The Riad",
          checkIn: b.checkIn || b.check_in,
          checkOut: b.checkOut || b.check_out,
          nights: parseInt(b.nights || "1", 10),
          source: b.source || "Direct",
          status: b.status || "",
        }));
        const bookingMap = new Map<string, Booking>();
        for (const b of allBookings) {
          if (b.id) bookingMap.set(b.id, b);
        }
        const filtered = Array.from(bookingMap.values()).filter((b: Booking) => {
          const s = (b.status || "").toLowerCase();
          return s !== "cancelled" && s !== "canceled";
        });
        setBookings(filtered);
        setNewBooking(null);
      }
    } catch (e) {
      console.error("Error saving booking:", e);
    } finally {
      setSavingBooking(false);
    }
  };

  // Group rooms by property
  const riadRooms = rooms.filter((r) => r.property === "The Riad");
  const douariaRooms = rooms.filter((r) => r.property === "The Douaria");

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border-subtle border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink-primary">
      <header className="border-b border-border-subtle py-5 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">Admin</p>
            <h1 className="font-serif text-[22px] text-ink-primary">Availability</h1>
          </div>
          <Link href="/admin" className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-tertiary hover:text-ink-primary transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={goBack} className="px-3 py-2 rounded-lg border border-border-subtle hover:border-border transition-colors text-[13px] text-ink-body">
              ← 2 weeks
            </button>
            <button onClick={goToToday} className="px-3 py-2 rounded-lg border border-border-subtle hover:border-border transition-colors text-[13px] text-ink-body">
              Today
            </button>
            <button onClick={goForward} className="px-3 py-2 rounded-lg border border-border-subtle hover:border-border transition-colors text-[13px] text-ink-body">
              2 weeks →
            </button>
            <button 
              onClick={() => {
                setLoading(true);
                fetch(`/api/admin/bookings?_t=${Date.now()}`, { cache: 'no-store' })
                  .then((r) => r.json())
                  .then((data) => {
                    const allBookings = (data.bookings || []).map((b: any) => ({
                      id: b.Booking_ID || b.booking_id,
                      guestName: [b.firstName || b.first_name, b.lastName || b.last_name].filter(Boolean).join(" "),
                      room: b.room || "",
                      property: b.property || "The Riad",
                      checkIn: b.checkIn || b.check_in,
                      checkOut: b.checkOut || b.check_out,
                      nights: parseInt(b.nights || "1", 10),
                      source: b.source || "Direct",
                      status: b.status || "",
                    }));
                    const bookingMap = new Map<string, Booking>();
                    for (const b of allBookings) {
                      if (b.id) bookingMap.set(b.id, b);
                    }
                    const filtered = Array.from(bookingMap.values()).filter((b: Booking) => {
                      const s = (b.status || "").toLowerCase();
                      return s !== "cancelled" && s !== "canceled";
                    });
                    setBookings(filtered);
                    setLoading(false);
                  })
                  .catch(() => setLoading(false));
              }} 
              className="px-3 py-2 rounded-lg border border-border-subtle hover:border-border transition-colors text-[13px] text-ink-body"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#A8BDC8]" />
              <span className="text-ink-secondary">Booking.com</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#C9A5A0]" />
              <span className="text-ink-secondary">Airbnb</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#9DA88F]" />
              <span className="text-ink-secondary">Direct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#5C4F45]" />
              <span className="text-ink-secondary">Blocked</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-lg overflow-hidden">
          <div className="flex">
            {/* Room Labels */}
            <div className="flex-shrink-0 w-40 border-r border-border-subtle">
              <div className="h-8 border-b border-border-subtle" />
              <div className="h-12 border-b border-border-subtle" />

              {riadRooms.length > 0 && (
                <>
                  <div className="h-8 bg-bone border-b border-border-subtle flex items-center px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">The Riad</span>
                  </div>
                  {riadRooms.map((room) => (
                    <div key={room.id} className="h-12 border-b border-border-subtle flex items-center px-3">
                      <span className="text-[13px] text-ink-body truncate">{room.name}</span>
                    </div>
                  ))}
                </>
              )}

              {douariaRooms.length > 0 && (
                <>
                  <div className="h-8 bg-bone border-b border-border-subtle flex items-center px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">The Douaria</span>
                  </div>
                  {douariaRooms.map((room) => (
                    <div key={room.id} className="h-12 border-b border-border-subtle flex items-center px-3">
                      <span className="text-[13px] text-ink-body truncate">{room.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Calendar Grid */}
            <div ref={scrollRef} className="flex-1 overflow-x-auto">
              {/* Month Row */}
              <div className="flex h-8 border-b border-border-subtle sticky top-0 bg-white">
                {dates.map((date, idx) => {
                  const showMonth = idx === 0 || date.getDate() === 1;
                  return (
                    <div key={idx} className="w-12 flex-shrink-0 flex items-center justify-center border-r border-border-subtle">
                      {showMonth && <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">{formatMonth(date)}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Date Row */}
              <div className="flex h-12 border-b border-border-subtle">
                {dates.map((date, idx) => (
                  <div
                    key={idx}
                    className={`w-12 flex-shrink-0 flex flex-col items-center justify-center border-r border-border-subtle ${
                      isToday(date) ? "bg-gold/10" : isWeekend(date) ? "bg-bone" : ""
                    }`}
                  >
                    <span className="text-[10px] text-ink-tertiary">{date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}</span>
                    <span className={`text-[13px] ${isToday(date) ? "text-gold font-semibold" : "text-ink-body"}`}>{date.getDate()}</span>
                  </div>
                ))}
              </div>

              {/* The Riad */}
              {riadRooms.length > 0 && (
                <>
                  <div className="h-8 bg-bone border-b border-border-subtle" />
                  {riadRooms.map((room) => (
                    <div key={room.id} className="flex h-12 border-b border-border-subtle relative">
                      {dates.map((date, idx) => {
                        const booking = getBookingForCell(room, date);
                        const isStart = booking && isBookingStart(room, date, booking);
                        const isEmpty = !booking;
                        return (
                          <div
                            key={idx}
                            onClick={() => isEmpty && handleEmptyCellClick(room, date)}
                            className={`w-12 flex-shrink-0 border-r border-border-subtle relative ${
                              isToday(date) ? "bg-gold/10/50" : isWeekend(date) ? "bg-bone" : ""
                            } ${isEmpty ? "cursor-pointer hover:bg-parchment" : ""}`}
                          >
                            {isStart && booking && (
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className={`absolute top-1 left-0.5 h-10 rounded-sm flex items-center px-2 overflow-hidden z-10 hover:brightness-95 transition-all ${
                                  getSourceColor(booking.source)
                                }`}
                                style={{ width: `${getBookingSpan(booking, date) * 48 - 4}px` }}
                              >
                                <span className={`text-[11px] font-medium truncate ${getSourceTextColor(booking.source)}`}>{booking.guestName}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}

              {/* The Douaria */}
              {douariaRooms.length > 0 && (
                <>
                  <div className="h-8 bg-bone border-b border-border-subtle" />
                  {douariaRooms.map((room) => (
                    <div key={room.id} className="flex h-12 border-b border-border-subtle relative">
                      {dates.map((date, idx) => {
                        const booking = getBookingForCell(room, date);
                        const isStart = booking && isBookingStart(room, date, booking);
                        const isEmpty = !booking;
                        return (
                          <div
                            key={idx}
                            onClick={() => isEmpty && handleEmptyCellClick(room, date)}
                            className={`w-12 flex-shrink-0 border-r border-border-subtle relative ${
                              isToday(date) ? "bg-gold/10/50" : isWeekend(date) ? "bg-bone" : ""
                            } ${isEmpty ? "cursor-pointer hover:bg-parchment" : ""}`}
                          >
                            {isStart && booking && (
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className={`absolute top-1 left-0.5 h-10 rounded-sm flex items-center px-2 overflow-hidden z-10 hover:brightness-95 transition-all ${
                                  getSourceColor(booking.source)
                                }`}
                                style={{ width: `${getBookingSpan(booking, date) * 48 - 4}px` }}
                              >
                                <span className={`text-[11px] font-medium truncate ${getSourceTextColor(booking.source)}`}>{booking.guestName}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          {(() => {
            const today = new Date();
            const totalRooms = rooms.length;
            if (totalRooms === 0) return <div className="col-span-4 text-center text-ink-secondary py-8">No rooms found in bookings</div>;

            const occupiedToday = rooms.filter((room) => getBookingForCell(room, today)).length;
            let occupied7 = 0;
            for (let i = 0; i < 7; i++) {
              const d = new Date(today.getTime() + i * 86400000);
              occupied7 += rooms.filter((room) => getBookingForCell(room, d)).length;
            }
            let occupied30 = 0;
            for (let i = 0; i < 30; i++) {
              const d = new Date(today.getTime() + i * 86400000);
              occupied30 += rooms.filter((room) => getBookingForCell(room, d)).length;
            }

            return (
              <>
                <div className="bg-white border border-border-subtle rounded-lg p-4">
                  <p className="text-[28px] font-serif text-ink-primary">{occupiedToday}/{totalRooms}</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Occupied Tonight</p>
                </div>
                <div className="bg-white border border-border-subtle rounded-lg p-4">
                  <p className="text-[28px] font-serif text-ink-primary">{totalRooms - occupiedToday}</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Available Tonight</p>
                </div>
                <div className="bg-white border border-border-subtle rounded-lg p-4">
                  <p className="text-[28px] font-serif text-ink-primary">{Math.round((occupied7 / (totalRooms * 7)) * 100)}%</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Next 7 Days</p>
                </div>
                <div className="bg-white border border-border-subtle rounded-lg p-4">
                  <p className="text-[28px] font-serif text-ink-primary">{Math.round((occupied30 / (totalRooms * 30)) * 100)}%</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">Next 30 Days</p>
                </div>
              </>
            );
          })()}
        </div>
      </main>

      {/* Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-[#2B2623]/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-lg max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-lg border-b border-border-subtle px-5 py-5 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-1 h-12 rounded-full ${getSourceColor(selectedBooking.source)}`} />
                <div>
                  <h3 className="font-serif text-[18px] text-ink-primary">{selectedBooking.guestName}</h3>
                  <p className="text-[13px] text-ink-secondary">{selectedBooking.room}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-ink-tertiary hover:text-ink-secondary transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">Check-in</span>
                <span className="text-[13px] text-ink-primary">{new Date(selectedBooking.checkIn).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">Check-out</span>
                <span className="text-[13px] text-ink-primary">{new Date(selectedBooking.checkOut).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">Nights</span>
                <span className="text-[13px] text-ink-primary">{selectedBooking.nights}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">Source</span>
                <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded-full ${
                  selectedBooking.source === "Booking.com" ? "bg-dusty/10 text-accent-strong" :
                  selectedBooking.source === "Airbnb" ? "bg-rose-50 text-rose-600" : "bg-sage/10 text-sage"
                }`}>{selectedBooking.source}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <Link href="/guests" className="flex-1 text-center text-[11px] uppercase tracking-[0.08em] font-semibold border border-border rounded-lg py-3 hover:bg-accent hover:text-cream transition-colors">
                Guest Dashboard
              </Link>
              <button onClick={() => setSelectedBooking(null)} className="flex-1 text-[11px] uppercase tracking-[0.08em] font-semibold bg-accent text-cream rounded-lg py-3 hover:bg-accent-strong transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {newBooking && (
        <div className="fixed inset-0 bg-[#2B2623]/40 flex items-center justify-center z-50 p-4" onClick={() => setNewBooking(null)}>
          <div className="bg-white rounded-lg max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-lg border-b border-border-subtle px-5 py-5 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-1 h-12 rounded-full ${newBookingForm.isBlackout ? 'bg-[#5C4F45]' : 'bg-[#9DA88F]'}`} />
                <div>
                  <h3 className="font-serif text-[18px] text-ink-primary">{newBookingForm.isBlackout ? 'Block Dates' : 'New Reservation'}</h3>
                  <p className="text-[13px] text-ink-secondary">{newBookingForm.room || newBooking.room}</p>
                </div>
              </div>
              <button onClick={() => setNewBooking(null)} className="text-ink-tertiary hover:text-ink-secondary transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-5">
              {/* Blackout Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBookingForm.isBlackout}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, isBlackout: e.target.checked })}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-[13px] text-ink-body">Block dates (no guest)</span>
                </label>
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">Room *</label>
                <select
                  value={newBookingForm.room || newBooking.room}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, room: e.target.value })}
                  className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                >
                  <optgroup label="The Riad">
                    {RIAD_ROOMS.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </optgroup>
                  <optgroup label="The Douaria">
                    {DOUARIA_ROOMS.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Booking Source (hidden for blackouts) */}
              {!newBookingForm.isBlackout && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">Booking Source *</label>
                  <select
                    value={newBookingForm.source}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, source: e.target.value })}
                    className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                  >
                    <option value="Direct">Direct</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Airbnb">Airbnb</option>
                  </select>
                </div>
              )}

              {/* Guest name (hidden for blackouts) */}
              {!newBookingForm.isBlackout && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">First Name *</label>
                    <input
                      type="text"
                      value={newBookingForm.firstName}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, firstName: e.target.value })}
                      className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                      placeholder="Guest first name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">Last Name</label>
                    <input
                      type="text"
                      value={newBookingForm.lastName}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, lastName: e.target.value })}
                      className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                      placeholder="Guest last name"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">Check-in *</label>
                  <input
                    type="date"
                    value={newBookingForm.checkIn}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, checkIn: e.target.value })}
                    className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">Check-out *</label>
                  <input
                    type="date"
                    value={newBookingForm.checkOut}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, checkOut: e.target.value })}
                    className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                  />
                </div>
              </div>

              {/* Contact info (hidden for blackouts) */}
              {!newBookingForm.isBlackout && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={newBookingForm.phone}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, phone: e.target.value })}
                      className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">Email</label>
                    <input
                      type="email"
                      value={newBookingForm.email}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, email: e.target.value })}
                      className="w-full bg-transparent border-b border-border pb-2 text-[13px] focus:outline-none focus:border-border"
                      placeholder="guest@email.com"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <button 
                onClick={() => setNewBooking(null)} 
                className="flex-1 text-[11px] uppercase tracking-[0.08em] font-semibold border border-border rounded-lg py-3 hover:bg-accent hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveNewBooking}
                disabled={savingBooking || !newBookingForm.checkIn || !newBookingForm.checkOut || (!newBookingForm.isBlackout && (!newBookingForm.firstName || !newBookingForm.phone))}
                className={`flex-1 text-[11px] uppercase tracking-[0.08em] font-semibold rounded-lg py-3 disabled:opacity-50 transition-colors ${
                  newBookingForm.isBlackout 
                    ? 'bg-[#5C4F45] text-cream hover:bg-[#5a5a5a]' 
                    : 'bg-accent text-cream hover:bg-accent-strong'
                }`}
              >
                {savingBooking ? "Saving..." : newBookingForm.isBlackout ? "Block Dates" : "Add Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
