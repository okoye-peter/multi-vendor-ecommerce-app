import { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const HomePage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const categories = [
        { name: 'Electronics', icon: '📱', count: '2,345', color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-600' },
        { name: 'Fashion', icon: '👔', count: '5,678', color: 'from-pink-500/20 to-rose-500/20', textColor: 'text-rose-600' },
        { name: 'Home', icon: '🏡', count: '1,234', color: 'from-green-500/20 to-emerald-500/20', textColor: 'text-emerald-600' },
        { name: 'Beauty', icon: '💄', count: '3,456', color: 'from-purple-500/20 to-violet-500/20', textColor: 'text-violet-600' },
        { name: 'Sports', icon: '⚽', count: '987', color: 'from-orange-500/20 to-amber-500/20', textColor: 'text-amber-600' },
        { name: 'Toys', icon: '🎮', count: '2,109', color: 'from-red-500/20 to-pink-500/20', textColor: 'text-pink-600' },
    ];

    const featuredVendors = [
        { name: 'TechHub Store', rating: 4.8, products: 156, image: '🏪', sales: '10K+', tags: ['Tech', 'Gadgets'] },
        { name: 'Fashion Forward', rating: 4.9, products: 234, image: '👗', sales: '15K+', tags: ['Menswear', 'Trendy'] },
        { name: 'Home Essentials', rating: 4.7, products: 189, image: '🛋️', sales: '8K+', tags: ['Decor', 'Kitchen'] },
        { name: 'Beauty Bliss', rating: 4.9, products: 145, image: '💅', sales: '12K+', tags: ['Makeup', 'Skincare'] },
    ];

    const heroSlides = [
        {
            title: 'Summer Collection 2024',
            subtitle: 'Discover the latest trends in sustainable fashion',
            cta: 'Shop Now',
            bg: 'from-indigo-600 via-purple-600 to-pink-600',
        },
        {
            title: 'Refining Electronics',
            subtitle: 'Premium gadgets with cutting-edge technology',
            cta: 'Explore Deals',
            bg: 'from-blue-600 via-cyan-600 to-teal-600',
        },
        {
            title: 'Empower Your Space',
            subtitle: 'Become a vendor and reach millions of customers',
            cta: 'Start Selling',
            bg: 'from-emerald-600 via-green-600 to-teal-600',
        },
    ];

    const features = [
        { icon: <Truck className="w-5 h-5 text-primary" />, title: 'Free Shipping', desc: 'On orders over $50' },
        { icon: <Shield className="w-5 h-5 text-primary" />, title: 'Secure Payment', desc: '100% Protected' },
        { icon: <TrendingUp className="w-5 h-5 text-primary" />, title: 'Best Prices', desc: 'Competitive Rates' },
        { icon: <Users className="w-5 h-5 text-primary" />, title: 'Priority Support', desc: '24/7 Service' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <section className="relative h-[650px] md:h-[750px] overflow-hidden">
                {heroSlides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                            currentSlide === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                        }`}
                    >
                        <div className={`h-full bg-gradient-to-br ${slide.bg} flex items-center justify-center relative`}>
                            {/* Modern Decorative shapes */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[120px] animate-pulse"></div>
                                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-black/10 rounded-full blur-[150px] animate-pulse"></div>
                            </div>

                            <div className="container px-6 relative z-10 mx-auto">
                                <div className="max-w-4xl mx-auto text-center text-white">
                                    <Badge variant="secondary" className="mb-6 px-4 py-1.5 bg-white/10 backdrop-blur-md border-white/20 text-white animate-fade-in">
                                        Limited Time Offer
                                    </Badge>
                                    <h1 className="mb-6 text-6xl font-extrabold tracking-tight md:text-8xl lg:text-9xl animate-fade-in-up">
                                        {slide.title}
                                    </h1>
                                    <p className="mb-10 text-xl font-light md:text-2xl text-white/80 max-w-2xl mx-auto animate-fade-in-up stagger-1">
                                        {slide.subtitle}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-4 animate-scale-in stagger-2">
                                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-7 text-lg font-bold shadow-xl shadow-black/10 hover-lift">
                                            {slide.cta}
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                        <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-7 text-lg font-semibold backdrop-blur-sm transition-smooth">
                                            Learn More
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Dots Navigation */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 transition-all duration-500 rounded-full ${
                                currentSlide === index ? 'bg-white w-12' : 'bg-white/30 w-2 hover:bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            </section>

            {/* Trust Features Bar */}
            <section className="py-12 -mt-12 relative z-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    <Card className="border-none shadow-2xl shadow-indigo-500/10 bg-background/95 backdrop-blur-xl">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-border/10">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-4 p-8 transition-colors hover:bg-primary/[0.02]">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm tracking-tight">{feature.title}</h3>
                                            <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-24 px-4 overflow-hidden">
                <div className="container mx-auto max-w-7xl">
                    <div className="mb-16 text-center animate-fade-in-up">
                        <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px] font-black">
                            Collections
                        </Badge>
                        <h2 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                            Shop by Category
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Curated collections for every aspect of your modern lifestyle
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
                        {categories.map((category, index) => (
                            <Link
                                key={index}
                                to="/products"
                                className="group relative block aspect-[4/3] rounded-[2rem] overflow-hidden"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} transition-transform duration-700 group-hover:scale-110`}></div>
                                <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center">
                                    <div className="text-7xl mb-6 transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12 transform">
                                        {category.icon}
                                    </div>
                                    <h3 className={`text-2xl font-black ${category.textColor} tracking-tight`}>{category.name}</h3>
                                    <span className="text-sm font-medium opacity-60 mt-1">{category.count} items</span>
                                </div>
                                <div className="absolute bottom-6 right-6 p-3 rounded-full bg-white/20 backdrop-blur-md opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                                    <ArrowRight className={`w-5 h-5 ${category.textColor}`} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Vendors */}
            <section className="py-24 px-4 bg-muted/30">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="text-left">
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                <Store className="w-3.5 h-3.5" />
                                <span>Verified Sellers</span>
                            </div>
                            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Top Rated Vendors</h2>
                        </div>
                        <Button variant="ghost" className="hidden md:flex group text-primary font-bold">
                            View All Vendors <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {featuredVendors.map((vendor, index) => (
                            <Card key={index} className="group border-none shadow-xl shadow-black/[0.02] hover:shadow-primary/5 transition-all duration-500 rounded-3xl overflow-hidden bg-background">
                                <CardContent className="p-8 flex flex-col items-center text-center">
                                    <div className="relative mb-6">
                                        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary/10 to-indigo-500/10 text-6xl shadow-inner group-hover:animate-float transition-all">
                                            {vendor.image}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 h-10 w-10 flex items-center justify-center rounded-full bg-background shadow-lg border border-border/10">
                                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black mb-2 tracking-tight">{vendor.name}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full text-xs font-bold">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span>{vendor.rating}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-medium">{vendor.sales} sales</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                                        {vendor.tags.map((tag, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px] font-medium py-0 px-2 text-muted-foreground border-border/50">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <Button className="w-full rounded-2xl bg-muted hover:bg-primary hover:text-white text-foreground transition-all duration-300 font-bold group/btn">
                                        Visit Store
                                        <ArrowRight className="ml-2 w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative p-12 md:p-24 rounded-[3rem] overflow-hidden text-center text-white shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-rose-600 animate-gradient"></div>
                        {/* Decorative Circles */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-50">
                            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/20 rounded-full blur-[100px] animate-pulse"></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/30 rounded-full blur-[100px] animate-pulse"></div>
                        </div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <div className="h-20 w-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-float">
                                <Store className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Start your selling journey today</h2>
                            <p className="text-xl md:text-2xl text-white/80 font-light mb-12 max-w-2xl mx-auto">
                                Join our network of successful vendors and empower your business with our cutting-edge marketplace tools.
                            </p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl px-10 py-8 text-xl font-black shadow-2xl hover-lift">
                                    Apply to Sell
                                </Button>
                                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-2xl px-10 py-8 text-xl font-bold backdrop-blur-sm transition-smooth">
                                    Success Stories
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-4 bg-background border-t border-border/50">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-24">
                        <div>
                            <Link to="/" className="flex items-center gap-2 group mb-8">
                                <div className="p-2 transition-transform h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 group-hover:scale-110">
                                    <ShoppingBag className="w-6 h-6 text-primary" />
                                </div>
                                <span className="text-2xl font-bold tracking-tighter gradient-text">
                                    MarketHub
                                </span>
                            </Link>
                            <p className="text-muted-foreground font-medium leading-relaxed">
                                The future of multi-vendor commerce. Premium products meets exceptional technology.
                            </p>
                            <div className="flex gap-4 mt-8">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-primary/10 hover:text-primary transition-all"></div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black mb-8 tracking-tight">Marketplace</h3>
                            <ul className="space-y-4">
                                {['All Products', 'Featured Dealers', 'Fresh Arrivals', 'Daily Deals'].map(item => (
                                    <li key={item}><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">{item}</a></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-black mb-8 tracking-tight">Business</h3>
                            <ul className="space-y-4">
                                {['Sell with us', 'Merchant Portal', 'Partner Program', 'Vendor API'].map(item => (
                                    <li key={item}><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">{item}</a></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-black mb-8 tracking-tight">Newsletter</h3>
                            <p className="text-muted-foreground mb-6 font-medium">Be the first to know about drops and deals.</p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="email" 
                                        placeholder="your@email.com" 
                                        className="w-full bg-muted border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <Button className="rounded-xl px-6 py-3 font-bold">Join</Button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 pt-12 border-t border-border/50 text-center flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-sm text-muted-foreground font-medium">
                            &copy; 2024 MarketHub Studio. Built for the modern web.
                        </p>
                        <div className="flex gap-8 text-sm font-bold text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                            <a href="#" className="hover:text-foreground transition-colors">Refund Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;