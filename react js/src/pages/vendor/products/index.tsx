import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../components/DataTable";
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

    const { data: categories, isLoading: categoriesIsLoading } = useQuery({
        queryKey: ['allCategories'],
        queryFn: getAllCategory
    })

    const { data: departments, isLoading: departmentsIsLoading } = useQuery({
        queryKey: ['allDepartments'],
        queryFn: getAllDepartments
    })

    const dataTableColumns: ColumnDef<Product>[] = [
        {
            accessorKey: 'name',
            header: 'Product Name',
            cell: info => <span className="font-medium">{info.getValue() as string}</span>,
        },
        {
            accessorKey: 'category.name',
            header: 'Category',
            cell: info => (
                <span className="badge badge-primary badge-outline">{info.getValue() as string}</span>
            ),
        },
        {
            accessorKey: 'department.name',
            header: 'Department',
            cell: info => (
                <span className="badge badge-secondary badge-outline">{info.getValue() as string}</span>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: info => <span className="font-semibold text-success">{info.getValue() as string}</span>,
        },
        // {
        //     accessorKey: 'stock',
        //     header: 'Stock',
        //     cell: info => {
        //         const stock = info.getValue() as number;
        //         const badgeColor = stock > 50 ? 'badge-success' : stock > 20 ? 'badge-warning' : 'badge-error';
        //         return <span className={`badge ${badgeColor}`}>{stock}</span>;
        //     },
        // },
    ];

    const dataTableFilters: Filter[] = [
        {
            column: 'category',
            label: 'Category',
            type: 'select',
            options: categories?.map((cat: Category) => ({
                value: cat.id,
                label: cat.name
            })),
        },
        {
            column: 'department',
            label: 'Department',
            type: 'select',
            options: departments?.map((dept: Department) => ({
                value: dept.id,
                label: dept.name
            })),
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
            url={import.meta.env.VITE_API_URL + `products/vendors`}
            columns={dataTableColumns}
            filters={dataTableFilters}
            title="Products"
            defaultPageSize={5}
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