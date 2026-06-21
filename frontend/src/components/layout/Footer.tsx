import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, ShoppingBag } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-white/5 pt-16 pb-8 mt-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-display font-bold">VENDLUXE</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              The premier destination for luxury multi-vendor commerce. We curate the finest products from independent creators worldwide.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-primary transition-colors">Shop All Products</Link></li>
              <li><Link to="/vendors" className="hover:text-primary transition-colors">Our Vendors</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Magazine</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-bold mb-6">Join Our Circle</h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="flex space-x-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex-grow bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/80 transition-colors">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:row items-center justify-between text-[12px] text-muted-foreground">
          <p>© 2026 VENDLUXE Commerce. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
