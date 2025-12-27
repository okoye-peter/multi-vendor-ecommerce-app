import React, { useState } from 'react'
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import axiosInstance from '../../../../libs/axios';
import { toast } from 'react-toastify';

const dateFilterSchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable()
}).refine(
        (data) => {
            // Skip validation if no images provided (optional update)
            if (data.startDate && data.endDate) {
                const startDate = new Date(data.startDate);
                const endDate = new Date(data.endDate);
                return startDate.getTime() <= endDate.getTime();
            }
            return true
        },
        {
            message: "start date can not be greater than end date",
            path: ["startDate"]
        }
    );

export type DateFilterData = z.infer<typeof dateFilterSchema>;

const SaleReportDateFilter = ({ vendorId, productId }: {vendorId: number, productId: number}) => {
    const [isPending, setIsPending] = useState(false)

    const downloadReport: SubmitHandler<DateFilterData> = async (formData: DateFilterData) => {
        setIsPending(true);
        try {
            const res = await axiosInstance.get(`vendors/${vendorId}/products/${productId}/sales_report?startDate=${formData.startDate}&endDate=${formData.endDate}`);
            toast.success(res.data.message)
            const modal = document.getElementById('reportDateFilterModal') as HTMLDialogElement;
            modal?.close();
        } catch (error) {
            console.log('error', error)
            toast.error('something went wrong!')
        } finally {
            setIsPending(false)
        }
    }

    const {
            register,
            formState: { errors },
            handleSubmit,
        } = useForm({
            resolver: zodResolver(dateFilterSchema)
        })


    return (
        <>
            <dialog id="reportDateFilterModal" className="modal">
                <div className="w-1/3 max-w-5xl modal-box">
                    <h3 className="text-lg font-bold">Create Product</h3>
                    <button
                        className="absolute btn btn-sm btn-circle btn-ghost right-2 top-2"
                        onClick={() => {
                            const modal = document.getElementById('reportDateFilterModal') as HTMLDialogElement;
                            modal?.close();
                        }}
                    >
                        ✕
                    </button>
                    <div className="modal-action">
                        <form onSubmit={handleSubmit(downloadReport)} className='flex-1 overflow-hidden'>
                            <div className="grid grid-cols-1 gap-4">
                                <div className='relative'>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        {...register('startDate')}
                                        className={`w-full input text-sm h-[38px] focus:outline-none focus:border-[#388bff] input-bordered ${errors.startDate ? 'input-error' : ''}`}
                                    />
                                    {errors.startDate && <p className="mt-1 text-xs text-error">{errors.startDate.message}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className='relative'>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        {...register('endDate')}
                                        className={`w-full input text-sm h-[38px] focus:outline-none focus:border-[#388bff] input-bordered ${errors.endDate ? 'input-error' : ''}`}
                                    />
                                    {errors.endDate && <p className="mt-1 text-xs text-error">{errors.endDate.message}</p>}
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
                                            Download
                                        </>
                                    ) : (
                                        'Update Product'
                                    )}
                                </button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default SaleReportDateFilter