import React, { useState } from 'react';
import { 
    User, 
    Settings, 
    Bell, 
    Shield, 
    CreditCard, 
    LogOut, 
    Camera, 
    ChevronRight, 
    Mail, 
    Phone, 
    MapPin, 
    Key,
    Activity,
    Layers,
    Box,
    Zap,
    Globe,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/cn';

const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    
    const user = {
        name: 'Alex Rivera',
        email: 'alex.rivera@nexus.node',
        role: 'Premium Node',
        joined: 'Jan 2024',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&h=200&auto=format&fit=crop',
        bio: 'Architecting digital ecosystems and high-fidelity commerce protocols.'
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: [0.23, 1, 0.32, 1]
            }
        }
    };

    return (
        <div className="min-h-screen pt-40 pb-32 bg-background selection:bg-white/10 relative overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] noise-bg z-0" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-white/[0.01] blur-[200px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-white/[0.01] blur-[200px] rounded-full" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-12"
                >
                    {/* Profile Sidebar */}
                    <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
                        <Card className="border-white/5 bg-black/40 glass rounded-[3rem] overflow-hidden">
                            <CardContent className="p-10 text-center">
                                <div className="relative mx-auto w-40 h-40 mb-8 group">
                                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/20 to-transparent animate-pulse" />
                                    <img 
                                        src={user.avatar} 
                                        alt={user.name} 
                                        className="w-full h-full object-cover rounded-[2.5rem] grayscale hover:grayscale-0 transition-all duration-700 border border-white/10"
                                    />
                                    <button className="absolute bottom-2 right-2 h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl">
                                        <Camera size={18} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black tracking-tighter uppercase">{user.name}</h2>
                                    <Badge variant="outline" className="px-4 py-1 rounded-full border-white/10 glass text-[9px] font-black uppercase tracking-[0.3em] text-white/40 italic">
                                        {user.role}
                                    </Badge>
                                </div>
                                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Reputation</p>
                                        <p className="text-xl font-black">4.9k</p>
                                    </div>
                                    <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Activity</p>
                                        <p className="text-xl font-black">156</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/5 bg-black/40 glass rounded-[3rem] overflow-hidden">
                            <CardContent className="p-4">
                                <div className="space-y-1">
                                    {[
                                        { icon: User, label: 'Identity Matrix', active: true },
                                        { icon: Settings, label: 'Core Parameters' },
                                        { icon: Bell, label: 'Signal Protocols' },
                                        { icon: Shield, label: 'Security Firewall' },
                                        { icon: CreditCard, label: 'Allocation Ledger' }
                                    ].map((item, i) => (
                                        <button 
                                            key={i}
                                            className={cn(
                                                "w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300 group",
                                                item.active ? "bg-white text-black" : "text-white/40 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <item.icon size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                                            </div>
                                            <ChevronRight size={14} className={cn("transition-transform group-hover:translate-x-1", item.active ? "text-black/20" : "text-white/10")} />
                                        </button>
                                    ))}
                                    <div className="pt-4 mt-4 border-t border-white/5">
                                        <button className="w-full flex items-center gap-4 p-6 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group">
                                            <LogOut size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">De-authorize Session</span>
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Main Content */}
                    <motion.div variants={itemVariants} className="lg:col-span-8 space-y-12">
                        <Tabs defaultValue="identity" className="space-y-12">
                            <TabsList className="h-20 bg-black/40 glass border-white/5 p-2 rounded-[1.5rem] gap-2">
                                <TabsTrigger value="identity" className="flex-1 rounded-xl h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">Identity</TabsTrigger>
                                <TabsTrigger value="parameters" className="flex-1 rounded-xl h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">Parameters</TabsTrigger>
                                <TabsTrigger value="history" className="flex-1 rounded-xl h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="identity" className="space-y-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="space-y-1">
                                            <h3 className="text-4xl font-black tracking-tighter uppercase">Identity Matrix</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Core node specifications</p>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="h-12 rounded-xl glass border-white/5 font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                        >
                                            {isEditing ? 'Sync Matrix' : 'Modify Logic'}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Display Narrative</Label>
                                            <div className="relative group">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                                <Input 
                                                    disabled={!isEditing}
                                                    defaultValue={user.name}
                                                    className="pl-14 h-16 rounded-2xl glass border-white/5 font-black text-xs uppercase tracking-widest focus:bg-white/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Signal Terminal</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                                <Input 
                                                    disabled={!isEditing}
                                                    defaultValue={user.email}
                                                    className="pl-14 h-16 rounded-2xl glass border-white/5 font-black text-xs tracking-widest focus:bg-white/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Communication Link</Label>
                                            <div className="relative group">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                                <Input 
                                                    disabled={!isEditing}
                                                    placeholder="+1 (NODE) PROTOCOL"
                                                    className="pl-14 h-16 rounded-2xl glass border-white/5 font-black text-xs tracking-widest focus:bg-white/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Physical Vector</Label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                                <Input 
                                                    disabled={!isEditing}
                                                    placeholder="Sector 7G, Nexus Prime"
                                                    className="pl-14 h-16 rounded-2xl glass border-white/5 font-black text-xs uppercase tracking-widest focus:bg-white/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Node Objective (Bio)</Label>
                                        <textarea 
                                            disabled={!isEditing}
                                            defaultValue={user.bio}
                                            className="w-full h-40 p-8 rounded-[2rem] glass border border-white/5 font-medium text-white/60 focus:bg-white/5 outline-none transition-all resize-none italic"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8 pt-8 border-t border-white/5">
                                    <div className="space-y-1 px-2">
                                        <h3 className="text-2xl font-black tracking-tighter uppercase">Auth Keys</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Credential management</p>
                                    </div>
                                    <Card className="border-white/5 bg-white/[0.02] rounded-[2.5rem]">
                                        <CardContent className="p-8 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                                                    <Key size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-tight">Security Credentials</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Last recalibrated 14 days ago</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="h-12 rounded-xl border-white/10 glass font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                                                Recalibrate
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
