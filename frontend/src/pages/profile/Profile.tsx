import { useState, useRef, useEffect } from "react";
import { NavLink, Navigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/Index";
import {
  LayoutDashboard, Store, Package, ClipboardList,
  Loader2, TrendingUp, ShoppingBag, AlertCircle, Clock, User,
  MapPin, Calendar, Hash, CheckCircle, Eye, Pencil, Trash2, RefreshCw,
  X, Phone, Camera, Save,
} from "lucide-react";
import {
  useGetAuthUserVendorsQuery,
  useGetVendorDashboardQuery,
  useLazyGetOrderDetailsQuery,
} from "../../store/features/ProfileApi";
import { useGetAuthenticatedUserQuery, useUpdateProfileMutation } from "../../store/features/AuthApi";
import type { Product } from "../../types/Index";
import { DataTable, RowActions } from "../../components/data-table/DataTable";
import type { SearchableColumnDef } from "../../components/data-table/DataTable";
import VendorProductView from "./VendorProductView";
import axiosInstance from "../../libs/axios";
import { toast } from "react-toastify";
import type { VendorOrder, OrderGroupDetail } from "../../store/features/ProfileApi";
import { Button } from "../../components/ui/button";
import EmailVerificationModal from "../../components/EmailVerificationModal";

/* ─── Helpers ──────────────────────────────────────────────── */

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "Pending",            color: "text-amber-400 bg-amber-400/10" },
  1: { label: "Confirmed",          color: "text-blue-400 bg-blue-400/10" },
  2: { label: "Awaiting Shipment",  color: "text-violet-400 bg-violet-400/10" },
  3: { label: "Shipped",            color: "text-indigo-400 bg-indigo-400/10" },
  4: { label: "Delivered",          color: "text-emerald-400 bg-emerald-400/10" },
  5: { label: "Cancelled",          color: "text-rose-400 bg-rose-400/10" },
};

