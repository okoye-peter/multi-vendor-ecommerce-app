import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, ShieldCheck, Zap, Globe, Loader2 } from "lucide-react";
import ProductCard from "../../components/ui/ProductCard";
import { useGetProductsQuery } from "../../store/features/ProductApi";

const Home = () => {
  const { data: productsData, isLoading } = useGetProductsQuery({ limit: 4 });

  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] border border-white/5 rounded-full pointer-events-none"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 w-[1000px] h-[1000px] border border-white/5 rounded-full pointer-events-none"
        />

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest">
              <Zap className="w-4 h-4 fill-primary" />
              <span>New Season Arrival</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-black leading-tight">
              Elevate Your <br />
              <span className="text-gradient">Everyday</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Discover a curated collection of premium products from the world's most innovative independent vendors.
            </p>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/products" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold btn-premium flex items-center justify-center space-x-2 group">
                <span>Start Shopping</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-full blur-[100px] animate-pulse-slow" />
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop" 
                alt="Featured Product"
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_50px_50px_rgba(0,0,0,0.5)] animate-float"
              />
              {/* Floating badges */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-20 -right-4 glass-card p-4 rounded-2xl z-20"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Verified Vendor</p>
                    <p className="text-[10px] text-muted-foreground">Premium Quality</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Globe, title: "Global Shipping", desc: "Premium delivery to over 120 countries worldwide." },
            { icon: ShoppingBag, title: "Curated Selection", desc: "Every product is handpicked for its design and quality." },
            { icon: ShieldCheck, title: "Secure Payments", desc: "Multi-layer encryption for your peace of mind." },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 rounded-3xl group hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl">Trending <span className="text-gradient">Now</span></h2>
            <p className="text-muted-foreground">Hand-picked by our editors for the modern lifestyle.</p>
          </div>
          <Link to="/products" className="group flex items-center space-x-2 text-primary font-bold">
            <span>View All</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productsData?.data?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6">
        <div className="relative rounded-[3rem] overflow-hidden bg-primary py-24 px-8 md:px-20 text-center">
          <div className="absolute inset-0 bg-noise opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-black text-white">
              Become a Vendor and <br /> Grow Your Brand
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Join our exclusive network of creators and reach thousands of customers who value quality and independent design.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-white text-primary rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform">
                Open Your Shop
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 bg-primary-foreground/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/10 transition-all">
                Success Stories
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
