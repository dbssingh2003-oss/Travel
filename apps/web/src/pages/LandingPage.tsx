import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shield, Train, Hotel, Car, Star, ChevronRight,
  Zap, Globe, Users, TrendingUp,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-glow-radial" />
      </div>

      <div className="section relative z-10 text-center">
        <motion.div {...fadeUp} className="mb-6">
          <span className="badge badge-primary text-sm px-4 py-2 mb-6 inline-flex">
            <Zap className="w-3 h-3 mr-1" /> India's first honest trip planner
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ delay: 0.1, ...fadeUp.transition }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight"
        >
          One place for your{" "}
          <span className="gradient-text text-glow">perfect trip</span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ delay: 0.2, ...fadeUp.transition }}
          className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Say <em>"I want to go to Manali, December 10–14, ₹20,000 budget"</em> and
          get a complete plan — train, hotel, cab — with verified vendors and live
          tracking. No more juggling 4 apps.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3, ...fadeUp.transition }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/plan" className="btn-primary text-lg px-8 py-4">
            Plan my trip <ChevronRight className="w-5 h-5" />
          </Link>
          <Link to="/auth" className="btn-secondary text-lg px-8 py-4">
            Sign in
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          {...stagger}
          animate="animate"
          initial="initial"
          className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { value: "100%", label: "KYC-verified vendors" },
            { value: "₹0", label: "Hidden charges" },
            { value: "24/7", label: "Support team" },
          ].map((stat) => (
            <motion.div key={stat.label} {...fadeUp} className="text-center">
              <p className="text-2xl font-black gradient-text">{stat.value}</p>
              <p className="text-xs text-muted-fg mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <Globe className="w-6 h-6" />, title: "Tell us your trip", desc: "Destination, dates, budget, number of travelers. Takes 30 seconds." },
    { icon: <Zap className="w-6 h-6" />, title: "Get 3 tailored plans", desc: "Budget Explorer, Balanced, or Comfort Plus — each with day-by-day breakdown." },
    { icon: <Shield className="w-6 h-6" />, title: "We book everything", desc: "Train, hotel, cab booked through our vetted vendor network. You just confirm." },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Track in real-time", desc: "Live status for every leg. Download your confirmation PDF instantly." },
  ];

  return (
    <section className="section">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold mb-4">
          How <span className="gradient-text">DB Best Worlds</span> works
        </h2>
        <p className="text-muted max-w-xl mx-auto">
          From idea to confirmed booking in minutes, not hours.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 text-center hover:scale-[1.02] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
              {s.icon}
            </div>
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mx-auto mb-3">
              {i + 1}
            </div>
            <h3 className="font-semibold text-slate-200 mb-2">{s.title}</h3>
            <p className="text-sm text-muted-fg leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function VendorTrust() {
  return (
    <section className="section">
      <div className="glass-card p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="badge badge-success mb-4 inline-flex">
              <Shield className="w-3 h-3 mr-1" /> Honest Dealer Network
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Every vendor is <span className="gradient-text">KYC-verified</span> before you see them
            </h2>
            <p className="text-muted leading-relaxed mb-6">
              We onboard and verify every train agent, hotel, and cab operator. Their trust
              score — based on fulfillment rate, ratings, and dispute history — is shown to
              you before booking. No mystery operators.
            </p>
            <div className="space-y-3">
              {[
                { icon: <Shield className="w-4 h-4 text-success" />, text: "Business KYC & document verification" },
                { icon: <Star className="w-4 h-4 text-warning" />, text: "Real-time trust score from verified bookings" },
                { icon: <Users className="w-4 h-4 text-accent" />, text: "Direct vendor contact details on confirmation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: "Train", icon: <Train className="w-6 h-6" />, score: 9.4 },
              { type: "Hotel", icon: <Hotel className="w-6 h-6" />, score: 9.1 },
              { type: "Cab", icon: <Car className="w-6 h-6" />, score: 9.6 },
            ].map((v) => (
              <div key={v.type} className="bg-surface-2 rounded-xl p-4 text-center border border-border">
                <div className="text-accent mx-auto mb-2 flex justify-center">{v.icon}</div>
                <p className="text-xs text-muted-fg mb-1">{v.type}</p>
                <p className="text-2xl font-black gradient-text">{v.score}</p>
                <p className="text-xs text-muted-fg">avg trust</p>
              </div>
            ))}
          </div>
        </div>
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
    >
      <HeroSection />
      <HowItWorks />
      <VendorTrust />

      {/* CTA */}
      <section className="section text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-12 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to plan your <span className="gradient-text">best trip?</span>
          </h2>
          <p className="text-muted mb-8">
            Join thousands planning smarter — one honest trip at a time.
          </p>
          <Link to="/plan" className="btn-primary text-lg px-10 py-4">
            Start planning for free <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </motion.div>
  );
}
