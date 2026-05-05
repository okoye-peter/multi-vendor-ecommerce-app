import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    AlertCircle, 
    Menu, 
    X, 
    ChevronRight,
    ArrowLeft,
    Box,
    Layers,
    Shield,
    Zap,
    Activity
} from 'lucide-react';
import type { VendorSidebarProps } from '@/types/Index';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';

const VendorSidebar = ({ sidebarOpen, setSidebarOpen }: VendorSidebarProps) => {
    const location = useLocation();
    
    const menuItems = [
        { id: 'dashboard', label: 'Merchant Console', icon: LayoutDashboard, path: '/vendor/dashboard' },
        { id: 'products', label: 'Asset Inventory', icon: Package, path: '/vendor/products' },
        { id: 'orders', label: 'Distribution Hub', icon: ShoppingCart, path: '/vendor/orders' },
        { id: 'expiry', label: 'System Alerts', icon: AlertCircle, path: '/vendor/expiry', badge: '3' },
    ];

    const currentPath = location.pathname;

    return (
        <aside className={cn(
            "relative z-50 transition-all duration-700 ease-[0.23,1,0.32,1] border-r border-white/5 flex flex-col p-4",
            sidebarOpen ? 'w-80' : 'w-24'
        )}>
            <div className="absolute inset-0 bg-black/40 glass-elevated pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full">
                {/* Brand Area */}
                <div className="flex items-center h-20 px-4 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            <Box size={22} className="text-black" />
                        </div>
                        {sidebarOpen && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col"
                            >
                                <span className="text-lg font-black tracking-tighter uppercase leading-none">V-Nexus</span>
                                <span className="text-[9px] font-black tracking-[0.4em] text-white/20 uppercase mt-1 italic">Merchant Node</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Tactical Navigation */}
                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.path;
                        return (
                            <Link key={item.id} to={item.path} className="block group">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full flex items-center justify-start gap-4 px-5 py-5 rounded-2xl transition-all duration-500 relative overflow-hidden",
                                        isActive 
                                            ? "bg-white text-black shadow-2xl scale-[1.02]" 
                                            : "text-white/40 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "relative z-10 transition-transform duration-500",
                                        isActive ? "scale-110" : "group-hover:scale-110"
                                    )}>
                                        <Icon size={18} />
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
                                                    isActive ? "bg-black text-white" : "bg-white/10 text-white/40"
                                                )}>
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </motion.div>
                                    )}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeVendorNav"
                                            className="absolute inset-0 bg-white"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Expansion Controller */}
                <div className="pt-4 border-t border-white/5 mt-auto">
                    <Button 
                        variant="ghost" 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={cn(
                            "w-full h-16 rounded-2xl hover:bg-white/5 transition-all text-white/40 hover:text-white",
                            sidebarOpen ? "justify-between px-6" : "justify-center px-0"
                        )}
                    >
                        {sidebarOpen && <span className="text-[9px] font-black uppercase tracking-[0.3em]">Collapse Hub</span>}
                        <div className={cn("transition-transform duration-500", !sidebarOpen && "rotate-180")}>
                            <ArrowLeft size={18} />
                        </div>
                    </Button>
                </div>
            </div>
        </aside>
    );
}

export default VendorSidebar;