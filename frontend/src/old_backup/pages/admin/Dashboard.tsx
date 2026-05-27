import React from 'react';
import { 
    Users, 
    DollarSign, 
    ShoppingBag, 
    Activity, 
    Plus, 
    UserPlus, 
    FileText, 
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ChevronRight,
    Filter,
    Zap,
    Globe,
    Shield,
    Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/cn';

const Dashboard: React.FC = () => {
    const stats = [
        { title: 'Total Nodes', value: '2,481', change: '+12.5%', trend: 'up', icon: Users, desc: 'Active network participants' },
        { title: 'Market Cap', value: '₦4.58M', change: '+8.2%', trend: 'up', icon: DollarSign, desc: 'Total transactional volume' },
        { title: 'Relay Load', value: '892', change: '-3.1%', trend: 'down', icon: ShoppingBag, desc: 'Orders processed 24h' },
        { title: 'System Pulse', value: '127', change: 'NOMINAL', trend: 'up', icon: Activity, desc: 'Real-time active sessions' },
    ];

    const recentOrders = [
        { id: 'LX-4821', customer: 'Alice Johnson', status: 'Completed', amount: '₦234k', type: 'CORE' },
        { id: 'LX-4822', customer: 'Bob Smith', status: 'Pending', amount: '₦156k', type: 'NODE' },
        { id: 'LX-4823', customer: 'Carol White', status: 'Processing', amount: '₦789k', type: 'ELITE' },
        { id: 'LX-4824', customer: 'David Brown', status: 'Completed', amount: '₦45k', type: 'CORE' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
        }
    };

    return (
        <div className="space-y-16 py-8">
            {/* Tactical Header */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-8 bg-white" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">System Command Level 4</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-gradient">Nexus <br /> Controller</h1>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-16 px-8 rounded-2xl glass border-white/5 font-black text-[10px] uppercase tracking-widest hover:bg-white/5">
                        <Filter className="mr-3 h-4 w-4" /> Parameters
                    </Button>
                    <Button className="h-16 px-8 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                        <Plus className="mr-3 h-4 w-4" /> Initialize Node
                    </Button>
                </div>
            </motion.div>

            {/* Tactical Stats Grid */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
                {stats.map((stat, index) => (
                    <motion.div key={stat.title} variants={itemVariants}>
                        <Card className="group relative border-white/5 bg-black/40 glass rounded-[3rem] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
                            <CardContent className="p-10">
                                <div className="flex items-start justify-between">
                                    <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black transition-all duration-500">
                                        <stat.icon size={24} />
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1 font-black text-[10px] tracking-widest px-3 py-1 rounded-full",
                                        stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                    )}>
                                        {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="mt-12 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">{stat.title}</p>
                                    <h3 className="text-5xl font-black tracking-tighter uppercase text-gradient">{stat.value}</h3>
                                    <p className="text-[9px] font-medium text-white/10 uppercase tracking-widest group-hover:text-white/30 transition-colors">{stat.desc}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Advanced Analytics & Registry */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-12 lg:grid-cols-3"
            >
                {/* Protocol Registry (Orders) */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                    <Card className="border-white/5 bg-black/40 glass rounded-[4rem] overflow-hidden">
                        <CardHeader className="p-12 pb-6 flex flex-row items-center justify-between">
                            <div className="space-y-2">
                                <CardTitle className="text-3xl font-black tracking-tighter uppercase">Protocol Registry</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Validated market transactions</CardDescription>
                            </div>
                            <Button variant="ghost" className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest group">
                                View Full Archive <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead className="h-16 px-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Hash ID</TableHead>
                                        <TableHead className="h-16 px-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Identity</TableHead>
                                        <TableHead className="h-16 px-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Status</TableHead>
                                        <TableHead className="h-16 px-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.map((order, i) => (
                                        <TableRow key={order.id} className="group border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <TableCell className="px-12 py-8 font-mono text-[10px] font-black tracking-widest text-white/40 group-hover:text-white transition-colors">
                                                {order.id}
                                            </TableCell>
                                            <TableCell className="px-12 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-[10px] text-white/20 italic">
                                                        {order.type}
                                                    </div>
                                                    <span className="font-black text-xs uppercase tracking-tight">{order.customer}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-12 py-8">
                                                <Badge variant="outline" className={cn(
                                                    "font-black text-[9px] tracking-widest px-4 py-1.5 rounded-full border-white/5",
                                                    order.status === 'Completed' ? "text-emerald-500 bg-emerald-500/5" :
                                                    order.status === 'Pending' ? "text-amber-500 bg-amber-500/5" :
                                                    "text-indigo-500 bg-indigo-500/5"
                                                )}>
                                                    {order.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-12 py-8 font-black text-xs tracking-tight">
                                                {order.amount}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* System Nodes & Rapid Directives */}
                <motion.div variants={itemVariants} className="space-y-12">
                    <Card className="border-none bg-white text-black rounded-[4rem] p-12 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-black/[0.05] rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <CardHeader className="relative z-10 p-0 space-y-8 text-center">
                            <div className="h-20 w-20 rounded-[2rem] bg-black text-white flex items-center justify-center mx-auto shadow-2xl">
                                <Zap size={32} />
                            </div>
                            <div className="space-y-3">
                                <CardTitle className="text-4xl font-black tracking-tighter uppercase leading-[0.8]">Strategic <br /> Diagnostics</CardTitle>
                                <CardDescription className="text-black/40 text-[10px] font-black uppercase tracking-[0.4em] italic">Generate global market analysis</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 p-0 pt-12">
                            <Button className="w-full h-20 rounded-[1.5rem] bg-black text-white hover:bg-black/90 font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] shadow-2xl">
                                Execute Report
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-white/5 bg-black/40 glass rounded-[4rem] overflow-hidden">
                        <CardHeader className="p-10 pb-4">
                            <CardTitle className="text-sm font-black tracking-tighter uppercase text-white/20 italic">Rapid Directives</CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-4">
                            {[
                                { icon: UserPlus, label: 'Authorize Node', desc: 'Onboard new merchant entity' },
                                { icon: Layers, label: 'Index Taxonomies', desc: 'Configure market categories' },
                                { icon: FileText, label: 'Export Ledger', desc: 'Download system transaction logs' }
                            ].map((action, i) => (
                                <Button key={i} variant="ghost" className="w-full h-20 rounded-[1.5rem] justify-between bg-white/[0.02] hover:bg-white hover:text-black font-black transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                                            <action.icon size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase tracking-widest">{action.label}</p>
                                            <p className="text-[8px] opacity-20 uppercase tracking-widest">{action.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="opacity-20 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;