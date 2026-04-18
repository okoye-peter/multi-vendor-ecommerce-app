import { LayoutDashboard, Package, ShoppingCart, AlertCircle, Menu, X, ChevronRight } from 'lucide-react';
import type { VendorSidebarProps } from '@/types/Index';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const VendorSidebar = ({ sidebarOpen, setSidebarOpen }: VendorSidebarProps) => {
    const location = useLocation();
    
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/vendor/dashboard' },
        { id: 'products', label: 'Products', icon: Package, path: '/vendor/products' },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/vendor/orders' },
        { id: 'expiry', label: 'Expiry Products', icon: AlertCircle, path: '/vendor/expiry' },
    ];

    const currentPath = location.pathname;

    return (
        <aside className={cn(
            "bg-card border-r border-border transition-all duration-500 ease-in-out flex flex-col relative z-40 shadow-xl",
            sidebarOpen ? 'w-72' : 'w-0 md:w-24 overflow-hidden md:overflow-visible'
        )}>
            <div className="flex flex-col h-full">
                {/* Logo Area */}
                <div className="flex items-center justify-between p-6">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <Package size={20} className="text-white" />
                            </div>
                            <h2 className="text-xl font-black tracking-tighter">VendorHub</h2>
                        </div>
                    ) : (
                        <div className="mx-auto p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <Package size={20} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.path;
                        return (
                            <Link key={item.id} to={item.path} className="block group">
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={cn(
                                        "w-full flex items-center justify-start gap-4 py-6 rounded-2xl transition-all duration-300 relative",
                                        isActive 
                                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "transition-transform duration-300",
                                        isActive ? "scale-110" : "group-hover:scale-110"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    {sidebarOpen && (
                                        <>
                                            <span className="flex-1 text-left font-bold tracking-tight">{item.label}</span>
                                            {isActive && (
                                                <div className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />
                                            )}
                                            <ChevronRight className={cn(
                                                "w-4 h-4 opacity-0 transition-all group-hover:opacity-100",
                                                isActive ? "opacity-100" : ""
                                            )} />
                                        </>
                                    )}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Sidebar Control */}
                <div className="p-4 border-t border-border/50">
                    <Button
                        variant="ghost"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={cn(
                            "w-full flex justify-center py-6 rounded-2xl hover:bg-accent",
                            sidebarOpen ? "gap-3" : ""
                        )}
                    >
                        {sidebarOpen ? (
                            <>
                                <X size={20} className="text-muted-foreground" />
                                <span className="font-bold">Close Panel</span>
                            </>
                        ) : (
                            <Menu size={20} className="text-muted-foreground" />
                        )}
                    </Button>
                </div>
            </div>
        </aside>
    );
}

export default VendorSidebar;