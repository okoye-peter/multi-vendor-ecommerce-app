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
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../libs/axios';

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

    /* ================= DUMMY DATA ================= */
    const dummyCustomer = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
    };

    const dummyAddress = {
        street: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
    };

    const dummyPayment = {
        method: 'Credit Card',
        cardLast4: '4242',
        transactionId: 'txn_123456',
    };

    const dummyTimeline = [
        { date: '2024-12-08 14:30', status: 'delivered', description: 'Package delivered successfully' },
        { date: '2024-12-08 09:15', status: 'out_for_delivery', description: 'Out for delivery' },
        { date: '2024-12-07 16:45', status: 'shipped', description: 'Package shipped from warehouse' },
        { date: '2024-12-07 10:00', status: 'processing', description: 'Order is being prepared' },
        { date: '2024-12-06 18:22', status: 'confirmed', description: 'Order confirmed and payment received' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!order) return <div className="p-10 text-center">Failed to load order</div>;

    return (
        <div className="min-h-screen from-indigo-50 via-purple-50 to-pink-50">
            <div className="container px-4 py-8 mx-auto max-w-7xl">

                {/* HEADER */}
                <div className="mb-6">
                    <button onClick={() => navigate(-1)} className="gap-2 mb-4 btn btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Orders
                    </button>

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="mb-2 text-4xl font-bold text-gray-800">
                                Order Details
                            </h1>
                            <p className="text-gray-600">
                                Order {order.orderNumber}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button className="gap-2 btn btn-outline">
                                <Package className="w-5 h-5" />
                                Invoice
                            </button>
                            <button className="gap-2 btn btn-primary">
                                <Truck className="w-5 h-5" />
                                Track
                            </button>
                        </div>
                    </div>
                </div>

                {/* STATUS */}
                <div className="mb-6 shadow-lg alert alert-success">
                    <CheckCircle className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">Order Delivered</h3>
                        <div className="text-xs">
                            Delivered on {new Date(order.date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* LEFT */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* ITEMS */}
                        <div className="shadow-xl card">
                            <div className="card-body">
                                <h2 className="mb-4 text-2xl card-title">
                                    <Package className="w-6 h-6" />
                                    Order Items
                                </h2>

                                {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-base-100">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="object-cover w-20 h-20 rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold">{item.name}</h3>
                                            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-primary">
                                                ₦{item.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TIMELINE (DUMMY) */}
                        <div className="shadow-xl card">
                            <div className="card-body">
                                <h2 className="mb-4 text-2xl card-title">
                                    <Clock className="w-6 h-6" />
                                    Order Timeline
                                </h2>

                                <ul className="timeline timeline-vertical">
                                    {dummyTimeline.map((event, index) => (
                                        <li key={index}>
                                            {index !== 0 && <hr />}
                                            <div className="text-sm timeline-start">
                                                {event.date}
                                            </div>
                                            <div className="timeline-middle">
                                                <CheckCircle className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="timeline-end timeline-box">
                                                {event.description}
                                            </div>
                                            {index !== dummyTimeline.length - 1 && <hr />}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* ADDRESSES (DUMMY) */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {[dummyAddress, dummyAddress].map((addr, i) => (
                                <div key={i} className="shadow-xl card">
                                    <div className="card-body">
                                        <h2 className="mb-4 text-xl card-title">
                                            <MapPin className="w-5 h-5" />
                                            {i === 0 ? 'Shipping' : 'Billing'} Address
                                        </h2>
                                        <p>{addr.street}</p>
                                        <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                                        <p>{addr.country}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="space-y-6">

                        {/* CUSTOMER (DUMMY) */}
                        <div className="shadow-xl card">
                            <div className="card-body">
                                <h2 className="mb-4 text-xl card-title">
                                    <User className="w-5 h-5" />
                                    Customer
                                </h2>

                                <div className="space-y-2">
                                    <p className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        {dummyCustomer.name}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {dummyCustomer.email}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        {dummyCustomer.phone}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* PAYMENT (DUMMY) */}
                        <div className="shadow-xl card">
                            <div className="card-body">
                                <h2 className="mb-4 text-xl card-title">
                                    <CreditCard className="w-5 h-5" />
                                    Payment
                                </h2>
                                <p>Method: {dummyPayment.method}</p>
                                <p>Card: **** {dummyPayment.cardLast4}</p>
                                <p className="text-xs">TXN: {order.tranx_id}</p>
                            </div>
                        </div>

                        {/* SUMMARY */}
                        <div className="shadow-xl card">
                            <div className="card-body">
                                <h2 className="mb-4 text-xl font-bold">
                                    Order Summary
                                </h2>
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>₦{order.pricing.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>₦0</span>
                                </div>
                                <div className="my-2 divider"></div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">
                                        ₦{order.pricing.total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
