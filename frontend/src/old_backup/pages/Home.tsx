import { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Shield, 
  Truck, 
  ChevronRight, 
  Star, 
  Users, 
  Store, 
  Sparkles,
  ArrowRight,
  Globe,
  Zap,
  Activity,
  Box,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

const HomePage = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
    const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
    const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

    const categories = [
        { name: 'Core Electronics', icon: <Zap />, count: '2.3k', desc: 'High-performance hardware & tactical gear.' },
        { name: 'Apparel Systems', icon: <Layers />, count: '5.6k', desc: 'Advanced textile engineering for modern life.' },
        { name: 'Living Modules', icon: <Box />, count: '1.2k', desc: 'Architectural interior components.' },
        { name: 'Skin Optimization', icon: <Sparkles />, count: '3.4k', desc: 'Molecular-level personal care.' },
        { name: 'Kinetic Gear', icon: <Activity />, count: '0.9k', desc: 'Performance-enhancing sporting assets.' },
        { name: 'Digital Play', icon: <Globe />, count: '2.1k', desc: 'Virtual immersive entertainment.' },
    ];

    const featuredVendors = [
        { name: 'TechHub', rating: 4.8, products: 156, image: '🏢', sales: '10K+', tags: ['Verified'] },
        { name: 'Nordic', rating: 4.9, products: 234, image: '🧤', sales: '15K+', tags: ['Eco'] },
        { name: 'Aura', rating: 4.7, products: 189, image: '🌿', sales: '8K+', tags: ['Design'] },
        { name: 'Luna', rating: 4.9, products: 145, image: '✨', sales: '12K+', tags: ['Luxury'] },
    ];

    return (
        <div ref={containerRef} className="relative min-h-screen bg-background text-foreground selection:bg-white/20">
            {/* Background Grain & Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 noise-bg opacity-[0.03]" />
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-white/[0.02] blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-white/[0.01] blur-[150px] rounded-full" />
            </div>

            {/* Immersive Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                <motion.div 
                    style={{ scale: springScale, opacity }}
                    className="container px-4 mx-auto relative z-10 text-center"
                >
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Badge variant="outline" className="mb-8 px-6 py-2 rounded-full border-white/10 glass text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
                            Protocol Version 1.0.4
                        </Badge>
                    </motion.div>

                    <motion.h1 
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="mb-10 text-7xl md:text-9xl lg:text-[13rem] font-black tracking-tighter leading-[0.8] uppercase text-gradient"
                    >
                        Asset <br /> <span className="opacity-20">Exchange</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mb-16 text-lg md:text-xl font-medium text-white/40 max-w-2xl mx-auto leading-relaxed"
                    >
                        A high-fidelity multi-vendor environment architected for the next generation of global commerce. Precision, security, and absolute performance.
                    </motion.p>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-wrap items-center justify-center gap-6"
                    >
                        <Button asChild size="lg" className="h-20 rounded-[1.5rem] px-12 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                            <Link to="/products">
                                Access Marketplace
                                <ArrowRight className="ml-3 w-5 h-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-20 rounded-[1.5rem] px-12 glass border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                            Partner Integration
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Animated Background Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div 
                        animate={{ 
                            rotate: 360,
                            transition: { duration: 100, repeat: Infinity, ease: "linear" }
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] border border-white/[0.03] rounded-full" 
                    />
                    <motion.div 
                        animate={{ 
                            rotate: -360,
                            transition: { duration: 150, repeat: Infinity, ease: "linear" }
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border border-white/[0.02] rounded-full" 
                    />
                </div>
            </section>

            {/* Live Metrics Grid */}
            <section className="py-24 border-y border-white/5 glass">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                        {[
                            { label: "Active Nodes", value: "2,481", icon: <Globe /> },
                            { label: "Global Throughput", value: "$4.2M/hr", icon: <Activity /> },
                            { label: "Verified Partners", value: "156", icon: <Shield /> },
                            { label: "Transit Efficiency", value: "99.9%", icon: <Truck /> }
                        ].map((stat, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i} 
                                className="flex flex-col items-center text-center space-y-4"
                            >
                                <div className="p-3 rounded-xl bg-white/5 text-white/40">
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Asset Classes Grid */}
            <section className="py-40 px-4 md:px-8">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10">
                        <div className="max-w-2xl space-y-6">
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                                Curated <br /><span className="opacity-20">Classifications</span>
                            </h2>
                            <p className="text-white/40 font-medium text-lg leading-relaxed">
                                Our taxonomic architecture ensures every asset is vetted and categorized with mathematical precision. Discover the next tier of acquisition.
                            </p>
                        </div>
                        <Link to="/products" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white transition-all">
                            View All Assets
                            <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((category, index) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                key={index}
                            >
                                <Link
                                    to="/products"
                                    className="group relative block aspect-[4/5] rounded-[3rem] overflow-hidden glass hover-lift border border-white/5"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                                    <div className="absolute inset-0 p-12 flex flex-col justify-end">
                                        <div className="p-4 rounded-2xl bg-white text-black w-fit mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-white/20">
                                            {category.icon}
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tighter uppercase mb-4 group-hover:translate-x-2 transition-transform duration-500">
                                            {category.name}
                                        </h3>
                                        <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[80%] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                            {category.desc}
                                        </p>
                                    </div>
                                    <div className="absolute top-12 right-12 text-[10px] font-black uppercase tracking-widest text-white/20">
                                        {category.count} Units
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Operational Feed (Featured Vendors) */}
            <section className="py-40 px-4 md:px-8 border-t border-white/5 relative">
                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="text-center mb-32 space-y-6">
                        <Badge className="bg-white text-black font-black uppercase tracking-[0.2em] text-[9px] px-6 py-2 rounded-full">Primary Nodes</Badge>
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase">Market Controllers</h2>
                        <p className="text-white/40 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                            Elite vendors operating with maximum transparency and fulfillment precision.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {featuredVendors.map((vendor, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={index}
                            >
                                <Card className="group glass border-white/5 hover:border-white/20 transition-all duration-500 rounded-[3rem] overflow-hidden">
                                    <CardContent className="p-12 flex flex-col items-center text-center">
                                        <div className="h-28 w-28 flex items-center justify-center rounded-[2.5rem] bg-white/5 text-5xl mb-10 group-hover:scale-110 transition-transform group-hover:rotate-6 duration-500">
                                            {vendor.image}
                                        </div>
                                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{vendor.name}</h3>
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest text-white/40">
                                                <Star className="w-3 h-3 fill-white text-white" />
                                                <span>{vendor.rating} Score</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                            <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">{vendor.sales} Rep</span>
                                        </div>
                                        <Button asChild variant="outline" className="w-full h-14 rounded-2xl border-white/10 glass font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all">
                                            <Link to="/products">Sync Connection</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Strategic Onboarding */}
            <section className="py-40 px-4 md:px-8">
                <div className="container mx-auto max-w-6xl">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="relative p-12 md:p-32 rounded-[5rem] bg-white text-black overflow-hidden group transition-all duration-1000"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.1),transparent)]" />
                        <div className="relative z-10 text-center space-y-10">
                            <h2 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-12">Expand <br /> The Network</h2>
                            <p className="text-xl font-medium text-black/60 mb-16 max-w-2xl mx-auto leading-relaxed">
                                Architect your own node within our multi-vendor ecosystem. High-performance tooling for modern merchants.
                            </p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <Button size="lg" className="h-20 rounded-[1.5rem] px-16 bg-black text-white hover:bg-black/90 font-black uppercase tracking-widest text-xs shadow-2xl transition-all hover:scale-105">
                                    Initialize Integration
                                </Button>
                                <Button variant="outline" size="lg" className="h-20 rounded-[1.5rem] px-16 border-black/20 text-black hover:bg-black/5 font-black uppercase tracking-widest text-xs transition-all">
                                    Protocol Docs
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer System */}
            <footer className="py-32 px-4 md:px-8 border-t border-white/5 relative overflow-hidden">
                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="grid grid-cols-1 gap-20 lg:grid-cols-4 mb-32">
                        <div className="lg:col-span-1 space-y-10">
                            <Link to="/" className="flex items-center gap-3 group">
                                <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center">
                                    <ShoppingBag size={20} />
                                </div>
                                <span className="text-2xl font-black tracking-tighter uppercase">Protocol</span>
                            </Link>
                            <p className="text-white/40 font-medium leading-relaxed text-sm">
                                The architectural standard for next-generation multi-vendor digital asset acquisition and exchange.
                            </p>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <motion.div 
                                        whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,1)", color: "rgba(0,0,0,1)" }}
                                        key={i} 
                                        className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer transition-all duration-300 text-white/40"
                                    >
                                        <Activity size={18} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 lg:col-span-2">
                            <div className="space-y-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Marketplace</h3>
                                <ul className="space-y-5">
                                    {['Live Index', 'Vendor Hub', 'New Drops', 'Archive'].map(item => (
                                        <li key={item}><Link to="#" className="text-xs text-white/40 hover:text-white transition-all font-black uppercase tracking-[0.1em]">{item}</Link></li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Operational</h3>
                                <ul className="space-y-5">
                                    {['Sell on Protocol', 'Merchant API', 'Security Specs', 'Terms'].map(item => (
                                        <li key={item}><Link to="#" className="text-xs text-white/40 hover:text-white transition-all font-black uppercase tracking-[0.1em]">{item}</Link></li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Newsletter</h3>
                            <p className="text-xs text-white/40 font-medium leading-relaxed">Join the encrypted dispatch for tactical market updates.</p>
                            <div className="space-y-3">
                                <input 
                                    type="email" 
                                    placeholder="IDENTITY@PROTOCOL.COM" 
                                    className="w-full h-16 glass border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-[0.2em] focus:ring-2 focus:ring-white/20 outline-none transition-all placeholder:text-white/10"
                                />
                                <Button className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px]">Sync Email</Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                            &copy; 2024 Protocol Systems • All Rights Reserved
                        </p>
                        <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                            <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                            <Link to="#" className="hover:text-white transition-colors">Legal</Link>
                            <Link to="#" className="hover:text-white transition-colors">Status</Link>
                        </div>
                    </div>
                </div>

                {/* Subtle Footer Ambient Light */}
                <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />
            </footer>
        </div>
    );
};

export default HomePage;