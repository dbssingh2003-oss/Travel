import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  X,
  Compass,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

export interface Destination {
  id: string;
  name: string;
  state: string;
  tagline: string;
  image: string;
  badge: string;
  badgeVariant: "primary" | "accent" | "warning" | "success";
  category: "mountains" | "beaches" | "royal" | "spiritual" | "nature";
  rating: number;
  reviews: number;
  duration: string;
  startingPrice: number;
  weather: string;
  highlights: string[];
  bestTimeToVisit: string;
  overview: string;
  estimatedBudget: {
    transport: number;
    stay: number;
    activities: number;
    buffer: number;
  };
  sampleItinerary: string[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: "manali",
    name: "Manali & Solang Valley",
    state: "Himachal Pradesh",
    tagline: "Snowy peaks, apple orchards & alpine adventures",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80",
    badge: "🔥 Top Trending",
    badgeVariant: "primary",
    category: "mountains",
    rating: 4.9,
    reviews: 3820,
    duration: "4N / 5D",
    startingPrice: 11499,
    weather: "❄️ -1°C Crisp Snow",
    highlights: ["Solang Valley Skiing", "Rohtang Pass Tour", "Old Manali Cafes", "Jogini Waterfalls"],
    bestTimeToVisit: "October to March (Snow) | April to June (Pleasant)",
    overview:
      "A high-altitude Himalayan resort town known for its breathtaking mountain vistas, snow-capped slopes, vibrant cafe culture, and thrilling adventure sports like paragliding and skiing.",
    estimatedBudget: {
      transport: 3800,
      stay: 4500,
      activities: 2200,
      buffer: 999,
    },
    sampleItinerary: [
      "Day 1: Arrival, Mall Road stroll & Hadimba Temple",
      "Day 2: Solang Valley snow activities & paragliding",
      "Day 3: Rohtang Pass excursion & Atal Tunnel drive",
      "Day 4: Old Manali bohemian cafes & Jogini Falls trek",
      "Day 5: Souvenir shopping & departure",
    ],
  },
  {
    id: "goa",
    name: "Goa (North & South)",
    state: "Goa Coast",
    tagline: "Sun-kissed beaches, Portuguese villas & vibrant nightlife",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80",
    badge: "🌴 Beach Vibes",
    badgeVariant: "accent",
    category: "beaches",
    rating: 4.8,
    reviews: 5410,
    duration: "3N / 4D",
    startingPrice: 9999,
    weather: "☀️ 29°C Tropical Breeze",
    highlights: ["Palolem & Vagator Beach", "Scuba & Jet Skiing", "Fort Aguada", "Sunset Cruise"],
    bestTimeToVisit: "November to February",
    overview:
      "India's coastal paradise featuring golden sandy shores, UNESCO heritage Portuguese architecture, world-famous seafood shacks, and unforgettable Arabian Sea sunsets.",
    estimatedBudget: {
      transport: 3200,
      stay: 3800,
      activities: 2000,
      buffer: 999,
    },
    sampleItinerary: [
      "Day 1: Check-in, Baga Beach sunset & beach shack dinner",
      "Day 2: Water sports at Calangute, Aguada Fort & night market",
      "Day 3: South Goa heritage tour, Old Goa churches & Mandovi sunset cruise",
      "Day 4: Palolem beach relaxation & departure",
    ],
  },
  {
    id: "ladakh",
    name: "Leh Ladakh & Pangong",
    state: "Ladakh",
    tagline: "Mystic moonscapes, azure lakes & ancient monasteries",
    image:
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=900&q=80",
    badge: "⭐ Bucket List",
    badgeVariant: "warning",
    category: "nature",
    rating: 4.95,
    reviews: 2190,
    duration: "5N / 6D",
    startingPrice: 19800,
    weather: "🌤️ 8°C Sunny & Chilly",
    highlights: ["Pangong Tso Lake", "Khardung La Pass", "Nubra Valley Dunes", "Thiksey Monastery"],
    bestTimeToVisit: "May to September",
    overview:
      "The 'Land of High Passes' offers mind-boggling vistas of color-changing lakes, stark arid mountains, high-altitude sand dunes with double-humped camels, and serene Buddhist gompas.",
    estimatedBudget: {
      transport: 6500,
      stay: 7500,
      activities: 3800,
      buffer: 2000,
    },
    sampleItinerary: [
      "Day 1: Arrival in Leh & mandatory acclimatization day",
      "Day 2: Shanti Stupa, Leh Palace & Hall of Fame",
      "Day 3: Scenic drive across Khardung La to Nubra Valley",
      "Day 4: Diskit Monastery & Pangong Tso Lake camping",
      "Day 5: Pangong sunrise & return drive to Leh via Chang La",
      "Day 6: Departure with unforgettable memories",
    ],
  },
  {
    id: "kerala",
    name: "Munnar & Alleppey",
    state: "Kerala",
    tagline: "Emerald tea plantations, tranquil backwaters & Ayurveda",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=80",
    badge: "🍃 God's Own Country",
    badgeVariant: "success",
    category: "nature",
    rating: 4.9,
    reviews: 4120,
    duration: "4N / 5D",
    startingPrice: 13999,
    weather: "🌤️ 22°C Refreshing",
    highlights: ["Private Houseboat Cruise", "Tea Museum & Estate Walk", "Eravikulam National Park", "Kathakali Night"],
    bestTimeToVisit: "September to March",
    overview:
      "Immerse yourself in lush greenery, sprawling aromatic spice hills, soothing Ayurvedic wellness therapies, and gentle houseboat glides through serene coconut-fringed lagoons.",
    estimatedBudget: {
      transport: 4000,
      stay: 5500,
      activities: 2800,
      buffer: 1699,
    },
    sampleItinerary: [
      "Day 1: Arrival in Kochi & scenic hill drive to Munnar",
      "Day 2: Mattupetty Dam, Tea Gardens & Anamudi view",
      "Day 3: Transfer to Alleppey & luxury houseboat boarding",
      "Day 4: Backwater cruise, village culinary experience & Marari Beach",
      "Day 5: Fort Kochi colonial walk & flight departure",
    ],
  },
  {
    id: "jaipur",
    name: "Jaipur & Udaipur",
    state: "Rajasthan",
    tagline: "Majestic forts, royal palaces & shimmering lakes",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80",
    badge: "👑 Royal Heritage",
    badgeVariant: "warning",
    category: "royal",
    rating: 4.85,
    reviews: 4890,
    duration: "4N / 5D",
    startingPrice: 12499,
    weather: "☀️ 26°C Pleasant Sun",
    highlights: ["Amber Fort Light Show", "Hawa Mahal & City Palace", "Lake Pichola Sunset Boat", "Chokhi Dhani Dinner"],
    bestTimeToVisit: "October to March",
    overview:
      "Experience timeless royal opulence with towering stone fortresses, intricate Rajput palace architecture, vibrant bazaars laden with handicraft treasures, and starlit lake cruises.",
    estimatedBudget: {
      transport: 3800,
      stay: 4800,
      activities: 2400,
      buffer: 1499,
    },
    sampleItinerary: [
      "Day 1: Arrival in Jaipur, Hawa Mahal & Johari Bazaar",
      "Day 2: Amber Fort elephant/jeep ascent & Nahargarh sunset",
      "Day 3: Scenic highway to Udaipur & Lake Pichola evening boat",
      "Day 4: City Palace, Saheliyon Ki Bari & cultural show at Bagore Ki Haveli",
      "Day 5: Sajjangarh Monsoon Palace & departure",
    ],
  },
  {
    id: "kashmir",
    name: "Gulmarg & Srinagar",
    state: "Jammu & Kashmir",
    tagline: "Heaven on Earth: Shikara rides & snowy gondolas",
    image:
      "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=900&q=80",
    badge: "❄️ Winter Paradise",
    badgeVariant: "primary",
    category: "mountains",
    rating: 4.92,
    reviews: 3650,
    duration: "4N / 5D",
    startingPrice: 15499,
    weather: "❄️ -3°C Fresh Snowfall",
    highlights: ["Gulmarg Phase 2 Gondola", "Dal Lake Houseboat Stay", "Pahalgam Betaab Valley", "Mughal Gardens"],
    bestTimeToVisit: "December to February (Snow) | April to August (Flowers)",
    overview:
      "Known worldwide as paradise on earth, Kashmir enchants with its tranquil floating gardens on Dal Lake, world-class powder snow skiing in Gulmarg, and picturesque pine valleys.",
    estimatedBudget: {
      transport: 4500,
      stay: 6000,
      activities: 3200,
      buffer: 1799,
    },
    sampleItinerary: [
      "Day 1: Arrival in Srinagar, Dal Lake Shikara ride & floating market",
      "Day 2: Gulmarg Gondola cable car Phase 1 & 2 alpine snow ride",
      "Day 3: Day trip to Pahalgam, Betaab Valley & Aru Valley",
      "Day 4: Srinagar Mughal Gardens & traditional Wazwan dinner",
      "Day 5: Saffron & dry fruit shopping, departure",
    ],
  },
  {
    id: "rishikesh",
    name: "Rishikesh & Kedarnath",
    state: "Uttarakhand",
    tagline: "Yoga capital, white water rapids & holy Himalayan trails",
    image:
      "https://images.unsplash.com/photo-1598890777032-bde17c494200?auto=format&fit=crop&w=900&q=80",
    badge: "🧘 Spiritual & Thrill",
    badgeVariant: "accent",
    category: "spiritual",
    rating: 4.88,
    reviews: 3100,
    duration: "3N / 4D",
    startingPrice: 8499,
    weather: "🌤️ 20°C Refreshing Air",
    highlights: ["Grade 4 River Rafting", "Triveni Ghat Evening Aarti", "Beatles Ashram Exploration", "Bungee Jumping"],
    bestTimeToVisit: "September to November | March to May",
    overview:
      "Where holy spirituality meets adrenaline thrills: cliff-jump into the emerald Ganges, master authentic Himalayan yoga, experience soulful evening aartis, and camp under starlit canopies.",
    estimatedBudget: {
      transport: 2400,
      stay: 3200,
      activities: 2000,
      buffer: 899,
    },
    sampleItinerary: [
      "Day 1: Arrival, Laxman Jhula stroll & Triveni Ghat Ganga Aarti",
      "Day 2: 16km Shivpuri river rafting, cliff jumping & beach bonfire",
      "Day 3: Beatles Ashram, Neer Garh waterfall trek & yoga session",
      "Day 4: Cafe hopping in Tapovan & return journey",
    ],
  },
  {
    id: "andaman",
    name: "Havelock & Neil Island",
    state: "Andaman & Nicobar",
    tagline: "Crystal turquoise waters, coral reefs & secluded sands",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80",
    badge: "🐠 Scuba Haven",
    badgeVariant: "primary",
    category: "beaches",
    rating: 4.96,
    reviews: 1850,
    duration: "5N / 6D",
    startingPrice: 22999,
    weather: "☀️ 27°C Gentle Sea Breeze",
    highlights: ["Radhanagar Beach Sunset", "Scuba Diving at Elephant Beach", "Cellular Jail Sound & Light", "Bioluminescence Kayaking"],
    bestTimeToVisit: "October to May",
    overview:
      "Untouched tropical islands surrounded by vibrant coral reefs, crystal-clear turquoise lagoons, rich biodiversity, and one of Asia's top-rated beaches.",
    estimatedBudget: {
      transport: 7500,
      stay: 8500,
      activities: 4800,
      buffer: 2199,
    },
    sampleItinerary: [
      "Day 1: Port Blair arrival & Cellular Jail historical walk",
      "Day 2: Catamaran cruise to Havelock Island & Radhanagar beach",
      "Day 3: Guided coral scuba diving & Elephant beach water sports",
      "Day 4: Neil Island Natural Bridge & Laxmanpur sunset",
      "Day 5: Return to Port Blair, local craft markets & seafood fest",
      "Day 6: Flight departure",
    ],
  },
  {
    id: "varanasi",
    name: "Varanasi Ghats & Sarnath",
    state: "Uttar Pradesh",
    tagline: "Timeless spiritual cradle, soul-stirring Ganga aartis & heritage",
    image:
      "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80",
    badge: "🪔 Ancient Soul",
    badgeVariant: "accent",
    category: "spiritual",
    rating: 4.87,
    reviews: 2950,
    duration: "3N / 4D",
    startingPrice: 7999,
    weather: "🌤️ 24°C Pleasant",
    highlights: ["Dashashwamedh Ghat Aarti", "Sunrise Boat Ride", "Kashi Vishwanath Temple", "Sarnath Buddhist Stupa"],
    bestTimeToVisit: "October to March",
    overview:
      "One of the world's oldest living cities, celebrated for its mystical morning boat rides along the ghats, mesmerizing priest chants during evening aartis, and centuries-old Banarasi silk weaving.",
    estimatedBudget: {
      transport: 2200,
      stay: 3000,
      activities: 1800,
      buffer: 999,
    },
    sampleItinerary: [
      "Day 1: Arrival, Kashi Vishwanath Darshan & Dashashwamedh Aarti",
      "Day 2: 5:30 AM sunrise boat cruise along 84 Ghats & street food walk",
      "Day 3: Sarnath historical stupa & Deer Park excursion",
      "Day 4: Banarasi silk artisan workshop visit & departure",
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "✨ All Places", icon: Compass },
  { id: "mountains", label: "🏔️ Mountains & Snow", icon: TrendingUp },
  { id: "beaches", label: "🏝️ Beaches & Islands", icon: Sparkles },
  { id: "royal", label: "🏰 Forts & Palaces", icon: ShieldCheck },
  { id: "spiritual", label: "🧘 Spiritual & Yoga", icon: CheckCircle2 },
  { id: "nature", label: "🌿 Wilderness & Wildlife", icon: Compass },
] as const;

export function DestinationShowcase() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const navigate = useNavigate();

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((dest) => {
      const matchesCategory =
        activeCategory === "all" || dest.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        dest.name.toLowerCase().includes(query) ||
        dest.state.toLowerCase().includes(query) ||
        dest.highlights.some((h) => h.toLowerCase().includes(query)) ||
        dest.tagline.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const handlePlanNow = (destName: string) => {
    navigate(`/plan?dest=${encodeURIComponent(destName)}`);
  };

  return (
    <section className="section relative py-20 overflow-hidden" id="destinations">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/2 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-48 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 badge badge-primary px-4 py-1.5 mb-4 text-xs tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          DISCOVER VERIFIED DESTINATIONS
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4"
        >
          Explore India's <span className="gradient-text">Hottest Getaways</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-muted text-base sm:text-lg leading-relaxed"
        >
          Handcrafted packages with 100% KYC-verified hotels, scenic train transfers, and reliable cabs. Pick your vibe and let our AI assemble your custom itinerary in seconds.
        </motion.p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="max-w-5xl mx-auto mb-10 space-y-4">
        {/* Search Input Bar */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-fg pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by destination (e.g. Manali, Goa, Ladakh, Skiing, Scuba)..."
            className="input-field pl-12 pr-10 py-3.5 text-sm sm:text-base rounded-2xl bg-surface-2/80 backdrop-blur-md border border-border focus:border-primary shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none px-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-white shadow-glow-primary font-semibold"
                    : "text-muted hover:text-slate-200 bg-surface-2/60 hover:bg-surface-2 border border-border/60"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Destination Grid */}
      {filteredDestinations.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-md mx-auto my-8">
          <Compass className="w-12 h-12 text-muted-fg mx-auto mb-3 opacity-40 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-200 mb-1">No destinations found</h3>
          <p className="text-sm text-muted mb-4">
            Try tweaking your search term or switch to another category.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="btn-secondary text-xs px-4 py-2"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {filteredDestinations.map((dest, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              key={dest.id}
              className="glass-card group overflow-hidden flex flex-col rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary/20 hover:-translate-y-1"
            >
              {/* Image Container with Overlay */}
              <div className="relative h-56 w-full overflow-hidden bg-surface-2">
                <img
                  src={dest.image}
                  alt={dest.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`badge text-xs font-semibold px-2.5 py-1 backdrop-blur-md border ${
                      dest.badgeVariant === "primary"
                        ? "bg-primary/80 text-white border-primary/40 shadow-sm"
                        : dest.badgeVariant === "accent"
                        ? "bg-accent/80 text-white border-accent/40 shadow-sm"
                        : dest.badgeVariant === "warning"
                        ? "bg-warning/80 text-slate-900 border-warning/40 font-bold"
                        : "bg-success/80 text-white border-success/40"
                    }`}
                  >
                    {dest.badge}
                  </span>
                </div>

                {/* Weather Pill */}
                <div className="absolute top-3 right-3 bg-surface-1/80 backdrop-blur-md border border-border/80 px-2.5 py-1 rounded-full text-xs text-slate-200 font-medium">
                  {dest.weather}
                </div>

                {/* Location & Title Overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1 text-xs text-accent font-medium mb-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{dest.state}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white leading-snug drop-shadow-md">
                    {dest.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Tagline */}
                <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
                  {dest.tagline}
                </p>

                {/* Highlight Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {dest.highlights.slice(0, 3).map((hl, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-surface-2 border border-border text-slate-300 font-medium"
                    >
                      {hl}
                    </span>
                  ))}
                  {dest.highlights.length > 3 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-surface-2 text-muted font-medium">
                      +{dest.highlights.length - 3} more
                    </span>
                  )}
                </div>

                {/* Meta info: Duration, Rating, Price */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-fg font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{dest.duration}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    <span className="font-bold text-slate-200">{dest.rating}</span>
                    <span className="text-muted-fg text-[11px]">
                      ({dest.reviews >= 1000 ? `${(dest.reviews / 1000).toFixed(1)}k` : dest.reviews})
                    </span>
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-muted-fg block uppercase tracking-wider">
                      From / person
                    </span>
                    <span className="text-lg font-black gradient-text">
                      ₹{dest.startingPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDestination(dest)}
                      className="btn-secondary text-xs px-3 py-2 rounded-xl"
                      title="View Itinerary & Cost Breakdown"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlanNow(dest.name)}
                      className="btn-primary text-xs px-3.5 py-2 rounded-xl shadow-glow-primary flex items-center gap-1"
                    >
                      Plan Trip
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Detailed Place Modal / Preview Drawer */}
      <AnimatePresence>
        {selectedDestination && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-primary/30 p-6 md:p-8 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedDestination(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-surface-2/80 hover:bg-surface-2 text-muted-fg hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header Banner */}
              <div className="relative h-48 sm:h-56 -mx-6 -mt-6 md:-mx-8 md:-mt-8 rounded-t-3xl overflow-hidden mb-6">
                <img
                  src={selectedDestination.image}
                  alt={selectedDestination.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="badge badge-primary text-xs px-2.5 py-1 mb-1.5 inline-block">
                      {selectedDestination.badge}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {selectedDestination.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-accent flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedDestination.state} • {selectedDestination.weather}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-muted-fg block">Estimated All-Inclusive</span>
                    <span className="text-2xl font-black text-glow text-accent">
                      ₹{selectedDestination.startingPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-1.5">Overview</h4>
                  <p className="text-sm text-muted leading-relaxed">
                    {selectedDestination.overview}
                  </p>
                </div>

                {/* Best Season & Duration */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-2/60 border border-border text-xs">
                  <div>
                    <span className="text-muted-fg block">Best Season to Visit</span>
                    <span className="font-semibold text-slate-200">
                      {selectedDestination.bestTimeToVisit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-fg block">Recommended Duration</span>
                    <span className="font-semibold text-slate-200">
                      {selectedDestination.duration}
                    </span>
                  </div>
                </div>

                {/* Sample Day-wise Itinerary */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-2.5 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-primary" />
                    Sample Verified Itinerary
                  </h4>
                  <div className="space-y-2">
                    {selectedDestination.sampleItinerary.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-2/40 border border-border/50 text-xs text-slate-300"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-2">
                    Approximate Cost Split (per person)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                      <span className="text-muted-fg block text-[11px]">Transport / Train</span>
                      <span className="font-bold text-slate-100">
                        ₹{selectedDestination.estimatedBudget.transport.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                      <span className="text-muted-fg block text-[11px]">Hotel / Stay</span>
                      <span className="font-bold text-slate-100">
                        ₹{selectedDestination.estimatedBudget.stay.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                      <span className="text-muted-fg block text-[11px]">Local & Sightseeing</span>
                      <span className="font-bold text-slate-100">
                        ₹{selectedDestination.estimatedBudget.activities.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                      <span className="text-muted-fg block text-[11px]">Safety Buffer</span>
                      <span className="font-bold text-slate-100">
                        ₹{selectedDestination.estimatedBudget.buffer.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDestination(null)}
                    className="btn-secondary text-sm px-4 py-2.5"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlanNow(selectedDestination.name)}
                    className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                  >
                    Customize & Plan Trip
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
