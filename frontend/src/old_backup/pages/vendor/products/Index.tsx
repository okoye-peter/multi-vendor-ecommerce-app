import { DataTable, type SearchableColumnDef } from "@/components/DataTable";
import type { Category, Department, Filter, Product } from "@/types/Index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllCategory, getAllDepartments, toggleProductPublicity } from "@/libs/api";
import CreateProduct from './modals/Create';
import { useState, useMemo, useCallback } from "react";
import ActionDropdown from "@/components/DataTableActionDropDown";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import DeleteProductModal from "./modals/Delete";
import EditProductModal from "./modals/Edit";
import { Rss, Eye, Edit3, Trash2, Plus, Package } from "lucide-react";
import { toast } from "react-toastify";
import FullPageLoader from "@/components/FullPageLoader";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/utils/index";
import { cn } from "@/utils/cn";

const ProductsTable = () => {
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
    const [productIdToEdit, setProductIdToEdit] = useState<number | null>(null)
    const [productVendorIdIdToEdit, setProductVendorIdIdToEdit] = useState<number | null>(null)
    const [dataTableKey, setDataTableKey] = useState<number>(1111)
    
    const { data: categories, isLoading: categoriesIsLoading } = useQuery<Category[]>({
        queryKey: ['allCategories'],
        queryFn: getAllCategory
    })

    const { data: departments, isLoading: departmentsIsLoading } = useQuery<Department[]>({
        queryKey: ['allDepartments'],
        queryFn: getAllDepartments
    })

    const showDeleteWarningModal = useCallback((product: Product) => {
        setProductToDelete(product);
        (document.getElementById('deleteProductWarningModal') as HTMLDialogElement)?.showModal()
    }, []);

    const showEditModal = useCallback((product: Partial<Product>) => {
        setProductIdToEdit(Number(product.id))
        setProductVendorIdIdToEdit(Number(product.vendorId))
    }, []);

    const resetDataOnProductUpdate = () => {
        setDataTableKey(prev => prev + 1);
        setProductIdToEdit(0);
        setProductVendorIdIdToEdit(0)
    }

    const { mutate: togglePublicity, isPending: productPublicityIsPending } = useMutation({
        mutationFn: ({ vendorId, productId }: { vendorId: number, productId: number }) => toggleProductPublicity(vendorId, productId),
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data.message)
            setDataTableKey((prev) => prev + 1)
        }
    })

    const dataTableColumns: SearchableColumnDef<Product>[] = useMemo(() => [
        {
            id: 'id',
            accessorKey: 'id',
            header: 'Hash ID',
            cell: (info) => (
                <span className="font-mono text-[10px] text-muted-foreground font-bold">
                    #{String(info.getValue()).padStart(4, '0')}
                </span>
            )
        },
        {
            id: 'name',
            accessorKey: 'name',
            header: 'Product Narrative',
            searchable: true,
            cell: (info) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <Package size={18} />
                    </div>
                    <span className="font-black tracking-tight">{String(info.getValue())}</span>
                </div>
            )
        },
        {
            id: 'category',
            accessorKey: 'category.name',
            header: 'Category',
            searchable: true,
            cell: (info) => (
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-lg">
                    {info.row.original.category?.name || 'GENERIC'}
                </Badge>
            ),
        },
        {
            id: 'department',
            accessorKey: 'department.name',
            header: 'Unit',
            searchable: true,
            cell: (info) => (
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                    {info.row.original.department?.name || 'N/A'}
                </span>
            ),
        },
        {
            id: 'price',
            accessorKey: 'price',
            header: 'Valuation',
            cell: (info) => (
                <span className="font-black text-sm tracking-tight">
                    {formatPrice(Number(info.getValue()))}
                </span>
            ),
        },
        {
            id: 'quantity_available',
            accessorKey: 'quantity',
            header: 'Inventory',
            cell: (info) => (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full animate-pulse",
                        Number(info.getValue()) > 10 ? "bg-emerald-500" : "bg-rose-500"
                    )} />
                    <span className="font-bold text-xs">{String(info.getValue())} UNITS</span>
                </div>
            )
        },
        {
            id: 'published',
            accessorKey: 'is_published',
            header: 'Relay Status',
            cell: (info) => (
                <Badge className={cn(
                    "border-none font-black text-[9px] tracking-widest px-2.5 py-0.5 rounded-full uppercase",
                    info.getValue() ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                )}>
                    {info.getValue() ? 'Published' : 'Draft'}
                </Badge>
            ),
        },
        {
            id: 'Actions',
            accessorKey: 'id',
            header: 'Operations',
            cell: (info) => (
                <ActionDropdown>
                    <DropdownMenuItem asChild>
                        <Link 
                            to={`/vendor/${info.row.original.vendorId}/products/${info.row.original.id}`}
                            className="flex items-center gap-2 cursor-pointer font-black text-[10px] uppercase tracking-widest py-2"
                        >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            Inspection Details
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => togglePublicity({ vendorId: info.row.original.vendorId as number, productId: info.row.original.id as number })}
                        className="flex items-center gap-2 cursor-pointer font-black text-[10px] uppercase tracking-widest py-2"
                    >
                        <Rss className="w-3.5 h-3.5 text-indigo-500" />
                        {info.row.original.is_published ? 'Cease Relay' : 'Initialize Relay'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => showEditModal(info.row.original)}
                        className="flex items-center gap-2 cursor-pointer font-black text-[10px] uppercase tracking-widest py-2"
                    >
                        <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                        Modify Matrix
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuItem 
                        onClick={() => showDeleteWarningModal(info.row.original)}
                        className="flex items-center gap-2 cursor-pointer font-black text-[10px] uppercase tracking-widest py-2 text-destructive focus:text-destructive focus:bg-destructive/5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Purge Entry
                    </DropdownMenuItem>
                </ActionDropdown>
            ),
        },
    ], [showDeleteWarningModal, showEditModal, togglePublicity]);

    const dataTableFilters: Filter[] = [
        {
            column: 'categoryId',
            label: 'Taxonomy Category',
            type: 'select',
            options: categories?.map((cat: Category) => ({
                value: String(cat.id),
                label: cat.name
            })),
        },
        {
            column: 'departmentId',
            label: 'Operational Unit',
            type: 'select',
            options: departments?.map((dept: Department) => ({
                value: String(dept.id),
                label: dept.name
            })),
        },
        {
            column: 'is_published',
            label: 'Relay Integrity',
            type: 'select',
            options: [
                { label: 'Published Only', value: true },
                { label: 'Drafts Only', value: false },
            ],
        },
    ];

    const handleRowClick = (product: Product) => {
        console.log('Product selected:', product.id);
    };

    if (departmentsIsLoading || categoriesIsLoading || productPublicityIsPending) {
        return <FullPageLoader />;
    }

    return (
        <div className="animate-fade-in">
            <DataTable<Product>
                url={`/vendors/products`}
                columns={dataTableColumns}
                filters={dataTableFilters}
                title="Inventory Repository"
                defaultPageSize={10}
                onRowClick={handleRowClick}
                key={dataTableKey}
                headerActions={
                    <Button 
                        onClick={() => (document.getElementById('createProductModal') as HTMLDialogElement)?.showModal()}
                        className="h-11 rounded-xl font-black gap-2 shadow-xl shadow-primary/20 hover-lift"
                    >
                        <Plus className="w-4 h-4" />
                        Onboard Asset
                    </Button>
                }
            />

            {/* Modals remain for functional continuity */}
            <CreateProduct categories={categories!} departments={departments!} onProductCreated={() => { setDataTableKey(prev => prev + 1) }} />
            <EditProductModal categories={categories!} departments={departments!} productId={productIdToEdit} vendorId={productVendorIdIdToEdit} onProductUpdated={() => { resetDataOnProductUpdate() }} />
            <DeleteProductModal product={productToDelete} onProductDeleted={() => { setDataTableKey((prev) => prev + 1) }} />
        </div>
    );
}

export default ProductsTable;