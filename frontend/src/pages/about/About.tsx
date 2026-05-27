import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  Heart,
  Users,
  TrendingUp,
  Star,
  Package,
} from "lucide-react";

const MILESTONES = [
  { year: "2020", title: "The Idea", desc: "Two friends frustrated by fragmented online marketplaces sketched VendLuxe on a napkin." },
  { year: "2021", title: "First Vendors", desc: "We onboarded our first 50 independent vendors and shipped over 1,000 orders in our beta." },
  { year: "2022", title: "Series A", desc: "Raised $4M to scale our platform, logistics infrastructure, and vendor support team." },
  { year: "2023", title: "Going Global", desc: "Expanded to 40 countries with localised payments and multilingual vendor dashboards." },
  { year: "2024", title: "10K Vendors", desc: "Reached 10,000 active vendors and $50M in total goods sold on the platform." },
  { year: "2025", title: "Today", desc: "Continuing to build the most trusted multi-vendor marketplace for independent creators." },
];

const TEAM = [
  { name: "Adaeze Okonkwo", role: "Co-Founder & CEO", initial: "A" },
  { name: "Marcus Reeves", role: "Co-Founder & CTO", initial: "M" },
  { name: "Soren Larsen", role: "Head of Product", initial: "S" },
  { name: "Priya Mehta", role: "Head of Vendor Success", initial: "P" },
];

const STATS = [
  { icon: Users, value: "10K+", label: "Active Vendors" },
  { icon: Package, value: "500K+", label: "Products Listed" },
  { icon: Globe, value: "40+", label: "Countries Served" },
  { icon: Star, value: "4.9", label: "Average Rating" },
];

const VALUES = [
  { icon: ShieldCheck, title: "Trust First", desc: "Every vendor is verified. Every transaction is protected. We never compromise on safety." },
  { icon: Heart, title: "Creator-Led", desc: "We exist for independent sellers. Our success is measured by theirs." },
  { icon: Zap, title: "Relentless Speed", desc: "Fast payments, fast shipping, fast support. We respect your time." },
  { icon: TrendingUp, title: "Shared Growth", desc: "Low fees, transparent data, and tools that help vendors scale." },
];

const About = () => {
  return (
    <div className="space-y-32 pb-24">

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/3 -right-1/4 w-[900px] h-[900px] border border-white/5 rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/3 -left-1/4 w-[1100px] h-[1100px] border border-white/5 rounded-full pointer-events-none"
        />

        <div className="container mx-auto px-6 text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest"
          >
            <Heart className="w-4 h-4 fill-primary" />
            <span>Our Story</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-black leading-tight max-w-5xl mx-auto"
          >
            Built for the <br />
            <span className="text-gradient">Independent</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            VendLuxe started with a simple belief: independent creators deserve a marketplace as premium as their products. We built the platform we wished existed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/products"
              className="px-8 py-4 bg-primary text-white rounded-2xl font-bold btn-premium flex items-center gap-2 group"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/vendors"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              Meet Our Vendors
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 text-center space-y-3"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-4xl font-display font-black text-gradient">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
              Our Mission
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black leading-tight">
              Commerce that <span className="text-gradient">empowers</span>, not exploits.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Legacy marketplaces take enormous cuts, bury small sellers under algorithm changes, and treat vendors as an afterthought. We flipped that model.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              VendLuxe charges the lowest fees in the industry, gives every vendor a real storefront, and provides analytics tools that were previously only available to enterprise retailers. We believe in a marketplace where quality wins, not just ad spend.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[3rem] blur-[60px]" />
            <div className="relative glass-card rounded-[3rem] p-10 space-y-6">
              {["No hidden fees", "Real-time analytics", "24/7 vendor support", "Instant payouts", "Global reach"].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
            What We Stand For
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black">
            Our <span className="text-gradient">Values</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {VALUES.map((value, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 rounded-3xl flex gap-6 group hover:border-primary/40 transition-colors"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                <value.icon className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="container mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
            How We Got Here
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black">
            The <span className="text-gradient">Journey</span>
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden md:block" />

          <div className="space-y-8">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                viewport={{ once: true }}
                className={`flex items-center gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className="flex-1 hidden md:block" />

                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 z-10 shadow-lg shadow-primary/30 hidden md:flex">
                  <span className="text-white text-xs font-black">{m.year.slice(2)}</span>
                </div>

                <div className="flex-1">
                  <div className="glass-card p-6 rounded-2xl space-y-2 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-primary uppercase tracking-widest">{m.year}</span>
                      <span className="w-1 h-1 rounded-full bg-primary/40" />
                      <h3 className="font-bold">{m.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
            The People
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black">
            Meet the <span className="text-gradient">Team</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A small team obsessed with building the best possible experience for vendors and shoppers alike.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 text-center space-y-4 group hover:border-primary/40 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mx-auto text-3xl font-black text-primary group-hover:scale-110 transition-transform">
                {member.initial}
              </div>
              <div>
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6">
        <div className="relative rounded-[3rem] overflow-hidden bg-primary py-24 px-8 md:px-20 text-center">
          <div className="absolute inset-0 bg-noise opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-black text-white">
              Ready to Join <br /> the Story?
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Whether you're a shopper looking for something unique or a creator ready to sell — there's a place for you at VendLuxe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-10 py-5 bg-white text-primary rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
              >
                Open Your Shop
              </Link>
              <Link
                to="/products"
                className="w-full sm:w-auto px-10 py-5 bg-primary-foreground/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
