import { 
    ShoppingBag, 
    Package, 
    TrendingUp, 
    AlertCircle, 
    ChevronRight, 
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Layers,
    Box,
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

const Dashboard = () => {
    const stats = [
        { title: 'Gross Revenue', value: '₦452,310', change: '+12.5%', trend: 'up', icon: TrendingUp, desc: 'Transactional through-put' },
        { title: 'Logistics', value: '1,234', change: '+8.2%', trend: 'up', icon: ShoppingBag, desc: 'Processed order units' },
        { title: 'Inventory', value: '456', change: '23 LOW', trend: 'down', icon: Package, desc: 'Active asset stock' },
        { title: 'Operational', value: '34', change: 'ACTION', trend: 'up', icon: AlertCircle, desc: 'Pending system tasks' },
    ];

    const activities = [
        { id: '1', title: 'Asset Requisition #LX-1234', time: '5 minutes ago', status: 'COMPLETED', type: 'SUCCESS', ref: 'CORE-NODE' },
        { id: '2', title: 'Inventory Influx: SYSTEM-01', time: '1 hour ago', status: 'RESTOCKED', type: 'INFO', ref: 'LOG-SYS' },
        { id: '3', title: 'Refund Protocol #LX-891', time: '3 hours ago', status: 'PENDING', type: 'WARNING', ref: 'FIN-GATE' },
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
            {/* Merchant Header Section */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-8 bg-white/20" />
                        <Badge variant="outline" className="px-4 py-1 rounded-full border-white/5 glass text-[9px] font-black uppercase tracking-[0.4em] text-white/40 italic">
                            Merchant Protocol Active
                        </Badge>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-gradient">
                        Merchant <br /> Overview
                    </h1>
                    <p className="text-white/40 font-medium text-lg max-w-xl leading-relaxed italic">
                        Real-time business telemetry and logistical execution interface.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-16 px-8 rounded-2xl glass border-white/5 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">
                        Sync Data Node
                    </Button>
                    <Button className="h-16 px-8 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                        New Distribution
                    </Button>
                </div>
            </motion.div>

            {/* Tactical Stats Matrix */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
                {stats.map((stat, i) => (
                    <motion.div key={i} variants={itemVariants}>
                        <Card className="group relative border-white/5 bg-black/40 glass rounded-[3rem] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
                            <CardContent className="p-10">
                                <div className="flex items-start justify-between">
                                    <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black transition-all duration-500">
                                        <stat.icon size={24} />
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "font-black text-[9px] tracking-widest px-3 py-1 rounded-full border-white/10",
                                        stat.trend === 'up' ? "text-emerald-500 bg-emerald-500/5" : "text-amber-500 bg-amber-500/5"
                                    )}>
                                        {stat.change}
                                    </Badge>
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

            {/* Operational Feed Interface */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card className="border-white/5 bg-black/40 glass rounded-[4rem] overflow-hidden">
                        <CardHeader className="p-12 pb-6 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 shadow-2xl">
                                        <Activity size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-3xl font-black tracking-tighter uppercase">Operational Feed</CardTitle>
                                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Real-time business telemetry</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest group">
                                    Archive Logs <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/5">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-12 hover:bg-white/[0.02] transition-all group">
                                        <div className="flex items-center gap-8">
                                            <div className="h-10 w-1 flex rounded-full bg-white/10 group-hover:bg-white transition-colors" />
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{activity.ref}</span>
                                                    <div className="h-1 w-1 rounded-full bg-white/10" />
                                                    <p className="font-black text-sm uppercase tracking-tight group-hover:text-white transition-colors">{activity.title}</p>
                                                </div>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">{activity.time}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "font-black text-[9px] tracking-widest px-6 py-2 rounded-full border-white/5",
                                            activity.type === 'SUCCESS' ? "text-emerald-500 bg-emerald-500/5" :
                                            activity.type === 'WARNING' ? "text-amber-500 bg-amber-500/5" :
                                            "text-indigo-500 bg-indigo-500/5"
                                        )}>
                                            {activity.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default Dashboard;