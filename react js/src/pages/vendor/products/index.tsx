import { DataTable, type SearchableColumnDef } from "../../../components/DataTable.tsx";
import type { Category, Department, Filter, Product } from "../../../types/Index.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllCategory, getAllDepartments, toggleProductPublicity } from "../../../libs/api.ts";
import CreateProduct from './modals/Create.tsx';
import { useState } from "react";
import ActionDropdown from "../../../components/DataTableActionDropDown.tsx";
import DeleteProductModal from "./modals/Delete.tsx";
import EditProductModal from "./modals/Edit.tsx";
import { Rss } from "lucide-react";
import { toast } from "react-toastify";
import FullPageLoader from "../../../components/FullPageLoader.tsx";
import { Link } from "react-router";


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

    const dataTableColumns: SearchableColumnDef<Product>[] = [
        {
            id: 'id',
            accessorKey: 'id',
            header: 'ID',
        },
        {
            id: 'name',
            accessorKey: 'name',
            header: 'Product Name',
            searchable: true,
        },
        {
            id: 'category',
            accessorKey: 'category.name',
            header: 'Category',
            searchable: true,
            cell: ({ row }) => row.original.category?.name || 'N/A',
        },
        {
            id: 'department',
            accessorKey: 'department.name',
            header: 'Department',
            searchable: true,
            cell: ({ row }) => row.original.department?.name || 'N/A',
        },
        {
            id: 'price',
            accessorKey: 'price',
            header: 'Price',
            cell: ({ getValue }) => `₦${(getValue() as number).toFixed(2)}`,
        },
        {
            id: 'quantity_available',
            accessorKey: 'quantity',
            header: 'Qty Available',
        },
        {
            id: 'vendor',
            accessorKey: 'vendor.name',
            header: 'Vendor',
        },
        {
            id: 'published',
            accessorKey: 'is_published',
            header: 'Published',
            cell: ({ getValue }) => (
                <>
                    {getValue() && <span className="px-3 py-1 text-xs text-green-900 bg-green-100 rounded">Published</span>}
                    {!getValue() && <span className="px-3 py-1 text-xs text-red-900 bg-red-100 rounded">Unpublished</span>}
                </>
            ),
        },
        {
            id: 'Actions',
            accessorKey: 'action',
            header: 'Actions',
            cell: ({ row }) => (
                <ActionDropdown>
                    <li>
                        <Link to={`/vendor/${row.original.vendorId}/products/${row.original.id}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                        </Link>
                    </li>
                    <li>
                        <a onClick={() => togglePublicity({vendorId: row.original.vendorId as number, productId: row.original.id as number})}>
                            <Rss className="w-4 h-4" />
                            { row.original.is_published ? 'Unpublish' : 'Publish' }
                        </a>
                    </li>
                    <li>
                        <a onClick={() => showEditModal(row.original)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </a>
                    </li>
                    <div className="my-0 divider"></div>
                    <li>
                        <a onClick={() => showDeleteWarningModal(row.original)} className="text-error">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </a>
                    </li>
                </ActionDropdown>
            ),
        },
    ];

    // ✅ Define filters with dynamic options
    const dataTableFilters: Filter[] = [
        {
            column: 'categoryId',
            label: 'Category',
            type: 'select',
            options: categories?.map((cat: Category) => ({
                value: String(cat.id),
                label: cat.name
            })),
        },
        {
            column: 'departmentId',
            label: 'Department',
            type: 'select',
            options: departments?.map((dept: Department) => ({
                value: String(dept.id),
                label: dept.name
            })),
        },
        {
            column: 'is_published',
            label: 'Published',
            type: 'select',
            options: [
                {
                    label: 'Published',
                    value: true
                },
                {
                    label: 'Unpublished',
                    value: false
                },
            ],
        },
        // {
        //     column: 'createdAt',
        //     label: 'Created Date',
        //     type: 'dateRange',
        // },
    ];

    const handleRowClick = (product: Product) => {
        console.log('Product clicked:', product);
        // Handle row click - navigate to detail page, open modal, etc.
    };

    const showDeleteWarningModal = (product: Product) => {
        setProductToDelete(product);
        (document.getElementById('deleteProductWarningModal') as HTMLDialogElement)?.showModal()
    }

    const showEditModal = (product: Partial<Product>) => {
        setProductIdToEdit(Number(product.id))
        setProductVendorIdIdToEdit(Number(product.vendorId))
    }

    const resetDataOnProductUpdate = () => {
        setDataTableKey(prev => prev + 1);
        setProductIdToEdit(0);
        setProductVendorIdIdToEdit(0)
    }

    const { mutate: togglePublicity, isPending:productPublicityIsPending} = useMutation({
        mutationFn: ({vendorId , productId}: {vendorId: number, productId:number}) => toggleProductPublicity(vendorId, productId),
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data.message)
            setDataTableKey((prev) => prev + 1)
        }
    })

    if (departmentsIsLoading || categoriesIsLoading || productPublicityIsPending) {
        return <FullPageLoader />;
    }

    return (
        <>
            <DataTable<Product>
                url={`/vendors/products`}
                columns={dataTableColumns}
                filters={dataTableFilters}
                title="Products"
                defaultPageSize={10}
                onRowClick={handleRowClick}
                key={dataTableKey}
                headerActions={
                    <button className="btn btn-primary" onClick={() => (document.getElementById('createProductModal') as HTMLDialogElement)?.showModal()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                    </button>
                }
            />

            {/* create product modal */}
            <CreateProduct categories={categories!} departments={departments!} onProductCreated={() => { setDataTableKey(prev => prev + 1); console.log('product created') }} />
                
            {/* edit product modal */}
            <EditProductModal categories={categories!} departments={departments!} productId={productIdToEdit} vendorId={productVendorIdIdToEdit} onProductUpdated={() => { resetDataOnProductUpdate(); console.log('product updated') }} />
            
            {/* delete product modal */}
            <DeleteProductModal product={productToDelete} onProductDeleted={() => { setDataTableKey((prev) => prev + 1); console.log('product deleted') }} />

        </>
    );
}

export default ProductsTable;