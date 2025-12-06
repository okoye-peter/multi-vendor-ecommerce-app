import { Trash, TriangleAlert, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { SubProduct } from '../../../../../types/Index'
import { deleteProductBatch } from '../../../../../libs/api'
import FullPageLoader from '../../../../../components/FullPageLoader'

type Props = {
    vendorId: number
    subProduct: SubProduct | null;
    onProductBatchDeleted?: () => void;
};

const DeleteProductModal = ({ vendorId, subProduct, onProductBatchDeleted }: Props) => {
    const queryClient = useQueryClient();

    const {mutate: deleteSubProductMutation, isPending, error, isError} = useMutation({
        mutationFn: ({vendorId, productId, subProductId} : {vendorId: number, productId: number, subProductId: number}) => deleteProductBatch(vendorId, productId, subProductId),
    })

    const handleDeleteSubProduct = async() => {
        (document.getElementById('deleteProductWarningModal') as HTMLDialogElement)?.close()
        await deleteSubProductMutation({vendorId: vendorId as number, productId: subProduct?.productId as number, subProductId: subProduct?.id as number})
        if(isError){
            toast.error(error.message);
        }else{
            queryClient.invalidateQueries({
                queryKey: ['getProductDetail', subProduct?.productId, vendorId],
                exact: true
            });
            onProductBatchDeleted?.();
            toast.success('product batch deleted successfully')
        }
            
    }
    
    return (
        <>
            {isPending && <FullPageLoader />}
            {/* delete product warning modal */}
            <dialog id="deleteProductWarningModal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <div className="flex items-center justify-center">
                        <TriangleAlert className="w-16 h-16 text-yellow-400 animate-pulse" />
                    </div>

                    <p className="py-4 text-xs text-center">Are you sure you want to delete this product batch</p>
                    <h3 className="text-sm font-semibold text-center text-red-500 capitalize">{subProduct?.batch_no}</h3>
                    <div className="justify-center modal-action gap-x-4">
                        <button onClick={() => {
                                const modal = document.getElementById('deleteProductWarningModal') as HTMLDialogElement;
                                modal?.close();
                            }} className="flex items-center gap-2 text-sm btn btn-outline">
                            <X />
                            Cancel
                        </button>
                        <button onClick={handleDeleteSubProduct} className="flex items-center gap-2 text-sm btn btn-outline btn-error">
                            <Trash />
                            Delete
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default DeleteProductModal