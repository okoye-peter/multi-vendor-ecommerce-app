import React from 'react'
import { DataTable, type SearchableColumnDef } from '../../../components/DataTable';
import { format } from 'date-fns';
import type { Filter } from '../../../types/Index';

interface Order {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    quantity: number;
    productId: number | null;
    requestedQuantity: number;
    orderGroupId: number;
    priceOnPurchase: number;
    product: {
        id: number,
        name: string
    },
    orderGroup: {
        id: number,
        ref_no: string
    },
    [key: string]: unknown;
}

const Index = () => {
    const dataTableFilters: Filter[] = [
        {
            column: 'createdAt',
            label: 'Created Date',
            type: 'dateRange',
        },

    ];

    const dataTableColumns: SearchableColumnDef<Order>[] = [
        {
            id: 'id',
            accessorKey: 'id',
            header: 'ID',
        },
        {
            id: 'order',
            accessorKey: 'orderGroup.ref_no',
            header: 'Order Ref No.',
            searchable: true,
        },
        {
            id: 'product',
            accessorKey: 'product.name',
            header: 'Product Name',
            searchable: true
        },
        {
            id: 'quantity',
            accessorKey: 'quantity',
            header: 'Qty',
            // searchable: true,
            // cell: ({ row }) => row.original.department?.name || 'N/A',
        },
        {
            id: 'price',
            accessorKey: 'priceOnPurchase',
            header: 'Unit Price',
            cell: ({ getValue }) => `₦${(getValue() as number).toFixed(2)}`,
        },
        {
            id: 'total',
            // accessorKey: undefined, // Since we're computing this value
            header: 'Total Price',
            cell: ({ row }) => `₦${(row.original.quantity * row.original.priceOnPurchase).toFixed(2)}`,
        },
        {
            id: 'created_at',
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: ({ getValue }) => format(new Date(getValue() as string), 'd MMM, yyyy'),
        },
    ];


    return (
        <>
            <DataTable<Order>
                url={`/vendors/orders`}
                columns={dataTableColumns}
                filters={dataTableFilters}
                title="Orders"
                defaultPageSize={10}
            // key={dataTableKey}
            // headerActions={
            //     <button
            //         className="btn btn-primary"
            //         onClick={() => (document.getElementById('reportDateFilterModal') as HTMLDialogElement)?.showModal()}
            //     >
            //         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 mr-2" fill="currentColor" stroke="currentColor">
            //             <path d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z"/>
            //         </svg>
            //         Download Report
            //     </button>
            // }
            />
        </>
    )
}

export default Index