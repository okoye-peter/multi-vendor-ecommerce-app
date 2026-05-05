import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Phone, Briefcase, ShoppingCart } from "lucide-react";
import { useRegisterMutation } from "../../store/features/AuthApi";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/AuthSlice";

const Register = () => {
  const [role, setRole] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    repeat_password: ""
  });
  const [error, setError] = useState("");

  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.repeat_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("password", formData.password);
      data.append("type", role);

      const result = await register(data).unwrap();
      dispatch(setUser(result.user));
      navigate("/");
    } catch (err: any) {
      setError(err?.data?.message || "Registration failed. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -ml-16 -mt-16" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mb-16" />

          <div className="relative z-10 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-display font-black">Join <span className="text-gradient">VendLuxe</span></h1>
              <p className="text-muted-foreground">Choose your path in our exclusive ecosystem</p>
            </div>

            {/* Role Switcher */}
            <div className="flex p-1.5 bg-black/40 rounded-[1.5rem] border border-white/5 relative">
              <motion.div 
                animate={{ x: role === "CUSTOMER" ? 0 : "100%" }}
                className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-primary rounded-[1.2rem] shadow-lg"
              />
              <button 
                onClick={() => setRole("CUSTOMER")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-[1.2rem] z-10 font-bold transition-colors ${role === "CUSTOMER" ? "text-white" : "text-muted-foreground"}`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Customer</span>
              </button>
              <button 
                onClick={() => setRole("VENDOR")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-[1.2rem] z-10 font-bold transition-colors ${role === "VENDOR" ? "text-white" : "text-muted-foreground"}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Vendor</span>
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Alex Rivera"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="alex@lux.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-sm text-white"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="repeat_password"
                      required
                      value={formData.repeat_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-1">
                <input type="checkbox" required className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary" />
                <span className="text-[10px] text-muted-foreground font-bold">I AGREE TO THE <button type="button" className="text-primary hover:underline">TERMS OF SERVICE</button> AND <button type="button" className="text-primary hover:underline">PRIVACY POLICY</button></span>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold btn-premium shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <p className="text-center text-muted-foreground text-sm">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
