import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shield,
  Train,
  Hotel,
  Car,
  Star,
  ChevronRight,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  Clock,
} from "lucide-react";
import { DestinationShowcase } from "@/components/landing/DestinationShowcase";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

function HeroSection() {
  const quickDestinations = [
    { name: "Manali", tag: "❄️ Snow & Skiing" },
    { name: "Goa", tag: "🏖️ Beach & Sun" },
    { name: "Ladakh", tag: "🏔️ High Passes" },
    { name: "Kerala", tag: "🌿 Houseboats" },
    { name: "Jaipur", tag: "🏰 Palaces" },
    { name: "Andaman", tag: "🐠 Scuba Diving" },
  ];

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/12 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-glow-radial opacity-70" />
      </div>

      <div className="section relative z-10 text-center max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="mb-6">
          <span className="badge badge-primary text-xs sm:text-sm px-4 py-2 mb-6 inline-flex items-center gap-1.5 shadow-glow-primary/30">
            <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
            India's Most Transparent AI Travel Planner
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ delay: 0.1, ...fadeUp.transition }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.15]"
        >
          Your Dream Vacation,{" "}
          <span className="gradient-text text-glow">Fully Booked in Minutes</span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ delay: 0.2, ...fadeUp.transition }}
          className="text-lg sm:text-xl text-muted max-w-3xl mx-auto mb-8 leading-relaxed"
        >
          Say <em className="text-slate-200">"Take me to Manali or Goa under ₹25,000"</em> — and get a verified all-in-one trip package including train tickets, hand-picked hotels, and dedicated cab transfers with zero hidden markups.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3, ...fadeUp.transition }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <Link
            to="/plan"
            className="btn-primary text-base sm:text-lg px-8 py-4 w-full sm:w-auto shadow-glow-primary flex items-center justify-center gap-2 group"
          >
            Start Planning For Free
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#destinations"
            className="btn-secondary text-base sm:text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            Explore Places
          </a>
        </motion.div>

        {/* Quick Destination Pills */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.35, ...fadeUp.transition }}
          className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-12"
        >
          <span className="text-xs text-muted-fg font-medium mr-1">Trending right now:</span>
          {quickDestinations.map((d) => (
            <Link
              key={d.name}
              to={`/plan?dest=${encodeURIComponent(d.name)}`}
              className="badge bg-surface-2/80 hover:bg-primary/20 hover:border-primary/50 text-slate-300 text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 border border-border"
            >
              <span>{d.name}</span>
              <span className="text-[10px] text-muted-fg">{d.tag}</span>
            </Link>
          ))}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          {...stagger}
          animate="animate"
          initial="initial"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-border/60"
        >
          {[
            { value: "100%", label: "KYC Verified Vendors", icon: Shield },
            { value: "₹0", label: "Hidden Fees & Surcharges", icon: CheckCircle2 },
            { value: "Live", label: "GPS & PNR Tracking", icon: Clock },
            { value: "24/7", label: "Dedicated Concierge", icon: PhoneCall },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              {...fadeUp}
              className="p-3.5 rounded-xl bg-surface-2/50 border border-border/50 text-center"
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-1 opacity-80" />
              <p className="text-xl font-black gradient-text">{stat.value}</p>
              <p className="text-xs text-muted-fg mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: "1. Tell Us Your Dream",
      desc: "Destination, travel dates, budget preference, and travelers. Takes less than 30 seconds.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "2. Compare 3 Curated Plans",
      desc: "Choose from Budget Explorer, Balanced Comfort, or Luxury Plus with transparent price splits.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "3. Single Click Booking",
      desc: "Train seats, hotel check-in vouchers, and airport/station cab drivers reserved in one transaction.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "4. Travel with Peace of Mind",
      desc: "Live WhatsApp and real-time dashboard updates with direct vendor contact lines for 24/7 support.",
    },
  ];

  return (
    <section className="section py-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className="badge badge-primary text-xs px-3 py-1 mb-3 inline-block">
          SIMPLE & TRANSPARENT
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          How <span className="gradient-text">DB Best Worlds</span> Works
        </h2>
        <p className="text-muted max-w-xl mx-auto text-sm sm:text-base">
          From trip inspiration to confirmed reservations without juggling five different travel portals.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl text-center hover:border-primary/40 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
              {s.icon}
            </div>
            <h3 className="font-bold text-slate-100 mb-2 text-base">{s.title}</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function VendorTrust() {
  return (
    <section className="section py-16">
      <div className="glass-card p-8 md:p-12 rounded-3xl border border-primary/20 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div>
            <span className="badge badge-success mb-4 inline-flex items-center gap-1.5 px-3 py-1">
              <Shield className="w-3.5 h-3.5" /> Certified Partner Network
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 leading-tight">
              Every vendor is <span className="gradient-text">KYC-verified</span> before they can host you
            </h2>
            <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
              We background-check every hotel manager, licensed train booking agent, and commercial cab driver. You receive their verified government ID references, direct phone lines, and real traveler satisfaction scores upfront.
            </p>
            <div className="space-y-3.5">
              {[
                { icon: <Shield className="w-4 h-4 text-success" />, text: "Strict business document & vehicle permit verification" },
                { icon: <Star className="w-4 h-4 text-warning fill-warning" />, text: "Algorithmic trust score calculated after every trip" },
                { icon: <Users className="w-4 h-4 text-accent" />, text: "Direct emergency contacts provided on booking vouchers" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 border border-border">
                    {item.icon}
                  </div>
                  <span className="text-xs sm:text-sm text-slate-200 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { type: "Train Agents", icon: <Train className="w-6 h-6" />, score: "9.8 / 10", badge: "Confirmed Seats" },
              { type: "Boutique Hotels", icon: <Hotel className="w-6 h-6" />, score: "9.6 / 10", badge: "Sanitized & Verified" },
              { type: "Cab Fleet", icon: <Car className="w-6 h-6" />, score: "9.9 / 10", badge: "Licensed Drivers" },
            ].map((v) => (
              <div key={v.type} className="bg-surface-2/80 backdrop-blur-md rounded-2xl p-4 text-center border border-border hover:border-primary/40 transition-colors">
                <div className="text-primary mx-auto mb-2 flex justify-center">{v.icon}</div>
                <p className="text-xs font-semibold text-slate-200 mb-1">{v.type}</p>
                <p className="text-xl sm:text-2xl font-black gradient-text">{v.score}</p>
                <p className="text-[10px] text-accent mt-1">{v.badge}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const reviews = [
    {
      name: "Rohit & Priya Verma",
      city: "Bangalore",
      destination: "Manali & Solang Valley (5D/4N)",
      text: "Booking train from Delhi + Volvo + Manali resort was always a nightmare across 3 websites. DB Best Worlds generated our complete itinerary with taxi pickups in 2 minutes!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Ananya Deshmukh",
      city: "Mumbai",
      destination: "Goa Coastal Escape (4D/3N)",
      text: "The price transparency is unbelievable. The itemized cost showed exactly how much went to the hotel and the cab driver. Zero surprise taxes at checkout!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Dr. Arvind Patel",
      city: "Ahmedabad",
      destination: "Leh Ladakh Expedition (6D/5N)",
      text: "We had real-time WhatsApp updates during our Pangong Tso transit. It felt like having a personal travel concierge watching over our trip 24/7.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
  ];

  return (
    <section className="section py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="badge badge-accent text-xs px-3 py-1 mb-3 inline-block">
          LOVED BY TRAVELERS
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          Stories from <span className="gradient-text">Real Journeys</span>
        </h2>
        <p className="text-muted text-sm sm:text-base">
          See why thousands of adventurers and families trust us with their holiday planning.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {reviews.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center gap-1 text-warning mb-3">
                {[...Array(r.rating)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-warning" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-6">
                "{r.text}"
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <img
                src={r.avatar}
                alt={r.name}
                className="w-10 h-10 rounded-full object-cover border border-primary/40"
              />
              <div>
                <p className="text-sm font-bold text-white">{r.name}</p>
                <p className="text-xs text-muted-fg">{r.city} • <span className="text-accent">{r.destination}</span></p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: "How does DB Best Worlds combine train, hotel, and cab in one plan?",
      a: "Our smart planning engine connects directly with vetted transport operators and verified accommodation partners. When you specify your destination and budget, we assemble a synchronized itinerary where every arrival, hotel check-in, and sightseeing transit is coordinated.",
    },
    {
      q: "Can I customize the plan after it is generated?",
      a: "Absolutely! You can choose between 3 tailored budget tiers (Budget Explorer, Balanced, and Comfort Plus), customize dates, swap hotel categories, or add optional adventure activities.",
    },
    {
      q: "Are the prices shown all-inclusive?",
      a: "Yes. Before any payment is authorized, we present a complete itemized breakdown showing train tickets, room rates, private cab tariffs, and taxes with ₹0 hidden charges.",
    },
  ];

  return (
    <section className="section py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-3">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <p className="text-muted text-sm">Everything you need to know about our honest booking model.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-card p-6 rounded-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
              {faq.q}
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed pl-6">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <HeroSection />

      {/* Modern Curated Destination Showcase with Photos, Filters & Modals */}
      <DestinationShowcase />

      <HowItWorks />
      <VendorTrust />
      <TestimonialsSection />
      <FaqSection />

      {/* Bottom CTA Banner */}
      <section className="section text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 md:p-14 max-w-3xl mx-auto rounded-3xl border border-primary/30 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-accent/20 rounded-full blur-3xl" />

          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 relative z-10">
            Ready to Experience Your <span className="gradient-text">Next Adventure?</span>
          </h2>
          <p className="text-muted text-sm sm:text-base mb-8 max-w-xl mx-auto relative z-10">
            Select your dream destination or input custom dates to receive 3 tailored holiday packages instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link to="/plan" className="btn-primary text-base px-8 py-3.5 shadow-glow-primary">
              Build My Itinerary Now <ChevronRight className="w-5 h-5 ml-1 inline" />
            </Link>
            <Link to="/auth" className="btn-secondary text-base px-8 py-3.5">
              Sign In / Register
            </Link>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}
