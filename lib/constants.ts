// Canonical room lists
export const RIAD_ROOMS = ["Hidden Gem", "Jewel Box", "Trésor Caché"];
export const DOUARIA_ROOMS = ["Bliss", "Joy", "Love"];
export const ALL_ROOMS = [...RIAD_ROOMS, ...DOUARIA_ROOMS];

// Source options for new bookings
export const BOOKING_SOURCES = ["Website", "WhatsApp", "Direct", "Email", "Airbnb", "Booking.com", "Other"];

// Booking source colors — muted premium palette
export const getSourceColor = (source: string): string => {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("blackout") || s.includes("blocked")) return "bg-[#3D3832]";
  if (s.includes("airbnb")) return "bg-[#CEAEA8]";
  if (s.includes("booking")) return "bg-[#A2B4BF]";
  if (s.includes("website")) return "bg-[#C5AD84]";
  return "bg-[#A3AD95]";
};

export const getSourceTextColor = (source: string): string => {
  const s = (source || "").trim().toLowerCase();
  if (s.includes("blackout") || s.includes("blocked")) return "text-[#E8E4DF]";
  if (s.includes("airbnb")) return "text-[#4A3530]";
  if (s.includes("booking")) return "text-[#2E3E47]";
  if (s.includes("website")) return "text-[#3E3318]";
  return "text-[#2E3A28]";
};