const StatusBadge = ({ status }: { status: number }) => {
  const s = STATUS_MAP[status] ?? { label: "Unknown", color: "text-muted-foreground bg-white/5" };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.color}`}>
      {s.label}
    </span>
  );
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/* ─── Shared micro-components ──────────────────────────────── */

const Spinner = () => (
  <div className="flex justify-center py-20">
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
  </div>
);

const Empty = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
    <Icon className="w-12 h-12 opacity-20" />
    <p>{message}</p>
  </div>
);

const PaginationBar = ({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 pt-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-9 h-9 rounded-xl font-bold text-sm transition-all ${
            p === page
              ? "bg-primary text-white"
              : "bg-white/5 border border-white/10 hover:bg-white/10"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
};

/* ─── Order Detail Modal ───────────────────────────────────── */

const OrderDetailModal = ({ refNo, onClose }: { refNo: string; onClose: () => void }) => {
  const [fetchOrder, { data, isLoading }] = useLazyGetOrderDetailsQuery();

  useEffect(() => { void fetchOrder(refNo); }, [refNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const order = data?.order_group;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.15 }}
        className="relative z-10 w-full max-w-lg glass-card rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order Details</p>
            <p className="font-black text-primary">{refNo}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading || !order ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Date",   value: fmtDate(order.createdAt) },
                { label: "Total",  value: fmt(order.totalAmount) },
                { label: "Status", value: <StatusBadge status={order.status} /> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                  <div className="font-bold text-sm">{value}</div>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Items ({order.orders.length})
              </p>
              {order.orders.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 shrink-0">
                    {item.product?.images?.[0]?.url ? (
                      <img src={item.product.images[0].url} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.product?.name ?? "Product"}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {fmt(item.priceOnPurchase)} each</p>
                  </div>
                  <p className="font-black text-primary text-sm shrink-0">
                    {fmt(item.priceOnPurchase * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ─── Customer: My Orders ──────────────────────────────────── */

const CustomerOrders = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailRef, setDetailRef] = useState<string | null>(null);

  const columns: SearchableColumnDef<any>[] = [
    {
      id: "ref_no",
      header: "Reference",
      searchable: true,
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="font-black text-xs tracking-wider">{row.original.ref_no}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {fmtDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }: any) => (
        <span className="text-sm font-medium">
          {row.original._count?.orders ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }: any) => (
        <span className="font-black text-primary">{fmt(row.original.totalAmount)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <RowActions
          actions={[
            {
              label: "View Details",
              icon: <Eye className="w-3.5 h-3.5" />,
              onClick: () => setDetailRef(row.original.ref_no),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable<any>
        key={refreshKey}
        url="/orders"
        columns={columns}
        title="My Orders"
        enableGlobalSearch
        searchFields={["ref_no"]}
        filters={[
          {
            column: "status",
            label: "Status",
            type: "select",
            options: Object.entries(STATUS_MAP).map(([val, { label }]) => ({ value: val, label })),
          },
          { column: "createdAt_from", label: "From Date", type: "date" },
          { column: "createdAt_to",   label: "To Date",   type: "date" },
        ]}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50]}
      />
      <AnimatePresence>
        {detailRef && (
          <OrderDetailModal refNo={detailRef} onClose={() => setDetailRef(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Customer: Edit Profile ───────────────────────────────── */

const CustomerProfileEdit = () => {
  const user = useSelector((state: RootState) => state.auth.user)!;
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [name, setName]   = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [preview, setPreview] = useState<string | null>(user.pictureUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]   = useState<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    const fd = new FormData();
    if (name  !== user.name)  fd.append("name",  name);
    if (phone !== (user.phone ?? "")) fd.append("phone", phone);
    if (file) fd.append("picture", file);
    if (![...fd.entries()].length) { toast.info("No changes to save"); return; }
    try {
      await updateProfile(fd).unwrap();
      toast.success("Profile updated!");
      setFile(null);
    } catch (err: any) {
      const msg = err?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to update profile");
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-2xl font-black">Edit Profile</h2>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center text-3xl font-black text-primary">
            {preview
              ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
              : user.name.charAt(0).toUpperCase()
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Click the camera icon to change your photo</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <User className="w-3 h-3" /> Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" /> Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium outline-none text-muted-foreground cursor-not-allowed"
          />
          <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isLoading} className="rounded-xl gap-2">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </Button>
    </div>
  );
};

/* ─── Customer full profile ────────────────────────────────── */

const CUSTOMER_TABS = [
  { id: "orders",  label: "My Orders", icon: ClipboardList },
  { id: "profile", label: "Profile",   icon: User },
] as const;
type CustomerTab = (typeof CUSTOMER_TABS)[number]["id"];

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState<CustomerTab>("orders");

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Sidebar */}
      <aside className="lg:w-52 shrink-0">
        <nav className="glass-card rounded-2xl p-1.5 flex lg:flex-col gap-1">
          {CUSTOMER_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full ${
                activeTab === t.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "orders"  && <CustomerOrders />}
            {activeTab === "profile" && <CustomerProfileEdit />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Vendor: Dashboard ────────────────────────────────────── */

const VendorDashboard = ({ vendorId }: { vendorId: number }) => {
  const { data, isLoading } = useGetVendorDashboardQuery({ vendorId });
  if (isLoading) return <Spinner />;
  if (!data) return <Empty icon={LayoutDashboard} message="No stats available." />;

  const stats = [
    { icon: TrendingUp,  label: "Total Sales",     value: fmt(data.totalSales),          color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { icon: ShoppingBag, label: "Total Orders",    value: String(data.totalOrders ?? 0), color: "text-blue-400",    bg: "bg-blue-400/10"    },
    { icon: AlertCircle, label: "Pending Orders",  value: String(data.pendingOrders ?? 0), color: "text-amber-400", bg: "bg-amber-400/10"   },
    { icon: Clock,       label: "Period",          value: `${fmtDate(data.start_date)} – ${fmtDate(data.end_date)}`, color: "text-indigo-400", bg: "bg-indigo-400/10" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-6 space-y-3"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* ─── Vendor: My Store ─────────────────────────────────────── */

const VendorStore = ({ vendorId }: { vendorId: number }) => {
  const { data: vendors, isLoading } = useGetAuthUserVendorsQuery();
  if (isLoading) return <Spinner />;
  const vendor = vendors?.find((v) => v.id === vendorId);
  if (!vendor) return <Empty icon={Store} message="Store not found." />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">My Store</h2>
      <div className="glass-card rounded-2xl p-8 space-y-5 max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Store className="w-8 h-8" />
        </div>
        <div className="space-y-3">
          {[
            { icon: Store,    label: "Store Name",    value: vendor.name },
            { icon: MapPin,   label: "Address",       value: vendor.address },
            ...(vendor.state ? [{ icon: MapPin, label: "State", value: vendor.state.name }] : []),
            { icon: Calendar, label: "Member Since",  value: fmtDate(vendor.createdAt) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Vendor: Products (DataTable) ────────────────────────── */

const VendorProducts = ({ vendorId }: { vendorId: number }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/vendors/${vendorId}/products/${product.id}`);
      toast.success("Product deleted");
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleTogglePublish = async (product: Product) => {
    try {
      await axiosInstance.put(`/vendors/${vendorId}/products/${product.id}/publish`);
      toast.success(`Product ${product.is_published ? "unpublished" : "published"}`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to toggle publish status");
    }
  };

  if (selectedProduct)
    return (
      <VendorProductView
        vendorId={vendorId}
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
      />
    );

  const columns: SearchableColumnDef<Product>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) =>
        row.original.images?.[0] ? (
          <img
            src={row.original.images[0].url}
            alt={row.original.name}
            className="w-10 h-10 object-cover rounded-lg"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
        ),
    },
    {
      accessorKey: "name",
      header: "Product",
      searchable: true,
      cell: ({ row }) => (
        <div>
          <p className="font-bold">{row.original.name}</p>
          {row.original.category && (
            <p className="text-xs text-muted-foreground">{row.original.category.name}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <span className="font-black text-primary">
          {fmt(typeof row.original.price === "string" ? parseFloat(row.original.price) : row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }) => (
        <span className={`font-bold ${row.original.quantity <= 0 ? "text-rose-400" : ""}`}>
          {row.original.quantity}
        </span>
      ),
    },
    {
      accessorKey: "is_published",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            row.original.is_published
              ? "text-emerald-400 bg-emerald-400/10"
              : "text-rose-400 bg-rose-400/10"
          }`}
        >
          {row.original.is_published ? "Live" : "Draft"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View",
              icon: <Eye className="w-3.5 h-3.5" />,
              onClick: () => setSelectedProduct(row.original),
            },
            {
              label: row.original.is_published ? "Unpublish" : "Publish",
              icon: <Pencil className="w-3.5 h-3.5" />,
              onClick: () => handleTogglePublish(row.original),
            },
            {
              label: "Delete",
              icon: <Trash2 className="w-3.5 h-3.5" />,
              onClick: () => handleDelete(row.original),
              variant: "danger",
            },
          ]}
        />
      ),
    },
  ];

  return (
    <DataTable<Product>
      key={refreshKey}
      url="/vendors/products"
      columns={columns}
      title="Products"
      enableGlobalSearch
      searchFields={["name", "description"]}
      extraParams={{ vendorId }}
      filters={[
        {
          column: "is_published",
          label: "Status",
          type: "select",
          options: [
            { value: "true",  label: "Published" },
            { value: "false", label: "Draft" },
          ],
        },
        {
          column: "categoryId",
          label: "Category ID",
          type: "text",
          placeholder: "e.g. 3",
        },
      ]}
      defaultPageSize={10}
      pageSizeOptions={[10, 20, 50]}
    />
  );
};

/* ─── Vendor: Orders ───────────────────────────────────────── */

interface StatusModalProps {
  order: VendorOrder;
  onClose: () => void;
  onSuccess: () => void;
}

// Status 4 = Delivered, 5 = Cancelled — both are terminal and cannot be changed
const TERMINAL_STATUSES = new Set([4, 5]);

function StatusUpdateModal({ order, onClose, onSuccess }: StatusModalProps) {
  const currentStatus = order.orderGroup?.status ?? 0;
  const [selected, setSelected] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (selected === currentStatus) { onClose(); return; }
    setLoading(true);
    try {
      await axiosInstance.patch(`/vendors/orders/${order.orderGroupId}/status`, { status: selected });
      toast.success("Order status updated");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const currentInfo = STATUS_MAP[currentStatus]!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.15 }}
        className="relative z-10 w-full max-w-sm glass-card rounded-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg">Update Status</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Order <span className="text-white">{order.orderGroup?.ref_no}</span>
          </p>
          <p className="text-xs text-muted-foreground">{order.product?.name}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Status</label>
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentInfo.color}`}>
            {currentInfo.label}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Status</label>
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="w-full h-11 px-4 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm font-bold appearance-none outline-none cursor-pointer text-white focus:border-primary/40 transition-colors"
            >
              {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                <option key={val} value={val} className="bg-zinc-900 font-bold">
                  {label}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || selected === currentStatus}
            className="flex-1 rounded-xl gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Update
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

const VendorOrders = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusOrder, setStatusOrder] = useState<VendorOrder | null>(null);

  const columns: SearchableColumnDef<VendorOrder>[] = [
    {
      id: "ref_no",
      header: "Order Ref",
      searchable: true,
      cell: ({ row }) => (
        <span className="font-black text-xs tracking-wider">
          {row.original.orderGroup?.ref_no ?? "—"}
        </span>
      ),
    },
    {
      id: "product",
      header: "Product",
      searchable: true,
      cell: ({ row }) => (
        <span className="font-bold">{row.original.product?.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => <span className="font-bold">{row.original.quantity}</span>,
    },
    {
      accessorKey: "priceOnPurchase",
      header: "Unit Price",
      cell: ({ row }) => (
        <span className="font-bold">{fmt(row.original.priceOnPurchase)}</span>
      ),
    },
    {
      id: "revenue",
      header: "Revenue",
      cell: ({ row }) => (
        <span className="font-black text-primary">
          {fmt(row.original.priceOnPurchase * row.original.quantity)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.orderGroup?.status ?? 0;
        const s = STATUS_MAP[status] ?? STATUS_MAP[0]!;
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.color}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <span className="text-xs">{fmtDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const status = row.original.orderGroup?.status ?? 0;
        if (TERMINAL_STATUSES.has(status)) return null;
        return (
          <RowActions
            actions={[
              {
                label: "Update Status",
                icon: <RefreshCw className="w-3.5 h-3.5" />,
                onClick: () => setStatusOrder(row.original),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <DataTable<VendorOrder>
        key={refreshKey}
        url="/vendors/orders"
        columns={columns}
        title="Orders"
        enableGlobalSearch
        searchFields={["orderGroup.ref_no", "product.name"]}
        filters={[
          {
            column: "orderGroup.status",
            label: "Status",
            type: "select",
            options: Object.entries(STATUS_MAP).map(([val, { label }]) => ({
              value: val,
              label,
            })),
          },
          { column: "createdAt_from", label: "From Date", type: "date" },
          { column: "createdAt_to",   label: "To Date",   type: "date" },
        ]}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50]}
      />

      <AnimatePresence>
        {statusOrder && (
          <StatusUpdateModal
            order={statusOrder}
            onClose={() => setStatusOrder(null)}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Vendor full profile ──────────────────────────────────── */

const VENDOR_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "store",     label: "My Store",  icon: Store },
  { id: "products",  label: "Products",  icon: Package },
  { id: "orders",    label: "Orders",    icon: ClipboardList },
] as const;

type VendorTab = (typeof VENDOR_TABS)[number]["id"];

const VALID_TABS = VENDOR_TABS.map((t) => t.id) as string[];

const VendorProfile = () => {
  const { tab } = useParams<{ tab?: string }>();
  const activeTab: VendorTab = VALID_TABS.includes(tab ?? "") ? (tab as VendorTab) : "dashboard";

  const { data: vendors, isLoading } = useGetAuthUserVendorsQuery();

  if (isLoading) return <Spinner />;
  if (!vendors?.length)
    return <Empty icon={Store} message="No vendor store found. Please register as a vendor." />;

  const vendor = vendors[0]!;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Sidebar — horizontal scroll on mobile, vertical on desktop */}
      <aside className="lg:w-56 shrink-0">
        <nav className="glass-card rounded-2xl p-1.5 flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
          {VENDOR_TABS.map((t) => (
            <NavLink
              key={t.id}
              to={`/profile/${t.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-max lg:min-w-0 lg:w-full ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`
              }
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "dashboard" && <VendorDashboard vendorId={vendor.id} />}
            {activeTab === "store"     && <VendorStore vendorId={vendor.id} />}
            {activeTab === "products"  && <VendorProducts vendorId={vendor.id} />}
            {activeTab === "orders"    && <VendorOrders />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Root ─────────────────────────────────────────────────── */

const Profile = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { refetch: refetchUser } = useGetAuthenticatedUserQuery();
  const { tab } = useParams<{ tab?: string }>();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  if (!user) return null;

  const isVendor = user.type === "VENDOR";

  // Redirect vendors from bare /profile to /profile/dashboard
  if (isVendor && !tab) return <Navigate to="/profile/dashboard" replace />;

  return (
    <div className="container mx-auto px-6 py-20 space-y-10">
      {/* User header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 sm:gap-6"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-primary/30 to-accent/30 flex items-center justify-center text-2xl sm:text-3xl font-black text-primary shrink-0">
          {user.pictureUrl ? (
            <img src={user.pictureUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black">{user.name}</h1>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isVendor
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground bg-white/5 border border-white/10"
              }`}
            >
              {user.type}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />{user.email}
            </span>
            {user.emailVerifiedAt ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-3 h-3" />Verified
              </span>
            ) : (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="flex items-center gap-1 text-amber-400 text-xs font-bold hover:text-amber-300 transition-colors"
              >
                <AlertCircle className="w-3 h-3" />Email not verified — click to verify
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Unverified email banner */}
      {!user.emailVerifiedAt && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-300">Your email address is not verified</p>
              <p className="text-xs text-muted-foreground mt-0.5">Some features may be restricted until you verify your email.</p>
            </div>
          </div>
          <Button
            onClick={() => setShowVerifyModal(true)}
            size="sm"
            className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black"
          >
            Verify Now
          </Button>
        </motion.div>
      )}

      <div className="h-px bg-white/5" />

      {isVendor ? <VendorProfile /> : <CustomerProfile />}

      <EmailVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onSuccess={() => { refetchUser(); }}
        userEmail={user.email}
      />
    </div>
  );
};

export default Profile;
