import { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, Shield, Truck, ChevronRight, Star, Users, Store } from 'lucide-react';
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
                        <div className={`h-full bg-gradient-to-r ${slide.bg} flex items-center justify-center`}>
                            <div className="px-4 text-center text-white">
                                <h1 className="mb-4 text-5xl font-bold md:text-7xl animate-fade-in">
                                    {slide.title}
                                </h1>
                                <p className="mb-8 text-xl md:text-2xl opacity-90">
                                    {slide.subtitle}
                                </p>
                                <Link to="/products" className="text-gray-900 bg-white border-0 btn btn-lg hover:bg-gray-100">
                                    {slide.cta}
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Slide Indicators */}
                <div className="absolute flex gap-2 transform -translate-x-1/2 bottom-8 left-1/2">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? 'bg-white w-8' : 'bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Features Bar */}
            <div className="py-8 bg-base-200">
                <div className="px-4 mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 transition-shadow rounded-lg bg-base-100 hover:shadow-lg">
                                <div className="text-primary">{feature.icon}</div>
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
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold">Shop by Category</h2>
                        <p className="text-lg opacity-70">Explore our diverse range of products</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
                        {categories.map((category, index) => (
                            <div
                                key={index}
                                className="cursor-pointer group"
                            >
                                <div className={`aspect-square rounded-2xl bg-gradient-to-br ${category.color} p-8 flex flex-col items-center justify-center text-white transform transition-all hover:scale-105 hover:shadow-2xl`}>
                                    <div className="mb-4 text-6xl transition-transform group-hover:scale-110">
                                        {category.icon}
                                    </div>
                                    <h3 className="text-lg font-bold">{category.name}</h3>
                                    <p className="text-sm opacity-90">{category.count} items</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Vendors */}
            <section className="px-4 py-16 bg-base-200">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold">Featured Vendors</h2>
                        <p className="text-lg opacity-70">Shop from our top-rated sellers</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {featuredVendors.map((vendor, index) => (
                            <div key={index} className="transition-shadow shadow-xl card bg-base-100 hover:shadow-2xl">
                                <div className="items-center text-center card-body">
                                    <div className="mb-4 text-6xl">{vendor.image}</div>
                                    <h3 className="card-title">{vendor.name}</h3>
                                    <div className="flex items-center gap-1 text-warning">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold">{vendor.rating}</span>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-sm opacity-70">
                                        <span>{vendor.products} Products</span>
                                        <span>{vendor.sales} Sales</span>
                                    </div>
                                    <button className="w-full mt-4 btn btn-primary btn-sm">
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
                    <div className="text-white shadow-2xl card bg-gradient-to-r from-primary to-secondary">
                        <div className="items-center py-16 text-center card-body">
                            <Store className="w-16 h-16 mb-4" />
                            <h2 className="mb-4 text-4xl card-title">Become a Vendor</h2>
                            <p className="max-w-2xl mb-8 text-xl">
                                Join thousands of successful sellers and start your journey with us today.
                                Zero listing fees for the first month!
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <button className="bg-white border-0 btn btn-lg text-primary hover:bg-gray-100">
                                    Start Selling
                                </button>
                                <button className="text-white border-white btn btn-lg btn-outline hover:bg-white hover:text-primary">
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
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingBag className="w-8 h-8 text-primary" />
                                <span className="text-2xl font-bold">MarketHub</span>
                            </div>
                            <p className="opacity-70">
                                Your trusted multi-vendor marketplace for everything you need.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-bold">Shop</h3>
                            <ul className="space-y-2 opacity-70">
                                <li><Link to={'/products'} className="hover:text-primary">All Products</Link></li>
                                <li><a href="#" className="hover:text-primary">Categories</a></li>
                                <li><a href="#" className="hover:text-primary">Deals</a></li>
                                <li><a href="#" className="hover:text-primary">New Arrivals</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-bold">Sell</h3>
                            <ul className="space-y-2 opacity-70">
                                <li><a href="#" className="hover:text-primary">Become a Vendor</a></li>
                                <li><a href="#" className="hover:text-primary">Vendor Dashboard</a></li>
                                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary">Resources</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-bold">Support</h3>
                            <ul className="space-y-2 opacity-70">
                                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                                <li><a href="#" className="hover:text-primary">Contact Us</a></li>
                                <li><a href="#" className="hover:text-primary">Shipping Info</a></li>
                                <li><a href="#" className="hover:text-primary">Returns</a></li>
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