import React, { useState } from 'react';
import { Menu, ArrowLeft, Home, Users, ShoppingCart, BarChart3, Settings, Bell, Search, ChevronDown } from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('Dashboard');

  const navItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard' },
    { icon: <Users size={20} />, label: 'Users', badge: '12' },
    { icon: <ShoppingCart size={20} />, label: 'Orders', badge: '5' },
    { icon: <BarChart3 size={20} />, label: 'Analytics' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } shadow-xl transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4">
          {sidebarOpen && <h1 className="text-2xl font-bold text-primary">Admin</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost btn-sm btn-square"
          >
            {sidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeNav === item.label
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-200'
              }`}
            >
              {item.icon}
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="badge badge-sm badge-secondary">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        {sidebarOpen && (
          <div className="p-4 border-t border-base-300">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="w-10 rounded-full bg-primary text-primary-content">
                  <span className="text-sm">JD</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">John Doe</p>
                <p className="text-xs text-base-content/60">Admin</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="shadow-lg">
          <div className="flex items-center justify-end gap-2 p-4">
            <button className="btn btn-ghost btn-circle">
              <div className="indicator">
                <Bell size={20} />
                <span className="badge badge-xs badge-primary indicator-item"></span>
              </div>
            </button>

            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle">
                <div className="avatar placeholder">
                  <div className="w-10 rounded-full bg-primary text-primary-content">
                    <span className="text-xs">JD</span>
                  </div>
                </div>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2"
              >
                <li><a>Profile</a></li>
                <li><a>Settings</a></li>
                <li><a>Logout</a></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Main Content Area - Children Slot */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


// App component showing usage
// const App: React.FC = () => {
//     return (
//         <AdminLayout>
//             <DashboardContent />
//         </AdminLayout>
//     );
// };

// export default App;
export default AdminLayout;