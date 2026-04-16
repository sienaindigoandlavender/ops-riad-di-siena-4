"use client";

import { useState } from "react";

interface PoliceRegistrationFormProps {
  bookingId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  onClose: () => void;
}

export default function PoliceRegistrationForm({
  bookingId,
  guestName,
  checkIn,
  checkOut,
  guestCount,
  onClose,
}: PoliceRegistrationFormProps) {
  const [guest1IdFile, setGuest1IdFile] = useState<File | null>(null);
  const [guest1StampFile, setGuest1StampFile] = useState<File | null>(null);
  const [guest2IdFile, setGuest2IdFile] = useState<File | null>(null);
  const [guest2StampFile, setGuest2StampFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    setter(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // In a real implementation, you would upload files to cloud storage
    // and save references to the database
    // For now, we'll simulate a save
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSaving(false);
    setSaved(true);
    
    // Close after showing success
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const showGuest2 = guestCount >= 2;

  return (
    <div className="fixed inset-0 bg-parchment0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border-subtle px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-ink-primary">Police Registration</h2>
            <p className="text-[11px] text-ink-tertiary mt-0.5">Upload passport & entry stamp</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-parchment"
          >
            <svg className="w-5 h-5 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {saved ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-ink-primary">Documents Saved</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Booking Info - Read Only */}
            <div className="bg-bone rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">Booking ID</p>
                  <p className="text-[13px] font-medium text-ink-primary mt-0.5">{bookingId}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">Guest Name</p>
                  <p className="text-[13px] font-medium text-ink-primary mt-0.5">{guestName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">Check-In</p>
                  <p className="text-[13px] text-ink-body mt-0.5">{formatDate(checkIn)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">Check-Out</p>
                  <p className="text-[13px] text-ink-body mt-0.5">{formatDate(checkOut)}</p>
                </div>
              </div>
            </div>

            {/* Guest 1 Documents */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-linen flex items-center justify-center text-[10px] font-bold">1</span>
                Guest 1
              </h3>
              
              {/* ID/Passport */}
              <div>
                <label className="block text-[12px] text-ink-secondary mb-1.5">
                  Passport / ID Page
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, setGuest1IdFile)}
                    className="hidden"
                    id="guest1-id"
                  />
                  <label
                    htmlFor="guest1-id"
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      guest1IdFile
                        ? "border-sage/40 bg-sage/10"
                        : "border-border-subtle hover:border-border"
                    }`}
                  >
                    {guest1IdFile ? (
                      <>
                        <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[12px] text-forest truncate max-w-[200px]">{guest1IdFile.name}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[12px] text-ink-tertiary">Upload identification page</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Entry Stamp */}
              <div>
                <label className="block text-[12px] text-ink-secondary mb-1.5">
                  Entry Stamp Page
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, setGuest1StampFile)}
                    className="hidden"
                    id="guest1-stamp"
                  />
                  <label
                    htmlFor="guest1-stamp"
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      guest1StampFile
                        ? "border-sage/40 bg-sage/10"
                        : "border-border-subtle hover:border-border"
                    }`}
                  >
                    {guest1StampFile ? (
                      <>
                        <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[12px] text-forest truncate max-w-[200px]">{guest1StampFile.name}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[12px] text-ink-tertiary">Upload police stamp page</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Guest 2 Documents */}
            {showGuest2 && (
              <div className="space-y-3 pt-3 border-t border-border-subtle">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-linen flex items-center justify-center text-[10px] font-bold">2</span>
                  Guest 2
                </h3>
                
                {/* ID/Passport */}
                <div>
                  <label className="block text-[12px] text-ink-secondary mb-1.5">
                    Passport / ID Page
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setGuest2IdFile)}
                      className="hidden"
                      id="guest2-id"
                    />
                    <label
                      htmlFor="guest2-id"
                      className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        guest2IdFile
                          ? "border-sage/40 bg-sage/10"
                          : "border-border-subtle hover:border-border"
                      }`}
                    >
                      {guest2IdFile ? (
                        <>
                          <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-[12px] text-forest truncate max-w-[200px]">{guest2IdFile.name}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[12px] text-ink-tertiary">Upload identification page</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Entry Stamp */}
                <div>
                  <label className="block text-[12px] text-ink-secondary mb-1.5">
                    Entry Stamp Page
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setGuest2StampFile)}
                      className="hidden"
                      id="guest2-stamp"
                    />
                    <label
                      htmlFor="guest2-stamp"
                      className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        guest2StampFile
                          ? "border-sage/40 bg-sage/10"
                          : "border-border-subtle hover:border-border"
                      }`}
                    >
                      {guest2StampFile ? (
                        <>
                          <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-[12px] text-forest truncate max-w-[200px]">{guest2StampFile.name}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-[12px] text-ink-tertiary">Upload police stamp page</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-accent text-cream text-[13px] font-medium rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Documents"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
