"use client";

import { useState } from "react";
import { RIAD_ROOMS, ALL_ROOMS, BOOKING_SOURCES, getSourceColor, getSourceTextColor } from "@/lib/constants";
import type { Booking } from "@/types/booking";
import { useToast } from "@/components/ToastProvider";

interface ViewEditBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export default function ViewEditBookingModal({ booking, onClose, onSaved }: ViewEditBookingModalProps) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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
    reviewScore: "",
    reviewText: "",
  });
  const [savingBooking, setSavingBooking] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [includePaymentLink, setIncludePaymentLink] = useState(false);

  const startEditing = () => {
    setEditForm({
      firstName: booking.firstName || booking.guestName.split(" ")[0] || "",
      lastName: booking.lastName || booking.guestName.split(" ").slice(1).join(" ") || "",
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      email: booking.email || "",
      phone: booking.phone || "",
      source: booking.source,
      room: booking.room,
      country: booking.country || "",
      language: booking.language || "",
      notes: booking.notes || "",
      reviewScore: "",
      reviewText: "",
    });
    setIsEditing(true);
  };

  const saveEditedBooking = async () => {
    if (booking.rowIndex === undefined) {
      toast.error("Cannot update booking — missing row index");
      return;
    }

    if (!editForm.firstName || !editForm.checkIn || !editForm.checkOut) {
      toast.error("Please fill in name, check-in, and check-out");
      return;
    }

    setSavingBooking(true);

    try {
      const property = RIAD_ROOMS.includes(editForm.room) ? "The Riad" : "The Douaria";
      const checkIn = new Date(editForm.checkIn);
      const checkOut = new Date(editForm.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: booking.rowIndex,
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
        if (editForm.reviewScore && parseFloat(editForm.reviewScore) > 0) {
          try {
            await fetch("/api/reviews/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                guestName: `${editForm.firstName} ${editForm.lastName}`.trim(),
                reservationNumber: booking.id,
                reviewScore: editForm.reviewScore,
                reviewText: editForm.reviewText,
                checkIn: editForm.checkIn,
                source: editForm.source,
              }),
            });
          } catch {
            // non-fatal
          }
        }
        await onSaved();
        onClose();
      } else {
        const errorData = await res.json();
        toast.error("Failed to update booking: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setSavingBooking(false);
    }
  };

  const requestDelete = () => {
    if (booking.rowIndex === undefined) {
      toast.error("Cannot delete booking — missing row index");
      return;
    }
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      window.setTimeout(() => setConfirmingDelete((c) => (c ? false : c)), 4000);
      return;
    }
    setConfirmingDelete(false);
    void deleteBooking();
  };

  const deleteBooking = async () => {
    setDeletingBooking(true);

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: booking.rowIndex,
        }),
      });

      if (res.ok) {
        await onSaved();
        onClose();
      } else {
        const errorData = await res.json();
        toast.error("Failed to delete booking: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    } finally {
      setDeletingBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/15 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
      <div className="bg-white shadow-lg w-full max-w-lg mx-4 modal-panel">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[18px] text-ink-primary">
              {isEditing ? "Edit Booking" : "Booking Details"}
            </h2>
            <button
              onClick={() => {
                onClose();
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

              {/* Review score + text (useful for Airbnb, optional) */}
              <div className="pt-3 border-t border-border-subtle space-y-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-ink-tertiary font-light">Review (optional)</p>
                <div>
                  <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                    Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={editForm.reviewScore}
                    onChange={(e) => setEditForm({ ...editForm, reviewScore: e.target.value })}
                    placeholder="e.g. 9.5"
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-ink-secondary uppercase tracking-wide mb-1.5">
                    Review text
                  </label>
                  <textarea
                    value={editForm.reviewText}
                    onChange={(e) => setEditForm({ ...editForm, reviewText: e.target.value })}
                    rows={3}
                    placeholder="Paste the guest's review here..."
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg text-[13px] focus:outline-none focus:border-border-strong resize-none"
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
                <div className={`${getSourceColor(booking.source)} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <span className={`${getSourceTextColor(booking.source)} font-medium text-[15px]`}>
                    {booking.guestName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-[15px] font-light text-ink-primary uppercase tracking-[0.04em]">{booking.guestName}</h3>
                  <p className="text-[13px] text-ink-secondary">{booking.room}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Check-in</div>
                  <div className="text-[13px] text-ink-primary">{booking.checkIn}</div>
                </div>
                <div>
                  <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Check-out</div>
                  <div className="text-[13px] text-ink-primary">{booking.checkOut}</div>
                </div>
                <div>
                  <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Nights</div>
                  <div className="text-[13px] text-ink-primary">{booking.nights}</div>
                </div>
                <div>
                  <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Source</div>
                  <div className="text-[13px] text-ink-primary">{booking.source}</div>
                </div>
                {booking.arrivalTime && (
                  <div>
                    <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Arrival</div>
                    <div className="text-[13px] text-ink-primary">{booking.arrivalTime}</div>
                  </div>
                )}
              </div>

              {/* Contact row */}
              {(booking.phone || booking.email) && (
                <div className="flex items-center gap-3 pt-3 border-t border-border-subtle">
                  {booking.phone && (
                    <a
                      href={`https://wa.me/${booking.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] h-[34px] px-3 border border-border text-ink-secondary hover:text-ink-primary hover:border-ink-tertiary transition-colors font-light"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                  {booking.email && (
                    <a
                      href={`mailto:${booking.email}`}
                      className="inline-flex items-center gap-1.5 text-[11px] h-[34px] px-3 border border-border text-ink-secondary hover:text-ink-primary hover:border-ink-tertiary transition-colors font-light"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </a>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border-subtle">
                {booking.country && (
                  <div>
                    <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Country</div>
                    <div className="text-[13px] text-ink-primary">{booking.country}</div>
                  </div>
                )}
                {booking.language && (
                  <div>
                    <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Language</div>
                    <div className="text-[13px] text-ink-primary">{booking.language}</div>
                  </div>
                )}
                {booking.notes && (
                  <div className="col-span-2">
                    <div className="text-[11px] text-ink-tertiary uppercase tracking-wide mb-1">Notes</div>
                    <div className="text-[13px] text-ink-primary whitespace-pre-wrap">{booking.notes}</div>
                  </div>
                )}
              </div>

              {/* Send Confirmation Section - Only for Direct bookings */}
              {(booking.email || booking.phone) &&
               booking.status !== "blocked" &&
               !booking.source.toLowerCase().includes("booking") &&
               !booking.source.toLowerCase().includes("airbnb") && (
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
                    {booking.email && (
                      <button
                        onClick={() => {
                          const firstName = booking.firstName || booking.guestName.split(" ")[0];
                          const subject = encodeURIComponent(`Booking Confirmation - Riad di Siena`);
                          const paymentSection = includePaymentLink
                            ? `\n\nTo complete your booking, please make your payment via PayPal:\nhttps://www.paypal.com/paypalme/riaddisiena\n`
                            : '';
                          const body = encodeURIComponent(
`Dear ${firstName},

Thank you for your booking at Riad di Siena!

Here are your reservation details:

Room: ${booking.room}
Check-in: ${new Date(booking.checkIn).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
Check-out: ${new Date(booking.checkOut).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
Nights: ${booking.nights}${paymentSection}

We look forward to welcoming you!

Warm regards,
Riad di Siena`
                          );
                          window.open(`mailto:${booking.email}?subject=${subject}&body=${body}`, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-parchment hover:bg-linen rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[12px] font-medium text-ink-secondary">Email</span>
                      </button>
                    )}

                    {booking.phone && (
                      <button
                        onClick={() => {
                          const firstName = booking.firstName || booking.guestName.split(" ")[0];
                          const phone = (booking.phone || "").replace(/[^0-9+]/g, "");
                          const paymentSection = includePaymentLink
                            ? `\n\n💳 *Payment link:*\nhttps://www.paypal.com/paypalme/riaddisiena`
                            : '';
                          const message = encodeURIComponent(
`Hello ${firstName}! 🌿

Your booking at *Riad di Siena* is confirmed:

🏠 *${booking.room}*
📅 ${new Date(booking.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(booking.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
🌙 ${booking.nights} night${booking.nights > 1 ? 's' : ''}${paymentSection}

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
                onClick={requestDelete}
                disabled={deletingBooking}
                className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  confirmingDelete
                    ? "bg-brick/10 text-brick"
                    : "text-brick hover:bg-brick/10"
                }`}
              >
                {deletingBooking ? "Deleting..." : confirmingDelete ? "Tap to confirm" : "Delete"}
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
  );
}
