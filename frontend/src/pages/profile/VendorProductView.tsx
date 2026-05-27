import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, ShoppingBag, AlertCircle, Package,
  Plus, CheckCircle, XCircle, Hash, Loader2, X, Pencil,
  ChevronDown, Upload,
} from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import { useGetProductOrdersQuery } from '@/store/features/ProfileApi';
import { useGetDepartmentsQuery, useGetCategoriesQuery } from '@/store/features/ProductApi';
import { DataTable, RowActions } from '@/components/data-table/DataTable';
import type { SearchableColumnDef } from '@/components/data-table/DataTable';
import type { Product, SubProduct } from '@/types/Index';
import type { VendorOrder } from '@/store/features/ProfileApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

/* ─── Helpers ──────────────────────────────────────────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TABS = ['dashboard', 'sub-products', 'orders'] as const;
type Tab = (typeof TABS)[number];

type ProductImage = { id: number; url: string };

/* ─── Image Gallery ────────────────────────────────────────────── */

function ImageGallery({ images }: { images?: ProductImage[] }) {
  const [selected, setSelected] = useState(0);

  useEffect(() => { setSelected(0); }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-52 flex items-center justify-center bg-white/3">
        <Package className="w-12 h-12 text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full h-56 bg-black/30 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={selected}
            src={images[selected]!.url}
            alt={`Product image ${selected + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full h-full object-contain"
          />
        </AnimatePresence>
        {images.length > 1 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-xs text-white font-bold tabular-nums">
            {selected + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-t border-white/5">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(i)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === selected
                  ? 'border-primary opacity-100 scale-105'
                  : 'border-white/10 opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Edit Product Modal ───────────────────────────────────────── */

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  vendorId: number;
  product: Product;
  onSuccess: (updated: Partial<Product>) => void;
}

function EditProductModal({ open, onClose, vendorId, product, onSuccess }: EditProductModalProps) {
  const { data: departments = [] } = useGetDepartmentsQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    description: product.description || '',
    departmentId: String(product.departmentId || ''),
    categoryId: String(product.categoryId || ''),
    is_published: product.is_published ?? true,
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: categories = [] } = useGetCategoriesQuery(
    form.departmentId ? { departmentId: form.departmentId } : undefined,
  );

  useEffect(() => {
    if (open) {
      setForm({
        name: product.name,
        price: String(product.price),
        description: product.description || '',
        departmentId: String(product.departmentId || ''),
        categoryId: String(product.categoryId || ''),
        is_published: product.is_published ?? true,
      });
      setNewImages([]);
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    const priceNum = Number(form.price);
    if (!form.price || isNaN(priceNum) || priceNum < 0) { toast.error('Valid price is required'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('price', form.price);
      fd.append('description', form.description);
      fd.append('status', String(form.is_published));
      if (form.categoryId) fd.append('categoryId', form.categoryId);
      if (form.departmentId) fd.append('departmentId', form.departmentId);
      newImages.forEach((file) => fd.append('images[]', file));

      const res = await axiosInstance.put(
        `/vendors/${vendorId}/products/${product.id}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      toast.success('Product updated');
      onSuccess(
        (res.data?.data ?? res.data) || {
          name: form.name.trim(),
          price: priceNum,
          description: form.description,
          is_published: form.is_published,
          departmentId: form.departmentId ? Number(form.departmentId) : product.departmentId,
          categoryId: form.categoryId ? Number(form.categoryId) : product.categoryId,
        },
      );
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-2xl my-auto glass-card rounded-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-black">Edit Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-2 max-h-[75vh]">
        <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Product name"
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price (₦) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="e.g. 15000"
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</label>
              <div className="relative">
                <select
                  className="w-full h-10 px-3 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm appearance-none outline-none cursor-pointer text-white"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, departmentId: e.target.value, categoryId: '' }))
                  }
                >
                  <option value="" className="bg-zinc-900">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)} className="bg-zinc-900">{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
              <div className="relative">
                <select
                  className="w-full h-10 px-3 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm appearance-none outline-none cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  value={form.categoryId}
                  disabled={!form.departmentId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="" className="bg-zinc-900">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)} className="bg-zinc-900">{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visibility</label>
            <div className="flex gap-3">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_published: val }))}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border ${
                    form.is_published === val
                      ? val
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                  }`}
                >
                  {val ? 'Published' : 'Unpublished'}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={1000}
              placeholder="Product description…"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none resize-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Existing images */}
          {product.images && product.images.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Current Images
              </label>
              <div className="flex gap-2 flex-wrap">
                {product.images.map((img) => (
                  <div key={img.id} className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New images */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Add New Images
            </label>
            <div
              className="border-2 border-dashed border-white/10 rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors text-center group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5 group-hover:text-primary transition-colors" />
              <p className="text-xs text-muted-foreground">Click to select images</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) setNewImages((prev) => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
            </div>

            {newImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {newImages.map((file, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 group"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-product-form"
            disabled={loading}
            className="rounded-xl gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Product
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Dashboard / Stats tab ────────────────────────────────────── */

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function ProductDashboard({ vendorId, productId }: { vendorId: number; productId: number }) {
  const [startDate, setStartDate] = useState(daysAgoStr(30));
  const [endDate, setEndDate] = useState(todayStr());
  const [applied, setApplied] = useState({ start: daysAgoStr(30), end: todayStr() });

  const { data: ordersData, isFetching } = useGetProductOrdersQuery({
    vendorId,
    productId,
    page: 1,
    limit: 500,
    start_date: applied.start,
    end_date: applied.end,
  });
  const orders = ordersData?.data ?? [];

  const totalRevenue = orders.reduce((s, o) => s + o.priceOnPurchase * o.quantity, 0);
  const totalUnits = orders.reduce((s, o) => s + o.quantity, 0);

  const chartMap: Record<string, { date: string; revenue: number; units: number }> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    if (!chartMap[d]) chartMap[d] = { date: d, revenue: 0, units: 0 };
    chartMap[d]!.revenue += o.priceOnPurchase * o.quantity;
    chartMap[d]!.units += o.quantity;
  });
  const chartData = Object.values(chartMap).slice(-14);

  const statCards = [
    { icon: TrendingUp, label: 'Total Revenue',  value: fmt(totalRevenue),       color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { icon: ShoppingBag, label: 'Units Sold',    value: String(totalUnits),       color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
    { icon: AlertCircle, label: 'Total Orders',  value: String(orders.length),   color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  ];

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">From</label>
            <Input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5 border-white/10 h-9 text-sm"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">To</label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              max={todayStr()}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5 border-white/10 h-9 text-sm"
            />
          </div>
          <Button
            onClick={() => setApplied({ start: startDate, end: endDate })}
            disabled={isFetching}
            className="h-9 px-5 rounded-xl gap-2 text-sm shrink-0"
          >
            {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Apply
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Showing data from <span className="text-white font-bold">{applied.start}</span> to{' '}
          <span className="text-white font-bold">{applied.end}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5 space-y-3"
          >
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Revenue Over Time</p>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No order data yet</p>
        ) : (
          <ReactApexChart
            type="area"
            height={220}
            series={[{ name: 'Revenue', data: chartData.map((d) => d.revenue) }]}
            options={{
              chart: { type: 'area', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, easing: 'easeinout', speed: 600 } },
              theme: { mode: 'dark' },
              colors: ['#6366f1'],
              stroke: { curve: 'smooth', width: 2 },
              fill: {
                type: 'gradient',
                gradient: { shadeIntensity: 1, colorStops: [{ offset: 0, color: '#6366f1', opacity: 0.35 }, { offset: 100, color: '#6366f1', opacity: 0 }] },
              },
              xaxis: {
                categories: chartData.map((d) => d.date),
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'inherit' } },
              },
              yaxis: {
                labels: {
                  style: { colors: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'inherit' },
                  formatter: (v: number) => `₦${(v / 1000).toFixed(0)}k`,
                },
              },
              tooltip: {
                theme: 'dark',
                style: { fontFamily: 'inherit' },
                y: { formatter: (v: number) => fmt(v), title: { formatter: () => 'Revenue:' } },
              },
              grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4, xaxis: { lines: { show: false } } },
              dataLabels: { enabled: false },
              markers: { size: 0 },
            }}
          />
        )}
      </div>

      {chartData.length > 0 && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Units Sold Per Day</p>
          <ReactApexChart
            type="bar"
            height={180}
            series={[{ name: 'Units Sold', data: chartData.map((d) => d.units) }]}
            options={{
              chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, easing: 'easeinout', speed: 500 } },
              theme: { mode: 'dark' },
              colors: ['#6366f1'],
              plotOptions: { bar: { borderRadius: 5, columnWidth: '55%', borderRadiusApplication: 'end' } },
              fill: { opacity: 0.85 },
              xaxis: {
                categories: chartData.map((d) => d.date),
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'inherit' } },
              },
              yaxis: {
                labels: {
                  style: { colors: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'inherit' },
                  formatter: (v: number) => String(Math.round(v)),
                },
              },
              tooltip: {
                theme: 'dark',
                style: { fontFamily: 'inherit' },
                y: { title: { formatter: () => 'Units:' } },
              },
              grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4, xaxis: { lines: { show: false } } },
              dataLabels: { enabled: false },
              states: { hover: { filter: { type: 'lighten', value: 0.1 } } },
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Add Sub-product modal ────────────────────────────────────── */

interface AddBatchModalProps {
  open: boolean;
  onClose: () => void;
  vendorId: number;
  productId: number;
  onSuccess: () => void;
}

function AddBatchModal({ open, onClose, vendorId, productId, onSuccess }: AddBatchModalProps) {
  const [form, setForm] = useState({ quantity: '', cost_price: '', expiry_date: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantity || !form.cost_price) {
      toast.error('Quantity and cost price are required');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post(`/vendors/${vendorId}/products/${productId}/refill`, {
        quantity: Number(form.quantity),
        cost_price: Number(form.cost_price),
        expiry_date: form.expiry_date || undefined,
      });
      toast.success('Batch added successfully');
      setForm({ quantity: '', cost_price: '', expiry_date: '' });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to add batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Add Sub-Product Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantity *</label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 100"
              className="bg-white/5 border-white/10"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cost Price (₦) *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 5000"
              className="bg-white/5 border-white/10"
              value={form.cost_price}
              onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expiry Date (optional)</label>
            <Input
              type="date"
              className="bg-white/5 border-white/10"
              value={form.expiry_date}
              onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Batch order history modal ────────────────────────────────── */

function BatchOrderHistory({ batchNo, subProductId, onClose }: { batchNo: string; subProductId: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg">Batch {batchNo}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Sub-product ID: #{subProductId}</p>
        <p className="text-sm text-muted-foreground">Order history is available in the Orders tab, filtered by this product.</p>
        <Button className="w-full rounded-xl" onClick={onClose}>Close</Button>
      </motion.div>
    </div>
  );
}

/* ─── Sub-products tab ─────────────────────────────────────────── */

function SubProductsTab({ vendorId, product }: { vendorId: number; product: Product }) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<SubProduct | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const subProductColumns: SearchableColumnDef<SubProduct>[] = [
    {
      accessorKey: 'batch_no',
      header: 'Batch No',
      searchable: true,
      cell: ({ row }) => (
        <span className="font-black text-xs tracking-wider">{row.original.batch_no}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => <span className="font-bold">{row.original.quantity}</span>,
    },
    {
      accessorKey: 'quantity_sold',
      header: 'Sold',
      cell: ({ row }) => <span className="font-bold text-primary">{row.original.quantity_sold}</span>,
    },
    {
      accessorKey: 'cost_price',
      header: 'Cost Price',
      cell: ({ row }) => (
        <span className="font-bold">{fmt(Number(row.original.cost_price))}</span>
      ),
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry',
      cell: ({ row }) => (
        <span className="text-xs">{fmtDate(row.original.expiry_date as string | null)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.status ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-rose-400 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />Inactive
          </span>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: 'View Orders',
              icon: <ShoppingBag className="w-3.5 h-3.5" />,
              onClick: () => setSelectedBatch(row.original),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable<SubProduct>
        key={refreshKey}
        url={`/vendors/${vendorId}/products/${product.id}/batches`}
        columns={subProductColumns}
        title="Sub Products"
        enableGlobalSearch
        searchFields={['batch_no']}
        filters={[
          {
            column: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
          { column: 'expiry_date_from', label: 'Expires From', type: 'date' },
          { column: 'expiry_date_to',   label: 'Expires To',   type: 'date' },
        ]}
        headerActions={
          <Button className="h-9 px-4 rounded-xl gap-2 text-sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Batch
          </Button>
        }
      />

      <AddBatchModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        vendorId={vendorId}
        productId={product.id}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {selectedBatch && (
        <BatchOrderHistory
          batchNo={selectedBatch.batch_no}
          subProductId={selectedBatch.id}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </>
  );
}

/* ─── Orders tab ───────────────────────────────────────────────── */

function OrdersTab({ vendorId, productId }: { vendorId: number; productId: number }) {
  const orderColumns: SearchableColumnDef<VendorOrder>[] = [
    {
      id: 'ref_no',
      header: 'Order Ref',
      searchable: true,
      cell: ({ row }) => (
        <span className="font-black text-xs tracking-wider">
          {row.original.orderGroup?.ref_no ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => <span className="font-bold">{row.original.quantity}</span>,
    },
    {
      id: 'cost_price',
      header: 'Cost Price',
      cell: ({ row }) => {
        const cost = row.original.subProducts?.[0]?.subProduct?.cost_price;
        return cost != null
          ? <span className="text-rose-400 font-bold">{fmt(Number(cost))}</span>
          : <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      accessorKey: 'priceOnPurchase',
      header: 'Selling Price',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-400">{fmt(row.original.priceOnPurchase)}</span>
      ),
    },
    {
      id: 'revenue',
      header: 'Total Revenue',
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {fmt(row.original.priceOnPurchase * row.original.quantity)}
        </span>
      ),
    },
    {
      id: 'profit',
      header: 'Profit',
      cell: ({ row }) => {
        const cost = row.original.subProducts?.[0]?.subProduct?.cost_price;
        if (cost == null) return <span className="text-muted-foreground text-xs">—</span>;
        const profit = (row.original.priceOnPurchase - Number(cost)) * row.original.quantity;
        return (
          <span className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {fmt(profit)}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => <span className="text-xs">{fmtDate(row.original.createdAt)}</span>,
    },
  ];

  return (
    <DataTable<VendorOrder>
      url={`/vendors/${vendorId}/products/${productId}/orders`}
      columns={orderColumns}
      title="Product Orders"
      enableGlobalSearch
      searchFields={['orderGroup.ref_no']}
      filters={[
        { column: 'createdAt_from', label: 'From Date', type: 'date' },
        { column: 'createdAt_to',   label: 'To Date',   type: 'date' },
      ]}
    />
  );
}

/* ─── Root component ───────────────────────────────────────────── */

interface VendorProductViewProps {
  vendorId: number;
  product: Product;
  onBack: () => void;
  onProductUpdated?: () => void;
}

export default function VendorProductView({ vendorId, product, onBack, onProductUpdated }: VendorProductViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editOpen, setEditOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>(product);

  const price = typeof currentProduct.price === 'string'
    ? parseFloat(currentProduct.price)
    : currentProduct.price;

  const handleEditSuccess = (updated: Partial<Product>) => {
    setCurrentProduct((p) => ({ ...p, ...updated }));
    onProductUpdated?.();
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      {/* Product header card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <ImageGallery images={currentProduct.images as ProductImage[] | undefined} />

        <div className="p-5 space-y-3 border-t border-white/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-start gap-3">
                <h2 className="text-2xl font-black">{currentProduct.name}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    currentProduct.is_published
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : 'text-rose-400 bg-rose-400/10'
                  }`}
                >
                  {currentProduct.is_published ? 'Published' : 'Unpublished'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="text-primary font-black">{fmt(price)}</span>
                {currentProduct.category && <span>{currentProduct.category.name}</span>}
                {currentProduct.department && <span>{currentProduct.department.name}</span>}
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Qty: {currentProduct.quantity}
                </span>
              </div>
              {currentProduct.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{currentProduct.description}</p>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={() => setEditOpen(true)}
              className="shrink-0 h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 gap-2 text-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-bold capitalize transition-all border-b-2 -mb-px ${
              activeTab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'dashboard'    && <ProductDashboard vendorId={vendorId} productId={currentProduct.id} />}
          {activeTab === 'sub-products' && <SubProductsTab vendorId={vendorId} product={currentProduct} />}
          {activeTab === 'orders'       && <OrdersTab vendorId={vendorId} productId={currentProduct.id} />}
        </motion.div>
      </AnimatePresence>

      <EditProductModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        vendorId={vendorId}
        product={currentProduct}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
