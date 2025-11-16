import { DataTable, type SearchableColumnDef } from "../../../components/DataTable";
import type { Category, Department, Filter, Product } from "../../../types/Index";
import { useQuery } from "@tanstack/react-query";
import { getAllCategory, getAllDepartments } from "../../../libs/api";
import PageLoader from "../../../components/PageLoader";
import CreateProduct from './modals/Create.tsx';
import { useState } from "react";
import ActionDropdown from "../../../components/DataTableActionDropDown.tsx";


const ProductsTable = () => {
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
            id: 'Actions',
            accessorKey: 'action',
            header: 'Actions',
            cell: ({ row }) => (
                <ActionDropdown>
                    <li>
                        <a onClick={() => console.log('View', row.original)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                        </a>
                    </li>
                    <li>
                        <a onClick={() => console.log('Edit', row.original)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </a>
                    </li>
                    <div className="my-0 divider"></div>
                    <li>
                        <a onClick={() => console.log('Delete', row.original)} className="text-error">
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
            column: 'price',
            label: 'Min Price',
            type: 'text',
            placeholder: 'Enter minimum price',
        },
        {
            column: 'createdAt',
            label: 'Created Date',
            type: 'dateRange',
        },
    ];

    const handleRowClick = (product: Product) => {
        console.log('Product clicked:', product);
        // Handle row click - navigate to detail page, open modal, etc.
    };

    if (departmentsIsLoading || categoriesIsLoading) {
        return <PageLoader />;
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
                    <button className="btn btn-primary" onClick={() => document.getElementById('createProductModal')?.showModal()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                    </button>
                }
            />

            {/* create product modal */}
            <CreateProduct categories={categories!} departments={departments!} onProductCreated={() => { setDataTableKey(prev => prev + 1) }} />
        </>
    );
}

export default ProductsTable;

// Example 2: Orders Table
// export function OrdersTableExample() {
//     const columns: ColumnDef<Order>[] = [
//         {
//             accessorKey: 'id',
//             header: 'Order ID',
//             cell: info => <span className="font-mono text-sm">#{info.getValue() as number}</span>,
//         },
//         {
//             accessorKey: 'name',
//             header: 'Customer',
//             cell: info => <span className="font-medium">{info.getValue() as string}</span>,
//         },
//         {
//             accessorKey: 'email',
//             header: 'Email',
//         },
//         {
//             accessorKey: 'username',
//             header: 'Status',
//             cell: () => <span className="badge badge-success">Active</span>,
//         },
//     ];

//     const filters: Filter[] = [
//         {
//             column: 'orderDate',
//             label: 'Order Date',
//             type: 'dateRange',
//         },
//         {
//             column: 'status',
//             label: 'Status',
//             type: 'select',
//             options: [
//                 { value: 'pending', label: 'Pending' },
//                 { value: 'shipped', label: 'Shipped' },
//                 { value: 'delivered', label: 'Delivered' },
//                 { value: 'cancelled', label: 'Cancelled' },
//             ],
//         },
//     ];

//     return (
//         <DataTable<Order>
//             url="https://jsonplaceholder.typicode.com/users"
//             columns={columns}
//             filters={filters}
//             title="Orders Management"
//             defaultPageSize={10}
//         />
//     );
// }