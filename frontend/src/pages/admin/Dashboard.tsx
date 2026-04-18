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
    Filter
} from 'lucide-react';
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
        { title: 'Total Users', value: '2,543', change: '+12%', trend: 'up', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Users },
        { title: 'Gross Revenue', value: '₦4,523,100', change: '+8%', trend: 'up', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: DollarSign },
        { title: 'Daily Orders', value: '892', change: '-3%', trend: 'down', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: ShoppingBag },
        { title: 'Active Now', value: '127', change: '+5%', trend: 'up', color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: Activity },
    ];

    const recentOrders = [
        { id: '#1234', customer: 'Alice Johnson', status: 'Completed', amount: '₦234,000', email: 'alice@example.com' },
        { id: '#1235', customer: 'Bob Smith', status: 'Pending', amount: '₦156,500', email: 'bob@example.com' },
        { id: '#1236', customer: 'Carol White', status: 'Processing', amount: '₦789,000', email: 'carol@example.com' },
        { id: '#1237', customer: 'David Brown', status: 'Completed', amount: '₦45,000', email: 'david@example.com' },
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tight">System Intelligence</h2>
                    <p className="text-muted-foreground font-medium text-lg">Real-time marketplace oversight and command center.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 px-6 border-2 font-black gap-2 hover-lift">
                        <Filter className="h-4 w-4" />
                        Custom Filters
                    </Button>
                    <Button className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20 hover-lift">
                        <Plus className="h-4 w-4 mr-2" />
                        New Initiative
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={stat.title} className="group border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden hover-lift animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        <CardContent className="p-8">
                            <div className="flex items-start justify-between">
                                <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", stat.bg, stat.color)}>
                                    <stat.icon size={24} />
                                </div>
                                <Badge variant="secondary" className={cn(
                                    "font-black text-[10px] tracking-widest border-none px-2 py-0.5 rounded-full",
                                    stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                )}>
                                    {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                    {stat.change}
                                </Badge>
                            </div>
                            <div className="mt-8 space-y-1">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.title}</p>
                                <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                
                {/* Orders Table Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tight">Recent Transactions</CardTitle>
                                    <CardDescription className="font-medium">Overview of the latest 50 marketplace activities.</CardDescription>
                                </div>
                                <Button variant="ghost" className="font-black text-xs uppercase tracking-widest group">
                                    View Full Ledger <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border/50">
                                        <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity</TableHead>
                                        <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                        <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.map((order) => (
                                        <TableRow key={order.id} className="group border-border/40 hover:bg-muted/30 transition-colors">
                                            <TableCell className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                                                        {order.customer.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{order.customer}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{order.id} • {order.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <Badge variant="secondary" className={cn(
                                                    "font-black text-[9px] tracking-widest px-3 py-0.5 rounded-full border-none",
                                                    order.status === 'Completed' ? "bg-emerald-500/10 text-emerald-600" :
                                                    order.status === 'Pending' ? "bg-amber-500/10 text-amber-600" :
                                                    "bg-indigo-500/10 text-indigo-600"
                                                )}>
                                                    {order.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <p className="font-black text-sm tracking-tight">{order.amount}</p>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions Area */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-black/[0.02] bg-primary rounded-[3rem] p-4 text-primary-foreground overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                        <CardHeader className="relative z-10 p-6 space-y-2 text-center">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-4">
                                <BarChart3 size={32} className="text-white" />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight leading-none">Market Insights</CardTitle>
                            <CardDescription className="text-white/70 font-medium">Generate custom analytics reports for specific periods.</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 p-6 pt-0">
                            <Button className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black text-lg transition-all shadow-xl shadow-black/20">
                                Run Diagnostics
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black tracking-tight">Rapid Command</CardTitle>
                            <CardDescription className="font-medium">Direct access to core system operations.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-3">
                            <Button variant="outline" className="w-full h-12 rounded-xl justify-between border-none bg-muted/50 hover:bg-muted font-bold text-sm group">
                                <span className="flex items-center gap-3">
                                    <Plus size={16} className="text-primary" />
                                    New Inventory Item
                                </span>
                                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button variant="outline" className="w-full h-12 rounded-xl justify-between border-none bg-muted/50 hover:bg-muted font-bold text-sm group">
                                <span className="flex items-center gap-3">
                                    <UserPlus size={16} className="text-indigo-500" />
                                    Onboard Staff
                                </span>
                                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button variant="outline" className="w-full h-12 rounded-xl justify-between border-none bg-muted/50 hover:bg-muted font-bold text-sm group">
                                <span className="flex items-center gap-3">
                                    <FileText size={16} className="text-emerald-500" />
                                    Export Transactions
                                </span>
                                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;