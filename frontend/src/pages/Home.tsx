import { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, Shield, Truck, ChevronRight, Star, Users, Store, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const categories = [
        { name: 'Electronics', icon: '📱', count: '2,345', color: 'from-blue-500 to-cyan-500' },
        { name: 'Fashion', icon: '👔', count: '5,678', color: 'from-pink-500 to-rose-500' },
        { name: 'Home & Garden', icon: '🏡', count: '1,234', color: 'from-green-500 to-emerald-500' },
        { name: 'Beauty', icon: '💄', count: '3,456', color: 'from-purple-500 to-violet-500' },
        { name: 'Sports', icon: '⚽', count: '987', color: 'from-orange-500 to-amber-500' },
        { name: 'Toys', icon: '🎮', count: '2,109', color: 'from-red-500 to-pink-500' },
    ];

    const featuredVendors = [
        { name: 'TechHub Store', rating: 4.8, products: 156, image: '🏪', sales: '10K+' },
        { name: 'Fashion Forward', rating: 4.9, products: 234, image: '👗', sales: '15K+' },
        { name: 'Home Essentials', rating: 4.7, products: 189, image: '🛋️', sales: '8K+' },
        { name: 'Beauty Bliss', rating: 4.9, products: 145, image: '💅', sales: '12K+' },
    ];

    const heroSlides = [
        {
            title: 'Summer Collection 2024',
            subtitle: 'Discover the latest trends',
            cta: 'Shop Now',
            bg: 'from-purple-600 via-pink-600 to-red-600',
        },
        {
            title: 'Electronics Sale',
            subtitle: 'Up to 50% off on selected items',
            cta: 'Explore Deals',
            bg: 'from-blue-600 via-cyan-600 to-teal-600',
        },
        {
            title: 'New Vendor Program',
            subtitle: 'Start selling with us today',
            cta: 'Become a Vendor',
            bg: 'from-green-600 via-emerald-600 to-cyan-600',
        },
    ];

    const features = [
        { icon: <Truck className="w-6 h-6" />, title: 'Free Shipping', desc: 'On orders over $50' },
        { icon: <Shield className="w-6 h-6" />, title: 'Secure Payment', desc: '100% protected' },
        { icon: <TrendingUp className="w-6 h-6" />, title: 'Best Prices', desc: 'Competitive rates' },
        { icon: <Users className="w-6 h-6" />, title: '24/7 Support', desc: 'Always here to help' },
    ];

    return (
        <div className="min-h-screen bg-base-100">
            {/* Hero Section */}
            <div className="relative h-[600px] mt-16 overflow-hidden">
                {heroSlides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === index ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <div className={`h-full bg-gradient-to-r ${slide.bg} animate-gradient flex items-center justify-center relative`}>
                            {/* Decorative Elements */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
                                <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                            </div>

                            <div className="px-4 text-center text-white relative z-10">
                                <div className="animate-fade-in-down">
                                    <h1 className="mb-4 text-5xl font-bold md:text-7xl">
                                        {slide.title}
                                    </h1>
                                </div>
                                <div className="animate-fade-in-up">
                                    <p className="mb-8 text-xl md:text-2xl opacity-90">
                                        {slide.subtitle}
                                    </p>
                                </div>
                                <div className="animate-scale-in">
                                    <Link
                                        to="/products"
                                        className="text-gray-900 bg-white border-0 btn btn-lg hover:bg-gray-100 hover-lift group"
                                    >
                                        {slide.cta}
                                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Slide Indicators */}
                <div className="absolute flex gap-2 transform -translate-x-1/2 bottom-8 left-1/2 z-20">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white w-8' : 'bg-white/50 w-3'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Features Bar */}
            <div className="py-8 bg-base-200">
                <div className="px-4 mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-4 p-4 transition-all rounded-lg bg-base-100 hover-lift animate-fade-in-up stagger-${index + 1}`}
                            >
                                <div className="text-primary p-3 rounded-full bg-primary/10">{feature.icon}</div>
                                <div>
                                    <h3 className="font-bold">{feature.title}</h3>
                                    <p className="text-sm opacity-70">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <section className="px-4 py-16">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 text-center animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold">Explore Categories</span>
                        </div>
                        <h2 className="mb-4 text-4xl font-bold">Shop by Category</h2>
                        <p className="text-lg opacity-70">Explore our diverse range of products</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
                        {categories.map((category, index) => (
                            <div
                                key={index}
                                className={`cursor-pointer group animate-scale-in stagger-${index + 1}`}
                            >
                                <div className={`aspect-square rounded-2xl bg-gradient-to-br ${category.color} p-8 flex flex-col items-center justify-center text-white transform transition-all duration-500 hover:scale-110 hover:rotate-3 hover:shadow-2xl relative overflow-hidden`}>
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                    <div className="mb-4 text-6xl transition-transform duration-500 group-hover:scale-125 relative z-10">
                                        {category.icon}
                                    </div>
                                    <h3 className="text-lg font-bold relative z-10">{category.name}</h3>
                                    <p className="text-sm opacity-90 relative z-10">{category.count} items</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Vendors */}
            <section className="px-4 py-16 bg-base-200">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 text-center animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary/10 text-secondary">
                            <Store className="w-4 h-4" />
                            <span className="text-sm font-semibold">Top Sellers</span>
                        </div>
                        <h2 className="mb-4 text-4xl font-bold">Featured Vendors</h2>
                        <p className="text-lg opacity-70">Shop from our top-rated sellers</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {featuredVendors.map((vendor, index) => (
                            <div
                                key={index}
                                className={`card-modern animate-fade-in-up stagger-${index + 1}`}
                            >
                                <div className="items-center text-center card-body">
                                    <div className="mb-4 text-6xl p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                                        {vendor.image}
                                    </div>
                                    <h3 className="card-title text-xl">{vendor.name}</h3>
                                    <div className="flex items-center gap-1 text-warning">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold">{vendor.rating}</span>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-sm opacity-70">
                                        <span>{vendor.products} Products</span>
                                        <span>{vendor.sales} Sales</span>
                                    </div>
                                    <button className="w-full mt-4 btn btn-primary btn-sm hover-scale">
                                        Visit Store
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-4 py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="relative overflow-hidden text-white shadow-2xl rounded-3xl bg-gradient-to-r from-primary to-secondary animate-gradient">
                        {/* Decorative Elements */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        </div>

                        <div className="items-center py-16 text-center card-body relative z-10">
                            <div className="p-4 mb-4 rounded-full bg-white/20 animate-float">
                                <Store className="w-16 h-16" />
                            </div>
                            <h2 className="mb-4 text-4xl card-title">Become a Vendor</h2>
                            <p className="max-w-2xl mb-8 text-xl opacity-90">
                                Join thousands of successful sellers and start your journey with us today.
                                Zero listing fees for the first month!
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <button className="bg-white border-0 btn btn-lg text-primary hover:bg-gray-100 hover-lift">
                                    Start Selling
                                </button>
                                <button className="text-white border-white btn btn-lg btn-outline hover:bg-white hover:text-primary hover-lift">
                                    Learn More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-4 py-12 bg-base-300">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-4">
                        <div className="animate-fade-in-up">
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingBag className="w-8 h-8 text-primary" />
                                <span className="text-2xl font-bold gradient-text">MarketHub</span>
                            </div>
                            <p className="opacity-70">
                                Your trusted multi-vendor marketplace for everything you need.
                            </p>
                        </div>

                        <div className="animate-fade-in-up stagger-1">
                            <h3 className="mb-4 text-lg font-bold">Shop</h3>
                            <ul className="space-y-2 opacity-70">
                                <li><Link to={'/products'} className="hover:text-primary transition-colors">All Products</Link></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Categories</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Deals</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
                            </ul>
                        </div>

                        <div className="animate-fade-in-up stagger-2">
                            <h3 className="mb-4 text-lg font-bold">Sell</h3>
                            <ul className="space-y-2 opacity-70">
                                <li><a href="#" className="hover:text-primary transition-colors">Become a Vendor</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Vendor Dashboard</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Resources</a></li>
                            </ul>
                        </div>

                        <div className="animate-fade-in-up stagger-3">
                            <h3 className="mb-4 text-lg font-bold">Support</h3>
                            <ul className="space-y-2 opacity-70">
                                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Shipping Info</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Returns</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 text-center border-t border-base-content/10 opacity-70">
                        <p>&copy; 2024 MarketHub. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;