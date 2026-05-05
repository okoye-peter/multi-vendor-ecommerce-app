import { useState } from 'react';
import VendorSidebar from '../VendorSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    Bell, 
    ChevronRight, 
    User as UserIcon,
    Settings,
    LogOut,
    Layers
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { VendorLayoutProps } from '@/types/Index';

const VendorLayout = ({ children }: VendorLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-white/10 relative">
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-white/[0.02] blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-white/[0.01] blur-[150px] rounded-full" />
            </div>

            <VendorSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Tactical Top Bar */}
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 relative z-40 bg-black/20 backdrop-blur-3xl">
                    <div className="flex-1 max-w-2xl mr-12">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-all duration-500" />
                            <Input 
                                placeholder="SEARCH ASSET INVENTORY..." 
                                className="pl-16 bg-white/[0.03] border-white/5 rounded-[1.25rem] h-14 focus-visible:ring-white/10 transition-all font-black text-[10px] uppercase tracking-[0.3em] text-white placeholder:text-white/10"
                            />
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
                                        M1
                                    </div>
                                    <div className="hidden xl:flex flex-col items-start text-left">
                                        <span className="text-xs font-black uppercase tracking-tight">Merchant Node</span>
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1 italic">Verified Tier 1</span>
                                    </div>
                                    <ChevronRight size={14} className="text-white/10 transition-transform group-data-[state=open]:rotate-90 group-hover:text-white/30" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72 p-4 mt-4 border-white/10 bg-black/90 backdrop-blur-3xl rounded-[2rem] shadow-2xl">
                                <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.4em] px-4 py-4 text-white/20 italic">Merchant Operations</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="p-4 cursor-pointer rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest text-white/60 hover:bg-white hover:text-black transition-all">
                                    <UserIcon size={16} />
                                    Merchant Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-4 cursor-pointer rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest text-white/60 hover:bg-white hover:text-black transition-all">
                                    <Layers size={16} />
                                    Asset Parameters
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="p-4 cursor-pointer rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all">
                                    <LogOut size={16} />
                                    De-authorize Node
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-12 relative">
                    <div className="max-w-[1600px] mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
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
}

export default VendorLayout;