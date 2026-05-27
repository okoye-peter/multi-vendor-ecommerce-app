import React, { useState } from 'react';
import { 
  Menu, 
  ArrowLeft, 
  Home, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Bell,
  Search,
  ChevronRight,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Shield,
  Zap,
  Activity,
  Layers,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  id: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');

  const navItems: NavItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Nexus Dashboard' },
    { id: 'users', icon: <Users size={18} />, label: 'Node Registry', badge: '12' },
    { id: 'orders', icon: <ShoppingCart size={18} />, label: 'Relay Ledger', badge: '5' },
    { id: 'analytics', icon: <Activity size={18} />, label: 'Market Diagnostics' },
    { id: 'settings', icon: <Settings size={18} />, label: 'System Parameters' },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-white/10 relative">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-white/[0.02] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-white/[0.01] blur-[150px] rounded-full" />
      </div>

      {/* High-Fidelity Sidebar */}
      <aside
        className={cn(
          "relative z-50 transition-all duration-700 ease-[0.23,1,0.32,1] border-r border-white/5 flex flex-col p-4",
          sidebarOpen ? 'w-80' : 'w-24'
        )}
      >
        <div className="absolute inset-0 bg-black/40 glass-elevated pointer-events-none" />
        
        {/* Brand Area */}
        <div className="relative z-10 flex items-center h-20 px-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <Shield size={22} className="text-black" />
            </div>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="text-lg font-black tracking-tighter uppercase leading-none">Antigravity</span>
                <span className="text-[9px] font-black tracking-[0.4em] text-white/20 uppercase mt-1 italic">Admin Protocol</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Tactical Navigation */}
        <nav className="relative z-10 flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "group w-full flex items-center gap-4 px-5 py-5 rounded-2xl transition-all duration-500 relative overflow-hidden",
                activeNav === item.id 
                  ? "bg-white text-black shadow-2xl scale-[1.02]" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className={cn(
                "relative z-10 transition-transform duration-500",
                activeNav === item.id ? "scale-110" : "group-hover:scale-110"
              )}>
                {item.icon}
              </div>
              
              {sidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative z-10 flex-1 flex items-center justify-between"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                  {item.badge && (
                    <Badge className={cn(
                      "text-[9px] h-5 min-w-[20px] px-1.5 font-black rounded-lg",
                      activeNav === item.id ? "bg-black text-white" : "bg-white/10 text-white/40"
                    )}>
                      {item.badge}
                    </Badge>
                  )}
                </motion.div>
              )}

              {activeNav === item.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-white"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Expansion Controller */}
        <div className="relative z-10 pt-4 border-t border-white/5 mt-auto">
          <Button 
            variant="ghost" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "w-full h-16 rounded-2xl hover:bg-white/5 transition-all text-white/40 hover:text-white",
              sidebarOpen ? "justify-between px-6" : "justify-center px-0"
            )}
          >
            {sidebarOpen && <span className="text-[9px] font-black uppercase tracking-[0.3em]">Minimize Layout</span>}
            <div className={cn("transition-transform duration-500", !sidebarOpen && "rotate-180")}>
              <ArrowLeft size={18} />
            </div>
          </Button>
        </div>
      </aside>

      {/* Main Orchestration Layer */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Tactical Top Bar */}
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 relative z-40 bg-black/20 backdrop-blur-3xl">
           <div className="flex-1 max-w-2xl mr-12">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-all duration-500" />
                    <Input 
                        placeholder="SEARCH CORE REGISTRY..." 
                        className="pl-16 bg-white/[0.03] border-white/5 rounded-[1.25rem] h-14 focus-visible:ring-white/10 transition-all font-black text-[10px] uppercase tracking-[0.3em] text-white placeholder:text-white/10"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20">
                      <kbd className="h-6 px-2 rounded bg-white/10 flex items-center text-[9px] font-black">CMD</kbd>
                      <kbd className="h-6 px-2 rounded bg-white/10 flex items-center text-[9px] font-black">K</kbd>
                    </div>
                </div>
           </div>

           <div className="flex items-center gap-6">
                <Button variant="ghost" size="icon" className="relative h-14 w-14 rounded-2xl hover:bg-white/5 group">
                    <Bell size={20} className="text-white/20 group-hover:text-white transition-colors" />
                    <span className="absolute top-4 right-4 h-2 w-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </Button>

                <div className="h-8 w-px bg-white/10 mx-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative flex items-center gap-4 px-4 rounded-[1.25rem] hover:bg-white/5 h-16 transition-all group">
                             <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-xs shadow-xl">
                                JD
                             </div>
                             <div className="hidden xl:flex flex-col items-start text-left">
                                <span className="text-xs font-black uppercase tracking-tight">John Doe</span>
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1 italic">Super Admin</span>
                             </div>
                             <ChevronRight size={14} className="text-white/10 transition-transform group-data-[state=open]:rotate-90 group-hover:text-white/30" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 p-4 mt-4 border-white/10 bg-black/90 backdrop-blur-3xl rounded-[2rem] shadow-2xl">
                        <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.4em] px-4 py-4 text-white/20 italic">Node Management</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="p-4 cursor-pointer rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest text-white/60 hover:bg-white hover:text-black transition-all">
                            <UserIcon size={16} />
                            Identity Index
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-4 cursor-pointer rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest text-white/60 hover:bg-white hover:text-black transition-all">
                            <Layers size={16} />
                            Taxonomy Matrix
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="p-4 cursor-pointer rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all">
                            <LogOut size={16} />
                            Terminate Session
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
           </div>
        </header>

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-auto p-12 relative">
            <div className="max-w-[1600px] mx-auto">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeNav}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                 >
                    {children}
                 </motion.div>
               </AnimatePresence>
            </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;