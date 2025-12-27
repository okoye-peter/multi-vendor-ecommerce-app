import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Clock, Layers, Package, ShoppingCart, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { useParams } from "react-router-dom";
import { getProduct } from '../../../libs/api';
import type { Category, Department } from '../../../types/Index';
import FullPageLoader from '../../../components/FullPageLoader';
import SubProducts from './components/SubProducts';
import Orders from './components/Orders';

interface ProductImage {
    id: number;
    url: string;
    default: boolean;
    productId: number;
    createdAt: string;
}


interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    quantity: number;
    is_published: boolean;
    departmentId: number;
    categoryId: number;
    vendorId: number;
    createdAt: string;
    updatedAt: string;
    category: Category;
    department: Department;
    images: ProductImage[];
    vendor: {
        id: number,
        name: string
    }
}


const Show = () => {
    const { productId, vendorId } = useParams();

    const { data: product, isLoading: productIsLoading } = useQuery<Partial<Product>>({
        queryKey: ['getProductDetail', Number(productId), Number(vendorId)],
        queryFn: ({ queryKey }) => {
            const [, productId, vendorId] = queryKey;
            return getProduct(vendorId as number, productId as number);
        },
        enabled: !!vendorId && !!productId,
    })

    const sortedImages = product?.images ? product.images.sort((a, b) => {
        if (a.default) return -1;
        if (b.default) return 1;
        return 0;
    }) : [];

    const [activeTab, setActiveTab] = useState<'details' | 'batches' | 'orders'>('details');
    const [selectedImage, setSelectedImage] = useState(0);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { color: 'badge-success', text: 'Active' },
            inactive: { color: 'badge-error', text: 'Inactive' },
            pending: { color: 'badge-warning', text: 'Pending' },
            processing: { color: 'badge-info', text: 'Processing' },
            completed: { color: 'badge-success', text: 'Completed' },
            cancelled: { color: 'badge-error', text: 'Cancelled' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <span className={`badge ${config.color} badge-sm`}> {config.text} </span>;
    };

    return (
        <>
            {productIsLoading && <FullPageLoader />}
            <div className="min-h-screen p-4 bg-base-200 md:p-8" >
                <div className="mx-auto max-w-7xl" >
                    {/* Header */}
                    < div className="mb-6" >
                        <div className="mb-4 text-sm breadcrumbs" >
                            <ul>
                                <li><a>Products </a></li >
                                <li><a>{product?.department?.name} </a></li >
                                <li><a>{product?.category?.name} </a></li >
                                <li className="font-semibold" > {product?.name} </li>
                            </ul>
                        </div>
                        < div className="flex items-center justify-between" >
                            <h1 className="text-xl font-bold" > {product?.name} </h1>
                            {getStatusBadge(product?.is_published ? 'active' : 'inactive')}
                        </div>
                    </div>

                    {/* tabs */}
                    <div className="mb-6 tabs tabs-boxed bg-base-200">
                        <a
                            className={`tab gap-2 ${activeTab === 'details' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            <Package className="w-4 h-4" />
                            Product Details
                        </a>
                        <a
                            className={`tab gap-2 ${activeTab === 'batches' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('batches')}
                        >
                            <Layers className="w-4 h-4" />
                            Sub Products
                        </a>
                        <a
                            className={`tab gap-2 ${activeTab === 'orders' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Orders
                        </a>
                    </div>

                    {/* Product Overview Card */}
                    <div className="mb-6 shadow-xl card bg-base-100">
                        {activeTab === 'details' && (
                            <div className="card-body">
                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                    {/* Image Gallery */}
                                    <div>
                                        <div className="relative mb-4 overflow-hidden rounded-lg bg-base-200 aspect-square">
                                            <img
                                                src={sortedImages[selectedImage]?.url}
                                                alt={product?.name}
                                                className="object-cover w-full h-full"
                                            />
                                            {sortedImages[selectedImage]?.default && (
                                                <div className="absolute top-2 right-2">
                                                    <span className="badge badge-primary">Default</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {sortedImages.map((img, idx) => (
                                                <button
                                                    key={img.id}
                                                    onClick={() => setSelectedImage(idx)}
                                                    className={`rounded-lg overflow-hidden border-2 transition-all relative ${selectedImage === idx ? 'border-primary' : 'border-transparent'
                                                        }`}
                                                >
                                                    <img src={img.url} alt={`${product?.name} ${idx + 1}`} className="object-cover w-full h-24" />
                                                    {img.default && (
                                                        <div className="absolute top-1 left-1">
                                                            <div className="badge badge-primary badge-xs">Default</div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Info */}
                                    <div>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-4xl font-bold text-primary">₦{(product?.price ?? 0).toFixed(2)}</span>
                                            <span className="text-sm text-base-content/60">per unit</span>
                                        </div>

                                        <div className="space-y-4">

                                            <div className="flex items-center gap-3">
                                                <Package className="w-5 h-5 text-base-content/60" />
                                                <div>
                                                    <p className="text-sm text-base-content/60">Department</p>
                                                    <p className="font-semibold">{product?.department?.name}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <Tag className="w-5 h-5 text-base-content/60" />
                                                <div>
                                                    <p className="text-sm text-base-content/60">Category</p>
                                                    <p className="font-semibold">{product?.category?.name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-base-content/60" />
                                                <div>
                                                    <p className="text-sm text-base-content/60">Vendor</p>
                                                    <p className="font-semibold">#{product?.vendor?.name}</p>
                                                </div>
                                            </div>

                                            <div className="divider"></div>

                                            <div className="w-full shadow stats stats-vertical lg:stats-horizontal">
                                                <div className="stat place-items-center">
                                                    <div className="stat-title">Total Stock</div>
                                                    <div className="text-2xl stat-value text-info">{product?.quantity}</div>
                                                    <div className="stat-desc">Available units</div>
                                                </div>

                                                <div className="stat place-items-center">
                                                    <div className="stat-title">Total Sold</div>
                                                    <div className="text-2xl stat-value text-success">{0}</div>
                                                    <div className="stat-desc">Units sold</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'batches' && <SubProducts productId={product?.id || 0} vendorId={product?.vendorId || 0} />}
                        {activeTab === 'orders' && <Orders productId={product?.id || 0} vendorId={product?.vendorId || 0} />}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Show