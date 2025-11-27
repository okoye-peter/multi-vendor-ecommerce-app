import { Trash, TriangleAlert, X } from 'lucide-react'
import type { Product } from '../../../../types/Index'
import FullPageLoader from '../../../../components/FullPageLoader'
import { useMutation } from '@tanstack/react-query'
import { deleteProduct } from '../../../../libs/api'
import { toast } from 'react-toastify'

type Props = {
    product: Partial<Product> | null;
    onProductDeleted?: () => void;
};

const DeleteProductModal = ({ product, onProductDeleted }: Props) => {
    const {mutate: productDeleteMutation, isPending, error, isError} = useMutation({
        mutationFn: () => deleteProduct(product?.vendorId as number, product?.id as number)
    })

    const handleDeleteProduct = async() => {
        (document.getElementById('deleteProductWarningModal') as HTMLDialogElement)?.close()
        await productDeleteMutation()
        if(isError){
            toast.error(error.message);
        }else{
            onProductDeleted?.();
            toast.success('product deleted successfully')
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

                    <p className="py-4 text-xs text-center">Are you sure you want to delete this product</p>
                    <h3 className="text-sm font-semibold text-center text-red-500 capitalize">{product?.name}</h3>
                    <div className="justify-center modal-action gap-x-4">
                        <button onClick={() => {
                                const modal = document.getElementById('deleteProductWarningModal') as HTMLDialogElement;
                                modal?.close();
                            }} className="flex items-center gap-2 text-sm btn btn-outline">
                            <X />
                            Cancel
                        </button>
                        <button onClick={handleDeleteProduct} className="flex items-center gap-2 text-sm btn btn-outline btn-error">
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