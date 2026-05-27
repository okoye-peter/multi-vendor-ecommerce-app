import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Search, Menu, Heart, LogOut, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetAuthenticatedUserQuery, useLogoutMutation } from "../../store/features/AuthApi";
import { useGetCartsQuery } from "../../store/features/CartApi";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/AuthSlice";
import type { RootState } from "../../store/Index";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: userData } = useGetAuthenticatedUserQuery(undefined, {
      skip: !!user,
  });
  
  const { data: cartData } = useGetCartsQuery(undefined, {
      skip: !user && !userData?.user,
  });

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logout());
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const cartCount = cartData?.length || 0;

  return (
    <nav className={`glass-nav transition-all duration-300 ${isScrolled ? "py-3 bg-background/80" : "py-5 bg-transparent"}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShoppingBag className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight hidden sm:block">
            VEND<span className="text-primary">LUXE</span>
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
          <Link to="/vendors" className="hover:text-primary transition-colors">Vendors</Link>
          <Link to="/categories" className="hover:text-primary transition-colors">Categories</Link>
          <Link to="/about" className="hover:text-primary transition-colors">Our Story</Link>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-4">
          <Link to="/search" className="p-2 hover:bg-white/5 rounded-full transition-colors hidden sm:block">
            <Search className="w-5 h-5" />
          </Link>
          <Link to="/wishlist" className="p-2 hover:bg-white/5 rounded-full transition-colors hidden sm:block">
            <Heart className="w-5 h-5" />
          </Link>
          <Link to="/cart" className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-[10px] flex items-center justify-center rounded-full text-white font-bold animate-in">
                {cartCount}
              </span>
            )}
          </Link>

          {user || userData?.user ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                  {(user || userData?.user)?.name?.charAt(0)}
                </div>
                <span className="text-sm font-medium">{(user || userData?.user)?.name}</span>
              </Link>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-full transition-colors"
              >
                {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 px-4 py-2 bg-primary text-white hover:opacity-90 rounded-full transition-all shadow-lg shadow-primary/20">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Sign In</span>
            </Link>
          )}

          <button className="p-2 md:hidden hover:bg-white/5 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
