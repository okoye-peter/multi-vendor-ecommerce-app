import { DataTable, type SearchableColumnDef } from "../../../components/DataTable";
import type { Category, Department, Filter, Product } from "../../../types/Index";
import { useQuery } from "@tanstack/react-query";
import { getAllCategory, getAllDepartments } from "../../../libs/api";
import PageLoader from "../../../components/PageLoader";

// Define your data types


// interface Order {
//     id: number;
//     name: string;
//     email: string;
//     username: string;
//     orderDate?: string;
//     status?: string;
// }

// Example 1: Products Table
const ProductsTable = () => {

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
            cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
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
        <DataTable<Product>
            url={import.meta.env.VITE_API_URL + `vendors/products`}
            columns={dataTableColumns}
            filters={dataTableFilters}
            title="Products"
            defaultPageSize={10}
            onRowClick={handleRowClick}
            headerActions={
                <button className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            }
        />
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