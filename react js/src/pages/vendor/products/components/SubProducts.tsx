import { Link } from "react-router";
import ActionDropdown from "../../../../components/DataTableActionDropDown";
import { DataTable, type SearchableColumnDef } from "../../../../components/DataTable";
import type { Filter, SubProduct } from "../../../../types/Index";
import { format, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { useState } from "react";
import CreateBatch from '../modals/SubProducts/Create'
import { Rss } from "lucide-react";
import { toggleProductBatchStatus } from "../../../../libs/api";
import FullPageLoader from "../../../../components/FullPageLoader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import DeleteProductBatchWarningModal from '../modals/SubProducts/Delete'
import EditBatch from '../modals/SubProducts/Edit'


const SubProducts = ({ productId, vendorId }: { productId: number, vendorId: number }) => {
    const queryClient = useQueryClient();

    const [subProductToDelete, setSubProductToDelete] = useState<SubProduct | null>(null)
    const [subProductToEdit, setSubProductToEdit] = useState<SubProduct | null>(null)
    const [dataTableKey, setDataTableKey] = useState(1111);
    const dataTableColumns: SearchableColumnDef<SubProduct>[] = [
        {
            id: 'id',
            accessorKey: 'id',
            header: 'ID',
        },
        {
            id: 'batch_no',
            accessorKey: 'batch_no',
            header: 'Batch No.',
            searchable: true,
        },
        {
            id: 'quantity',
            accessorKey: 'quantity',
            header: 'Qty',
            searchable: false,
        },
        {
            id: 'quantity_sold',
            accessorKey: 'quantity_sold',
            header: 'Qty Sold',
            searchable: false,
        },
        {
            id: 'published',
            accessorKey: 'status',
            header: 'Published',
            cell: ({ getValue }) => (
                <>
                    {getValue() && <span className="px-3 py-1 text-xs text-green-900 bg-green-100 rounded">Published</span>}
                    {!getValue() && <span className="px-3 py-1 text-xs text-red-900 bg-red-100 rounded">Unpublished</span>}
                </>
            ),
        },
        {
            id: 'expiry_date',
            accessorKey: 'expiry_date',
            header: 'Expiry Date',
            searchable: false,
            cell: ({ row }) => row.original.expiry_date ? format(new Date(row.original.expiry_date), 'd MMM, yyyy') : row.original.expiry_date
        },
        {
            id: 'status',
            accessorKey: 'expiry_date',
            header: 'Status',
            cell: ({ getValue }) => {
                const expiryDate = getValue() as string | null;

                if (!expiryDate) {
                    return <span className="px-3 py-1 text-xs text-gray-900 bg-gray-100 rounded">No Expiry</span>;
                }

                const expiry = new Date(expiryDate);
                const today = startOfDay(new Date());
                const isExpired = isBefore(expiry, today);

                if (isExpired) {
                    return <span className="px-3 py-1 text-xs text-red-900 bg-red-100 rounded">Expired</span>;
                }

                // Check if expiring soon (within 90 days)
                const daysUntilExpiry = differenceInDays(expiry, today);

                if (daysUntilExpiry <= 90) {
                    return (
                        <span className="px-3 py-1 text-xs text-yellow-900 bg-yellow-100 rounded">
                            Expiring Soon ({daysUntilExpiry} days)
                        </span>
                    );
                }

                return <span className="px-3 py-1 text-xs text-green-900 bg-green-100 rounded">Active</span>;
            },
        },
        {
            id: 'cost_price',
            accessorKey: 'cost_price',
            header: 'Cost Price',
            searchable: false,
            cell: ({ getValue }) => `₦${(getValue() as number).toFixed(2)}`,
        },
        {
            id: 'created_at',
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: ({ getValue }) => format(new Date(getValue() as string), 'd MMM, yyyy'),
        },
        {
            id: 'Actions',
            accessorKey: 'action',
            header: 'Actions',
            cell: ({ row }) => (
                <ActionDropdown>
                    {/* <li>
                        <Link to={`/`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                        </Link>
                    </li> */}
                    <li>
                        <a onClick={() => toggleBatchStatus({ vendorId, productId, subProductId: row.original.id as number })}>
                            <Rss className="w-4 h-4" />
                            {row.original.status ? 'Unpublish' : 'Publish'}
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
    ]

    // ✅ Define filters with dynamic options
    const dataTableFilters: Filter[] = [
        {
            column: 'createdAt',
            label: 'Created Date',
            type: 'dateRange',
        },
        {
            column: 'expiry_date',
            label: 'Expiry Date',
            type: 'dateRange',
        },
    ];

    const { mutate: toggleBatchStatus, isPending: toggleBatchStatusIsPending } = useMutation({
        mutationFn: ({ vendorId, productId, subProductId }: { vendorId: number, productId: number, subProductId: number }) =>
            toggleProductBatchStatus(vendorId, productId, subProductId),
        onError: (error) => {
            console.error('Toggle error:', error);
            toast.error(error.message)
        },
        onSuccess: (data) => {

            queryClient.invalidateQueries({
                queryKey: ['getProductDetail', productId, vendorId],
                refetchType: 'active'
            });

            toast.success(data.message)
            setDataTableKey((prev) => prev + 1)
        }
    })

    const showDeleteWarningModal = (subProduct: SubProduct) => {
        setSubProductToDelete(subProduct);
        (document.getElementById('deleteProductWarningModal') as HTMLDialogElement)?.showModal()
    }

    const showEditModal = (subProduct: SubProduct) => {
        setSubProductToEdit(subProduct);
        (document.getElementById('updateProductBatchModal') as HTMLDialogElement)?.showModal()
    }

    if (toggleBatchStatusIsPending) {
        return <FullPageLoader />;
    }

    return (
        <>
            <DataTable<SubProduct>
                url={`/vendors/${vendorId}/products/${productId}/batches`}
                columns={dataTableColumns}
                filters={dataTableFilters}
                title="Batches"
                defaultPageSize={10}
                key={dataTableKey}
                headerActions={
                    <button
                        className="btn btn-primary"
                        onClick={() => (document.getElementById('createSubProductModal') as HTMLDialogElement)?.showModal()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Batch
                    </button>
                }
            />

            {/* create product batch modal */}
            <CreateBatch vendorId={vendorId!} productId={productId!} onProductBatchCreated={() => { setDataTableKey(prev => prev + 1); console.log('batch created') }} />

            {/* create product batch modal */}
            <EditBatch vendorId={vendorId!} productId={productId!} subProduct={subProductToEdit!} onProductBatchUpdated={() => { setDataTableKey(prev => prev + 1); console.log('batch created') }} />

            {/* delete product batch warning modal */}
            <DeleteProductBatchWarningModal vendorId={vendorId!} subProduct={subProductToDelete} onProductBatchDeleted={() => { setDataTableKey(prev => prev + 1); console.log('batch deleted') }} />
        </>
    )
}

export default SubProducts