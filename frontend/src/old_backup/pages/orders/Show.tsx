import React, { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Package,
    Truck,
    MapPin,
    CreditCard,
    User,
    Phone,
    Mail,
    CheckCircle,
    Clock,
    Download,
    ExternalLink,
    ChevronRight,
    Loader2,
    Calendar,
    Hash,
    ShieldCheck
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/libs/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils';

/* ================= BACKEND TYPES ================= */
interface BackendOrderImage {
    id: number;
    url: string;
    default: boolean;
}

interface BackendProduct {
    id: number;
    name: string;
    images: BackendOrderImage[];
}

interface BackendOrder {
    id: number;
    quantity: number;
    priceOnPurchase: number;
    product: BackendProduct;
}

interface BackendOrderGroup {
    id: number;
    ref_no: string;
    status: number;
    totalAmount: number;
    createdAt: string;
    orders: BackendOrder[];
    paymentRefNo: string;
}

interface ApiResponse {
    order_group: BackendOrderGroup;
}

/* ================= FRONTEND TYPES ================= */
interface OrderItem {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    sku: string;
}

interface OrderData {
    orderNumber: string;
    date: string;
    status: number;
    items: OrderItem[];
    tranx_id: string,
    pricing: {
        subtotal: number;
        shipping: number;
        tax: number;
        total: number;
    };
}

/* ================= COMPONENT ================= */
const OrderDetailsPage: React.FC = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);

    /* ================= FETCH ORDER ================= */
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await axiosInstance.get<ApiResponse>(
                    `/orders/${orderId}`
                );

                const group = data.order_group;

                const items: OrderItem[] = group.orders.map((o) => ({
                    id: String(o.id),
                    name: o.product.name,
                    image: o.product.images?.[0]?.url || '/placeholder.png',
                    price: o.priceOnPurchase,
                    quantity: o.quantity,
                    sku: String(o.product.id),
                }));

                const subtotal = items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                );

                setOrder({
                    orderNumber: group.ref_no,
                    date: group.createdAt,
                    status: group.status,
                    tranx_id: group.paymentRefNo,
                    items,
                    pricing: {
                        subtotal,
                        shipping: 0,
                        tax: 0,
                        total: group.totalAmount,
                    },
                });
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrder();
    }, [orderId]);

    const dummyTimeline = [
        { date: '2024-12-08 14:30', status: 'Delivered', description: 'Package successfully reached destination entity.', completed: true },
        { date: '2024-12-08 09:15', status: 'In Transit', description: 'Assigned to logistics relay personnel.', completed: true },
        { date: '2024-12-07 16:45', status: 'Dispatched', description: 'Handed over to carrier network.', completed: true },
        { date: '2024-12-07 10:00', status: 'Validated', description: 'Inventory verification and packaging finalized.', completed: true },
        { date: '2024-12-06 18:22', status: 'Confirmed', description: 'Payment successfully processed through gateway.', completed: true },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="font-black tracking-widest uppercase text-[10px] text-muted-foreground">Accessing Fulfillment Data...</p>
            </div>
        );
    }

    if (!order) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center animate-scale-in">
             <div className="h-20 w-20 rounded-[2.5rem] bg-destructive/10 flex items-center justify-center text-destructive mb-6">
                <Package size={40} />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Fulfillment Data Lost</h2>
            <p className="text-muted-foreground font-medium mb-8">We could not retrieve the requested order sequence from the core ledger.</p>
            <Button onClick={() => navigate('/orders')} className="rounded-2xl h-12 px-8 font-black">Return to Portal</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pt-28 pb-20 selection:bg-primary/10">
             {/* Background elements */}
             <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10 space-y-12">
                
                {/* Header System */}
                <div className="flex flex-col gap-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Portal Entry
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in-down">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                                <CheckCircle size={16} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Fulfillment Complete</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter leading-none">
                                Relay Statement
                            </h1>
                            <div className="flex items-center gap-6 text-muted-foreground font-bold text-sm uppercase tracking-tight">
                                <span className="flex items-center gap-2 pr-6 border-r border-border/50">
                                    <Hash size={14} className="text-primary" />
                                    {order.orderNumber}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Calendar size={14} className="text-primary" />
                                    Validated {new Date(order.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 font-black gap-2 hover-lift">
                                <Download size={18} />
                                Statement
                            </Button>
                            <Button className="h-14 px-8 rounded-2xl font-black gap-2 shadow-xl shadow-primary/20 hover-lift group">
                                <Truck size={18} />
                                Trace Location
                                <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Status Command Center */}
                <Card className="border-none shadow-2xl shadow-black/[0.02] bg-emerald-500 rounded-[3rem] p-8 text-emerald-50 overflow-hidden relative animate-fade-in">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center text-white">
                                <Package size={40} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight">Relay Delivered</h3>
                                <p className="font-medium opacity-80 text-lg">Successfully interfaced with recipient entity on {new Date(order.date).toLocaleDateString()}.</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="h-12 px-6 rounded-2xl border-2 border-white/30 text-white font-black text-xs uppercase tracking-widest backdrop-blur-md">
                            Authentication Required
                        </Badge>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-10">
                        
                        {/* Items Ledger */}
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3.5rem] overflow-hidden">
                            <CardHeader className="p-10 pb-6">
                                <CardTitle className="text-2xl font-black tracking-tight">Manifest Ledger</CardTitle>
                                <CardDescription className="font-medium">Total Volume: {order.items.reduce((s, i) => s + i.quantity, 0)} Units</CardDescription>
                            </CardHeader>
                            <CardContent className="p-10 pt-0 space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={item.id} className="group flex items-center gap-6 p-6 rounded-[2.5rem] bg-muted/20 hover:bg-muted/30 transition-all">
                                        <div className="h-24 w-24 rounded-[1.5rem] overflow-hidden bg-muted relative">
                                            <img src={item.image} alt={item.name} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute bottom-1 right-1 h-6 w-6 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black">
                                                x{item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{item.name}</h4>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Hash size={12} className="text-primary/50" /> {item.sku}</span>
                                                <span className="flex items-center gap-1.5"><Package size={12} className="text-primary/50" /> Verified Item</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black tracking-tighter text-foreground">{formatPrice(item.price)}</p>
                                            <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Unit Valuation</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Chronicle (Timeline) */}
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3.5rem] overflow-hidden">
                            <CardHeader className="p-10 pb-6">
                                <CardTitle className="text-2xl font-black tracking-tight">Fulfillment Chronicle</CardTitle>
                                <CardDescription className="font-medium">End-to-end trace log of relay events.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-10 pt-4 px-14">
                                <div className="space-y-10 relative">
                                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border/40" />
                                    {dummyTimeline.map((event, index) => (
                                        <div key={index} className="relative pl-12">
                                            <div className={cn(
                                                "absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-background ring-4 ring-transparent transition-all",
                                                event.completed ? "bg-emerald-500 ring-emerald-500/10" : "bg-muted shadow-lg"
                                            )} />
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="space-y-1">
                                                    <h5 className="font-black text-sm tracking-tight uppercase tracking-widest text-foreground">{event.status}</h5>
                                                    <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-md">{event.description}</p>
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">
                                                    {event.date}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-10">
                        
                        {/* Transaction Abstract (Pricing) */}
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-primary rounded-[3rem] p-4 text-primary-foreground overflow-hidden relative animate-fade-in-up">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                            <CardHeader className="relative z-10 p-8 pb-4">
                                <CardTitle className="text-2xl font-black tracking-tight">Valuation Abstract</CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 p-8 pt-0 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center opacity-80">
                                        <span className="text-xs font-black uppercase tracking-widest">Base Valuation</span>
                                        <span className="font-bold">{formatPrice(order.pricing.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-80">
                                        <span className="text-xs font-black uppercase tracking-widest">Relay Logistics</span>
                                        <span className="font-bold">{formatPrice(order.pricing.shipping)}</span>
                                    </div>
                                    {order.pricing.tax > 0 && (
                                        <div className="flex justify-between items-center opacity-80">
                                            <span className="text-xs font-black uppercase tracking-widest">Statutory Levies</span>
                                            <span className="font-bold">{formatPrice(order.pricing.tax)}</span>
                                        </div>
                                    )}
                                </div>
                                <Separator className="bg-white/20" />
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Total Statement</span>
                                    <span className="text-4xl font-black tracking-tighter">{formatPrice(order.pricing.total)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Interface */}
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                    <User size={20} className="text-primary" />
                                    Entity Interface
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6 pt-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black">
                                        JD
                                    </div>
                                    <div>
                                        <p className="font-black text-sm tracking-tight">John Doe</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Authorized Recipient</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-border/10">
                                    <div className="flex items-center gap-3 group cursor-pointer">
                                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                            <Mail size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">john.doe@example.com</span>
                                    </div>
                                    <div className="flex items-center gap-3 group cursor-pointer">
                                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                            <Phone size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">+1 (555) 123-4567</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location Protocol */}
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                    <MapPin size={20} className="text-emerald-500" />
                                    Relay Destination
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-4">
                                <div className="p-5 rounded-2xl bg-muted/20 space-y-1">
                                    <p className="font-bold text-sm">123 Main Street, Apt 4B</p>
                                    <p className="text-xs text-muted-foreground font-medium">New York, NY 10001, United States</p>
                                </div>
                                <Button variant="outline" className="w-full h-11 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest gap-2">
                                    <ExternalLink size={12} />
                                    Open Terminal Map
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Payment Verification */}
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                    <ShieldCheck size={20} className="text-indigo-500" />
                                    Settlement Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Method</span>
                                        <Badge variant="secondary" className="font-black text-[9px] uppercase border-none bg-indigo-500/10 text-indigo-600">Credit Card **** 4242</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trace ID</span>
                                        <span className="font-bold text-xs">{order.tranx_id}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
