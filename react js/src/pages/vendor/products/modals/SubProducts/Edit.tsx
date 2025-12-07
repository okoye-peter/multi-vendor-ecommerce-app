import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import makeAnimated from 'react-select/animated';
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Select from 'react-select';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'react-toastify'
import type { AxiosError } from 'axios'
import { updateProductBatch } from '../../../../../libs/api.ts'
import type { BatchData } from './Create.tsx'
import type { Product, SubProduct } from '../../../../../types/Index.ts'
import { format } from 'date-fns'

type Props = {
    productId: number | null
    vendorId: number | null
    onProductBatchUpdated: () => void
    subProduct: SubProduct
}

const productBatchUpdateSchema = z.object({
    expiry_date: z.coerce.date().optional().nullable(),
    quantity: z.coerce.number().int().min(0).default(0),
    cost_price: z.coerce.number().nonnegative("Cost Price must be non-negative"),
    status: z.coerce.boolean().default(true)
});

export type ProductBatchUpdateData = z.infer<typeof productBatchUpdateSchema>;

const animatedComponents = makeAnimated();

const EditSubProduct = ({ productId, vendorId, onProductBatchUpdated, subProduct }: Props) => {
    const queryClient = useQueryClient();

    const statuses = [
        {
            name: 'Active',
            value: true
        },
        {
            name: 'Inactive',
            value: false
        }
    ]

    const [selectedStatus, setSelectedStatus] = useState<boolean | null>(true);

    const {
        register,
        formState: { errors },
        handleSubmit,
        setValue,
        control,
    } = useForm({
        resolver: zodResolver(productBatchUpdateSchema),
        defaultValues: {
            status: true,
            expiry_date: null,
            quantity: 0,
            cost_price: 0
        },
    })

    const { mutate: updateProductBatchMutation, isPending } = useMutation({
        mutationFn: ({ vendorId, productId, subProductId, formData }: { vendorId: number, productId: number, subProductId: number, formData: BatchData }) =>
            updateProductBatch(vendorId, productId, subProductId, formData),
        onSuccess: (data: {
            message: string,
            product: Product;
            subProduct: SubProduct
        }) => {
            // ✅ Close modal on success
            const modal = document.getElementById('updateProductBatchModal') as HTMLDialogElement;
            modal?.close();

            // Reset form
            setSelectedStatus(true);

            // ✅ Update the product quantity directly in the cache
            queryClient.setQueryData<Product>(['getProductDetail', productId, vendorId], (oldData) => {
                if (!oldData) return oldData; // Don't update if there's no existing data

                return {
                    ...oldData,
                    ...data.product
                };
            });


            // ✅ Notify parent component to reload
            onProductBatchUpdated?.();

            toast.success('Product batch updated successfully!');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            console.error('Error updating product batch:', error);
            toast.error(error?.response?.data?.message || 'Failed to update product batch');
        }
    });

    // ✅ NEW: Populate form when product data loads
    useEffect(() => {
        if (subProduct) {
            // Set form values
            setValue('quantity', subProduct.quantity);
            setValue('expiry_date', subProduct.expiry_date ? format(subProduct.expiry_date, 'yyyy-MM-dd') : null);
            setValue('cost_price', subProduct.cost_price);
            setValue('status', subProduct.status ? true : false);
            setSelectedStatus(subProduct.status ? true : false);

        }
    }, [subProduct, setValue]);

    const onSubmit: SubmitHandler<ProductBatchUpdateData> = async (formData: ProductBatchUpdateData) => {

        await updateProductBatchMutation({
            vendorId: vendorId as number,
            productId: productId as number,
            subProductId: subProduct.id,
            formData
        });
        onProductBatchUpdated?.()
    }


    return (
        <>

            {
                <dialog id="updateProductBatchModal" className="modal">
                    <div className="w-11/12 max-w-5xl modal-box">
                        <h3 className="text-lg font-bold">Update Batch: #{subProduct?.batch_no}</h3>
                        <button
                            className="absolute btn btn-sm btn-circle btn-ghost right-2 top-2"
                            onClick={() => {
                                const modal = document.getElementById('updateProductBatchModal') as HTMLDialogElement;
                                modal?.close();
                            }}
                        >
                            ✕
                        </button>
                        <div className="modal-action">
                            <form onSubmit={handleSubmit(onSubmit)} className='flex-1 overflow-hidden'>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className='relative'>
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            {...register('quantity', { valueAsNumber: true })}
                                            className={`w-full input text-sm h-[38px] focus:outline-none focus:border-[#388bff] input-bordered ${errors.quantity ? 'input-error' : ''}`}
                                            placeholder="product quantity"
                                        />
                                        {errors.quantity && <p className="mt-1 text-xs text-error">{errors.quantity.message}</p>}
                                    </div>
                                    <div className="form-control">
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            <span className="label-text">Status <small className='text-xs text-gray-400'>(active means visible to customer, inactive means otherwise)</small></span>
                                        </label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select<{ name: string, value: boolean }, false>
                                                    closeMenuOnSelect
                                                    components={animatedComponents}
                                                    options={statuses ?? []}
                                                    getOptionLabel={(option: { name: string, value: boolean }) => option.name}
                                                    getOptionValue={(option: { name: string, value: boolean }) => String(option.value)}
                                                    value={statuses?.find(status => status.value === selectedStatus) || null}
                                                    onChange={(val) => {
                                                        const statusValue = val?.value ?? true;
                                                        setSelectedStatus(statusValue);
                                                        field.onChange(statusValue);
                                                    }}
                                                    onBlur={field.onBlur}
                                                    isClearable
                                                    placeholder="Select product status..."
                                                    classNames={{
                                                        control: () => '!bg-transparent',
                                                        menu: () => 'bg-base-100 border border-base-300',
                                                        menuList: () => 'bg-base-100',
                                                        option: (state) =>
                                                            state.isSelected
                                                                ? 'bg-primary text-primary-content'
                                                                : state.isFocused
                                                                    ? 'bg-base-200'
                                                                    : '',
                                                        input: () => 'text-sm !text-base-content',
                                                        singleValue: () => 'text-sm !text-base-content',
                                                        placeholder: () => 'text-sm !text-base-content/60',
                                                        dropdownIndicator: () => 'text-sm !text-base-content/60',
                                                        clearIndicator: () => 'text-sm !text-base-content/60',
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.status && <p className="mt-1 text-xs text-error">{errors.status.message}</p>}
                                    </div>
                                    <div className='relative'>
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            Cost Price
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('cost_price', { valueAsNumber: true })}
                                            className={`w-full input text-sm h-[38px] pl-6 focus:outline-none bg-transparent focus:border-[#388bff] input-bordered ${errors.cost_price ? 'input-error' : ''}`}
                                            placeholder="product cost price"
                                        />
                                        <span className="absolute left-1.5 top-[35px] text-[17px] text-gray-600">₦</span>
                                        {errors.cost_price && <p className="mt-1 text-xs text-error">{errors.cost_price.message}</p>}
                                    </div>

                                    <div className='relative'>
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            Expiry Date <small className='text-xs text-gray-400'>(optional)</small>
                                        </label>
                                        <input
                                            type="date"
                                            {...register('expiry_date')}
                                            className={`w-full input text-sm h-[38px] focus:outline-none focus:border-[#388bff] input-bordered ${errors.expiry_date ? 'input-error' : ''}`}
                                            placeholder="enter product expiry date"
                                        />
                                        {errors.expiry_date && <p className="mt-1 text-xs text-error">{errors.expiry_date.message}</p>}
                                    </div>

                                </div>


                                <button
                                    className="block my-3 ml-auto btn btn-primary"
                                    type='submit'
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Updating Product...
                                        </>
                                    ) : (
                                        'Update Product'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </dialog>
            }
        </>
    )
}

export default EditSubProduct;