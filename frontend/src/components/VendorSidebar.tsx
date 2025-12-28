import { LayoutDashboard, Package, ShoppingCart, AlertCircle, Menu, X } from 'lucide-react';
import type { VendorSidebarProps } from '../types/Index';
import { Link } from 'react-router';

const VendorSidebar = ({ sidebarOpen, setSidebarOpen }: VendorSidebarProps) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/vendor/dashboard' },
        { id: 'products', label: 'Products', icon: Package, path: '/vendor/products' },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/vendor/orders' },
        { id: 'expiry', label: 'Expiry Products', icon: AlertCircle, path: '/vendor/expiry' },
        // { id: 'returns', label: 'Returns', icon: RotateCcw, path: '/vendor/returns' },
    ];

    // Get current path to highlight active menu item
    const currentPath = window.location.pathname;

    return (
        <aside className={`bg-base-100 shadow-xl transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 md:w-20'}`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    {sidebarOpen && <h2 className="text-2xl font-bold text-primary">VendorHub</h2>}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="btn btn-ghost btn-sm"
                    >
                        {sidebarOpen ? <X /> : <Menu />}
                    </button>
                </div>

                <nav className="flex-1 p-4">
                    <ul className="gap-2 menu menu-vertical">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPath === item.path;
                            return (
                                <li key={item.id}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center justify-start gap-3 btn btn-ghost ${isActive ? 'btn-active' : ''}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {sidebarOpen && <span>{item.label}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* {sidebarOpen && (
                    <div className="p-4 border-t border-base-300">
                        <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                                <div className="w-10 rounded-full bg-primary text-primary-content">
                                    <span className="text-xl">V</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">Vendor Name</p>
                                <p className="text-xs opacity-70">vendor@example.com</p>
                            </div>
                        </div>
                    </div>
                )} */}
            </div>
        </aside>
    );
}

export default VendorSidebar