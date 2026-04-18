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
  LayoutDashboard
} from 'lucide-react';
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
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { icon: <Users size={20} />, label: 'Users', badge: '12' },
    { icon: <ShoppingCart size={20} />, label: 'Orders', badge: '5' },
    { icon: <BarChart3 size={20} />, label: 'Analytics' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-24'
        } relative z-40 bg-card border-r border-border transition-all duration-500 ease-in-out flex flex-col`}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between p-6">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                <BarChart3 size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter">AdminHub</h1>
            </div>
          ) : (
            <div className="mx-auto p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                <BarChart3 size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${
                activeNav === item.label
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <div className={`transition-transform duration-300 ${activeNav === item.label ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
              </div>
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left font-bold tracking-tight animate-fade-in">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className={`text-[10px] h-5 min-w-[20px] px-1 font-black ${activeNav === item.label ? 'bg-white/20 text-white' : ''}`}>
                        {item.badge}
                    </Badge>
                  )}
                  {activeNav === item.label && (
                      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 mt-auto border-t border-border/50">
             <Button 
                variant="ghost" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`w-full flex justify-center py-6 rounded-2xl hover:bg-accent ${sidebarOpen ? 'gap-3' : ''}`}
             >
                {sidebarOpen ? (
                    <>
                        <ArrowLeft size={20} className="text-muted-foreground" />
                        <span className="font-bold">Collapse</span>
                    </>
                ) : (
                    <Menu size={20} className="text-muted-foreground" />
                )}
             </Button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-8 relative z-30">
           <div className="flex-1 max-w-xl mr-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input 
                        placeholder="Search for orders, users..." 
                        className="pl-11 bg-muted/30 border-none rounded-2xl h-11 focus-visible:ring-primary/20 transition-all font-medium"
                    />
                </div>
           </div>

           <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-accent transition-all h-11 w-11">
                    <Bell size={20} className="text-muted-foreground" />
                    <Badge className="absolute top-2 right-2 h-2.5 w-2.5 p-0 bg-primary ring-2 ring-background rounded-full" />
                </Button>

                <div className="h-10 w-[1px] bg-border/50 mx-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative flex items-center gap-3 px-2 rounded-xl hover:bg-accent h-14 transition-all group">
                             <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 p-[2px]">
                                <div className="h-full w-full bg-background rounded-[10px] flex items-center justify-center font-black text-primary">
                                    JD
                                </div>
                             </div>
                             <div className="hidden md:flex flex-col items-start text-left">
                                <span className="text-sm font-black leading-none">John Doe</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Super Admin</span>
                             </div>
                             <ChevronRight size={16} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-2 mt-2 border-border/50 bg-background/95 backdrop-blur-xl">
                        <DropdownMenuLabel className="font-bold px-4 py-3">Management</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="p-3 cursor-pointer rounded-xl flex items-center gap-3">
                            <UserIcon size={18} className="text-muted-foreground" />
                            <span className="font-bold">Team Members</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-3 cursor-pointer rounded-xl flex items-center gap-3">
                            <Settings size={18} className="text-muted-foreground" />
                            <span className="font-bold">App Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="p-3 cursor-pointer rounded-xl flex items-center gap-3 text-destructive focus:text-destructive">
                            <LogOut size={18} />
                            <span className="font-bold">Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
           </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto bg-muted/20 p-8 space-y-8 animate-fade-in relative">
            <div className="max-w-[1600px] mx-auto">
               <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight mb-2 capitalize">{activeNav}</h2>
                    <p className="text-muted-foreground font-medium">Manage your marketplace operations with ease.</p>
               </div>
               {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;