"use client";

import { useState, useMemo } from "react";
import { RIAD_ROOMS, ALL_ROOMS, BOOKING_SOURCES, getSourceColor } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";

const toDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface NewBookingModalProps {
  initialRoom: string;
  initialDate: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export default function NewBookingModal({ initialRoom, initialDate, onClose, onSaved }: NewBookingModalProps) {
  const toast = useToast();
  const [newBookingForm, setNewBookingForm] = useState({
    firstName: "",
    lastName: "",
    checkIn: initialDate,
    checkOut: "",
    email: "",
    phone: "",
    country: "",
    language: "",
    notes: "",
    source: "Direct",
    room: initialRoom,
    isBlackout: false,
    totalEur: "",
    ratePerNight: "",
  });
  const [savingBooking, setSavingBooking] = useState(false);
  const [newBookingCalendarMonth, setNewBookingCalendarMonth] = useState(() => {
    const d = initialDate ? new Date(initialDate + "T12:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectingDate, setSelectingDate] = useState<"checkIn" | "checkOut">(initialDate ? "checkOut" : "checkIn");

  const newBookingCalendarDays = useMemo(() => {
    const { year, month } = newBookingCalendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [newBookingCalendarMonth]);

  const saveNewBooking = async () => {
    if (!newBookingForm.checkIn || !newBookingForm.checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (!newBookingForm.isBlackout && !newBookingForm.firstName) {
      toast.error("Please enter guest name");
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
        await onSaved();
        onClose();
      } else {
        const errorData = await res.json();
        toast.error("Failed to save booking: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      toast.error("Failed to save booking");
    } finally {
      setSavingBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/15 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
      <div className="bg-white shadow-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden modal-panel">
        {/* Source color strip */}
        <div className={`h-1 w-full ${getSourceColor(newBookingForm.isBlackout ? "blocked" : newBookingForm.source)} transition-colors duration-300`} />
        {/* Header */}
        <div className="px-7 py-5 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-medium text-ink-primary tracking-[0.02em]">New Booking</h2>
            <button
              onClick={onClose}
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
                <span className="text-[10px] text-ink-tertiary uppercase tracking-[0.08em]">Stay</span>
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
            onClick={onClose}
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
  );
}
