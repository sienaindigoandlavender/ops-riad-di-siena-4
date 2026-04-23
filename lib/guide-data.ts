// Marrakech Guide MVP — hardcoded content
// Will migrate to Supabase in Phase 2

export interface Place {
  slug: string;
  name: string;
  subtitle: string;
  whyItMatters: string;
  bestTime: string;
  durationMinutes: number;
  priceRange: string;
  practicalNotes: string;
  neighborhood: string;
  category: string;
  hiddenGem: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Essential {
  slug: string;
  title: string;
  content: string;
  category: string;
}

export interface DayPlan {
  slug: string;
  title: string;
  description: string;
  durationType: "half_day" | "full_day" | "two_day";
  stops: {
    placeSlug: string;
    timeSlug: string;
    transitionNote: string;
  }[];
}

export const CATEGORIES = [
  { slug: "food", name: "Food & Drink", icon: "☕" },
  { slug: "sights", name: "Sights & Culture", icon: "🏛" },
  { slug: "gardens", name: "Gardens & Outdoors", icon: "🌿" },
  { slug: "shopping", name: "Shopping & Souks", icon: "🧵" },
  { slug: "wellness", name: "Wellness", icon: "✦" },
];

export const NEIGHBORHOODS = [
  { slug: "medina", name: "Medina", description: "The old walled city. Dense, layered, magnetic. Where most of Marrakech happens.", walkingMinutes: 0 },
  { slug: "gueliz", name: "Guéliz", description: "The French-built new town. Wide avenues, galleries, modern cafés.", walkingMinutes: 20 },
  { slug: "mellah", name: "Mellah", description: "The historic Jewish quarter. Quieter, with its own character and the spice market.", walkingMinutes: 10 },
  { slug: "kasbah", name: "Kasbah", description: "The royal quarter. Saadian Tombs, El Badi Palace, calmer energy.", walkingMinutes: 15 },
  { slug: "palmeraie", name: "Palmeraie", description: "The palm grove on the city's edge. Resorts, gardens, desert light.", walkingMinutes: 30 },
];

export const PLACES: Place[] = [
  {
    slug: "cafe-des-epices",
    name: "Café des Épices",
    subtitle: "Spice square rooftop café",
    whyItMatters: "The best place to watch the Rahba Kedima spice square from above. Order mint tea, sit on the terrace, and watch the square wake up. Not the best food — come for the view and the calm.",
    bestTime: "Morning (9–11am) before crowds",
    durationMinutes: 40,
    priceRange: "€",
    practicalNotes: "Cash only. Stairs to rooftop are steep. No reservation needed.",
    neighborhood: "medina",
    category: "food",
    hiddenGem: false,
  },
  {
    slug: "le-jardin",
    name: "Le Jardin",
    subtitle: "Hidden garden restaurant in the medina",
    whyItMatters: "A genuine oasis. Lush courtyard with banana trees and birdsong, hidden behind an unmarked door in the souks. The food is solid Moroccan-Mediterranean. The real draw is the space itself — you forget you're in the medina.",
    bestTime: "Lunch (12–2pm)",
    durationMinutes: 75,
    priceRange: "€€",
    practicalNotes: "Reservation recommended for lunch. Located near Musée de la Photographie. Easy to walk past — look for the small sign.",
    neighborhood: "medina",
    category: "food",
    hiddenGem: false,
  },
  {
    slug: "nomad",
    name: "NOMAD",
    subtitle: "Modern Moroccan rooftop",
    whyItMatters: "Elevated Moroccan cuisine with Atlas Mountain views from the terrace. One of the few places in the medina where the food genuinely matches the setting. The spice market is right below.",
    bestTime: "Late lunch or sunset",
    durationMinutes: 90,
    priceRange: "€€",
    practicalNotes: "Reservations essential, especially for terrace. Card accepted.",
    neighborhood: "medina",
    category: "food",
    hiddenGem: false,
  },
  {
    slug: "atay-cafe",
    name: "Atay Café",
    subtitle: "Quiet medina tea house",
    whyItMatters: "Tiny, calm, and genuine. Run by a local family. The best mint tea in the medina, served with real attention. No tourist rush. A place to sit and breathe between souks.",
    bestTime: "Anytime",
    durationMinutes: 30,
    priceRange: "€",
    practicalNotes: "Cash only. Very small — might need to wait. Near Mouassine fountain.",
    neighborhood: "medina",
    category: "food",
    hiddenGem: true,
  },
  {
    slug: "jardin-majorelle",
    name: "Jardin Majorelle",
    subtitle: "Yves Saint Laurent's cobalt blue garden",
    whyItMatters: "The most famous garden in Morocco. The cobalt blue villa against cactus and bougainvillea is genuinely stunning. Go early — by 11am it becomes a queue. The YSL Museum next door is worth the separate ticket.",
    bestTime: "Opening time (8am) or last hour before close",
    durationMinutes: 90,
    priceRange: "€€",
    practicalNotes: "Buy tickets online to skip the line. Allow 20 minutes to walk from the medina or take a taxi (15 MAD).",
    neighborhood: "gueliz",
    category: "gardens",
    hiddenGem: false,
  },
  {
    slug: "le-jardin-secret",
    name: "Le Jardin Secret",
    subtitle: "Restored Islamic garden in the medina",
    whyItMatters: "Less famous than Majorelle but more peaceful. Two distinct gardens — one Islamic, one exotic — with restored riad architecture. The tower gives a rare aerial view of the medina rooftops.",
    bestTime: "Morning",
    durationMinutes: 60,
    priceRange: "€",
    practicalNotes: "In the Mouassine quarter. Climb the tower — it's worth the extra ticket. Quiet enough to read a book.",
    neighborhood: "medina",
    category: "gardens",
    hiddenGem: false,
  },
  {
    slug: "bahia-palace",
    name: "Bahia Palace",
    subtitle: "19th-century grand vizier's palace",
    whyItMatters: "The most accessible example of traditional Moroccan palace architecture. The painted ceilings and zellige tilework are extraordinary. Unlike most sights here, the scale is genuinely impressive — room after room of craftsmanship.",
    bestTime: "Early morning or late afternoon",
    durationMinutes: 60,
    priceRange: "€",
    practicalNotes: "Open 9am–5pm. The gardens are as important as the rooms. Can get crowded midday with tour groups.",
    neighborhood: "mellah",
    category: "sights",
    hiddenGem: false,
  },
  {
    slug: "saadian-tombs",
    name: "Saadian Tombs",
    subtitle: "16th-century royal necropolis",
    whyItMatters: "Hidden for centuries behind a sealed wall, rediscovered in 1917. The Hall of Twelve Columns is one of the finest interiors in Morocco. Small, intense, and deeply atmospheric.",
    bestTime: "First thing in the morning (9am)",
    durationMinutes: 30,
    priceRange: "€",
    practicalNotes: "Tiny space — lines form fast. Go right at opening. Combined well with El Badi Palace and Kasbah Mosque area.",
    neighborhood: "kasbah",
    category: "sights",
    hiddenGem: false,
  },
  {
    slug: "ben-youssef-madrasa",
    name: "Ben Youssef Madrasa",
    subtitle: "14th-century Islamic college",
    whyItMatters: "The largest madrasa in Morocco. The central courtyard is one of those spaces that stops you in your tracks — carved stucco, cedar wood, and marble in perfect proportion. This is Moroccan architecture at its peak.",
    bestTime: "Early morning",
    durationMinutes: 45,
    priceRange: "€",
    practicalNotes: "Recently reopened after restoration. Combined ticket available with nearby museums.",
    neighborhood: "medina",
    category: "sights",
    hiddenGem: false,
  },
  {
    slug: "maison-photographie",
    name: "Maison de la Photographie",
    subtitle: "Photography museum with rooftop café",
    whyItMatters: "A small private museum of historical Moroccan photography. The images of early 20th century Marrakech are fascinating. But honestly, the rooftop café with medina views is the real reason to come.",
    bestTime: "Mid-morning",
    durationMinutes: 45,
    priceRange: "€",
    practicalNotes: "Near Ben Youssef. The rooftop is a great mid-souk rest stop. Good for photography lovers.",
    neighborhood: "medina",
    category: "sights",
    hiddenGem: true,
  },
  {
    slug: "jemaa-el-fna",
    name: "Jemaa el-Fna",
    subtitle: "The main square — Marrakech's beating heart",
    whyItMatters: "Skip the daytime (it's mostly empty and hot). Come at sunset when the food stalls set up, the musicians start, and the square transforms. Stand on a rooftop café first to take it all in, then dive in at ground level.",
    bestTime: "Sunset (6–8pm)",
    durationMinutes: 60,
    priceRange: "€",
    practicalNotes: "The food stalls are safe but choose busy ones. Ignore aggressive touts. Keep phone close. The energy peaks around 8pm.",
    neighborhood: "medina",
    category: "sights",
    hiddenGem: false,
  },
  {
    slug: "souks",
    name: "The Souks",
    subtitle: "Marrakech's labyrinthine market district",
    whyItMatters: "Not one market — dozens of interconnected alleyways, each specialized. Leather here, metalwork there, textiles around the corner. The architecture overhead (latticed ceilings filtering light) is as important as what's being sold. Get lost on purpose.",
    bestTime: "Morning (10am–1pm) for shopping, late afternoon for atmosphere",
    durationMinutes: 120,
    priceRange: "€–€€€",
    practicalNotes: "Haggling is expected — start at 40% of asking price. The deeper you go from Jemaa el-Fna, the better the prices. Google Maps doesn't work well here — use landmarks.",
    neighborhood: "medina",
    category: "shopping",
    hiddenGem: false,
  },
  {
    slug: "hammam-dar-el-bacha",
    name: "Hammam Dar el Bacha",
    subtitle: "Restored public hammam",
    whyItMatters: "A genuine hammam experience in a beautifully restored historic building. Not a spa — an actual hammam with scrub, steam, and the whole ritual. The architecture alone (star-shaped skylights, marble) is worth it.",
    bestTime: "Late morning or afternoon",
    durationMinutes: 90,
    priceRange: "€€",
    practicalNotes: "Book in advance. Bring swimwear. The full gommage (scrub) package is the right choice. Men and women at different times — check schedule.",
    neighborhood: "medina",
    category: "wellness",
    hiddenGem: false,
  },
  {
    slug: "musee-ysl",
    name: "Musée Yves Saint Laurent",
    subtitle: "Fashion and design museum",
    whyItMatters: "A world-class building — the terracotta lattice facade is architecture as fashion. The permanent collection traces YSL's relationship with Morocco. Even if fashion isn't your thing, the building and the temporary exhibitions are worth it.",
    bestTime: "Afternoon",
    durationMinutes: 60,
    priceRange: "€€",
    practicalNotes: "Next to Jardin Majorelle — do both together. The café inside is excellent. Card accepted.",
    neighborhood: "gueliz",
    category: "sights",
    hiddenGem: false,
  },
  {
    slug: "terrasse-des-epices",
    name: "Terrasse des Épices",
    subtitle: "Medina rooftop with panoramic views",
    whyItMatters: "A large open terrace above the souks with 360° views of the medina, Atlas Mountains, and Koutoubia. More relaxed than NOMAD, less polished, more authentic rooftop energy. Good for a long lunch or afternoon drink.",
    bestTime: "Sunset",
    durationMinutes: 60,
    priceRange: "€€",
    practicalNotes: "Walk past the spice shops and up the stairs. Larger than it looks — usually has space. Good cocktails.",
    neighborhood: "medina",
    category: "food",
    hiddenGem: false,
  },
  {
    slug: "el-badi-palace",
    name: "El Badi Palace",
    subtitle: "Ruined 16th-century sultan's palace",
    whyItMatters: "A ruin, not a restoration — and more powerful for it. The scale of what was once here (360 rooms, a pool the size of a lake) is visible in the massive walls and sunken gardens. The storks nesting on the walls are a bonus.",
    bestTime: "Late afternoon for golden light",
    durationMinutes: 45,
    priceRange: "€",
    practicalNotes: "Combine with Saadian Tombs nearby. The underground passages are worth exploring. Less crowded than Bahia Palace.",
    neighborhood: "kasbah",
    category: "sights",
    hiddenGem: false,
  },
  {
    slug: "koutoubia-mosque",
    name: "Koutoubia Mosque",
    subtitle: "Marrakech's iconic 12th-century minaret",
    whyItMatters: "You can't enter (non-Muslims), but the 77-meter minaret is the city's visual anchor — visible from almost everywhere. The gardens around it are the real visit: a calm park with orange trees, a good first-morning walk from Jemaa el-Fna.",
    bestTime: "Early morning or evening prayer time (for the call to prayer)",
    durationMinutes: 20,
    priceRange: "Free",
    practicalNotes: "Non-Muslims cannot enter. Walk the gardens and appreciate the exterior. Best photographed from the south side.",
    neighborhood: "medina",
    category: "sights",
    hiddenGem: false,
  },
];

export const ESSENTIALS: Essential[] = [
  {
    slug: "medina-navigation",
    title: "The medina doesn't work like a normal city",
    content: "Google Maps will get you close but not there. Streets have no signs, alleys fork randomly, and addresses don't exist. Learn 2–3 landmarks near your riad (a mosque, a fountain, a shop). Ask locals for directions using landmarks, not street names. Getting lost is normal — and usually the best part.",
    category: "Navigation",
  },
  {
    slug: "timing",
    title: "Timing changes everything",
    content: "Jemaa el-Fna at 2pm: empty and hot. At 7pm: magical. Jardin Majorelle at 11am: a queue. At 8am: peaceful. The souks at 9am: craftsmen working, no pressure. At 4pm: peak tourist hustle. Every recommendation in this guide includes the best time. Use it.",
    category: "Planning",
  },
  {
    slug: "tipping",
    title: "Tipping is expected, but small",
    content: "10–15% at restaurants (check if service is included). 10–20 MAD for someone who gives you directions or carries bags. 50–100 MAD for a guide. 5–10 MAD for bathroom attendants. Don't overtip — it distorts local expectations.",
    category: "Practical",
  },
  {
    slug: "haggling",
    title: "Haggling is a conversation, not a fight",
    content: "In the souks, the first price is 2–4x what the seller expects. Start at 30–40% of asking and work toward 50–60%. Smile, take your time, walk away if needed (they'll often call you back). Fixed-price shops exist too — look for signs. Never haggle in restaurants or for taxis using the meter.",
    category: "Shopping",
  },
  {
    slug: "hammam",
    title: "Try a hammam — it's not a spa",
    content: "A hammam is a steam bath + full-body scrub, not a massage parlor. You'll sit on warm marble while someone scrubs your skin clean. It's intense, physical, and one of the most authentic Moroccan experiences. Book a tourist-friendly hammam for your first time. Bring swimwear.",
    category: "Culture",
  },
  {
    slug: "safety",
    title: "Marrakech is safe — but stay aware",
    content: "Violent crime is rare. Petty scams are common: unsolicited 'guides' leading you to shops for commission, henna artists grabbing your hand, fake 'this road is closed' detours. Say 'la shukran' (no thank you) and keep walking. Keep your phone in a front pocket in crowded areas.",
    category: "Safety",
  },
  {
    slug: "money",
    title: "Cash is king in the medina",
    content: "Many medina shops, cafés, and riads are cash-only. ATMs are everywhere (use ones inside banks, not standalone machines). 1 EUR ≈ 11 MAD. Bring some euros/dollars to exchange at the airport on arrival. Guéliz restaurants and upscale places take cards.",
    category: "Practical",
  },
  {
    slug: "weather",
    title: "It's hotter than you think (and cold at night)",
    content: "Summer (Jun–Aug): 40°C+, avoid midday entirely. Spring/Autumn: perfect, 25–30°C. Winter: pleasant days (18–22°C) but cold nights (can drop to 5°C). Riads have thick walls — they stay cool in summer and cold in winter. Pack layers.",
    category: "Planning",
  },
  {
    slug: "language",
    title: "French gets you further than English",
    content: "Moroccan Arabic (Darija) is the main language. French is widely spoken. English works in tourist areas but drops off fast. Learn: 'Salam' (hello), 'Shukran' (thank you), 'La shukran' (no thank you), 'Bslama' (goodbye). A few words in Arabic earns genuine warmth.",
    category: "Culture",
  },
  {
    slug: "getting-around",
    title: "Walking is best — taxis for everything else",
    content: "The medina is pedestrian-only. For Guéliz, Majorelle, or the Palmeraie, use petit taxis (beige). Insist on the meter ('compteur') or agree a price before getting in. 15–30 MAD for most city rides. Ride-hailing apps (inDrive, Careem) work too. Never take a grand taxi (big sedan) for city trips — those are for intercity.",
    category: "Navigation",
  },
];

export const DAY_PLANS: DayPlan[] = [
  {
    slug: "medina-highlights",
    title: "Medina Highlights",
    description: "The essential medina walk — sights, souks, and a rooftop lunch. Covers the must-sees without exhausting you.",
    durationType: "half_day",
    stops: [
      { placeSlug: "ben-youssef-madrasa", timeSlug: "9:00", transitionNote: "Start here before the crowds arrive" },
      { placeSlug: "maison-photographie", timeSlug: "10:00", transitionNote: "5 minute walk. Stop for a rooftop tea." },
      { placeSlug: "souks", timeSlug: "10:45", transitionNote: "Walk south through the souks — take your time" },
      { placeSlug: "cafe-des-epices", timeSlug: "11:30", transitionNote: "Rest stop at the spice square" },
      { placeSlug: "nomad", timeSlug: "12:30", transitionNote: "Lunch with Atlas views" },
    ],
  },
  {
    slug: "full-day-marrakech",
    title: "One Perfect Day",
    description: "If you have exactly one full day — this is how to spend it. Morning in the medina, afternoon in the gardens, evening on the square.",
    durationType: "full_day",
    stops: [
      { placeSlug: "ben-youssef-madrasa", timeSlug: "9:00", transitionNote: "Start with the most important interior in the city" },
      { placeSlug: "souks", timeSlug: "10:00", transitionNote: "Walk through the heart of the souks heading south" },
      { placeSlug: "le-jardin", timeSlug: "12:00", transitionNote: "Lunch in the hidden garden" },
      { placeSlug: "bahia-palace", timeSlug: "14:00", transitionNote: "15 minute walk south through quiet streets" },
      { placeSlug: "saadian-tombs", timeSlug: "15:30", transitionNote: "10 minute walk into the Kasbah quarter" },
      { placeSlug: "jardin-majorelle", timeSlug: "17:00", transitionNote: "Taxi to Guéliz (15 min). Catch golden hour in the garden." },
      { placeSlug: "jemaa-el-fna", timeSlug: "19:00", transitionNote: "Taxi back. Watch the square come alive at sunset." },
    ],
  },
];
