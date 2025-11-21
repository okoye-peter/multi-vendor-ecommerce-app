import React, { useEffect, useState } from 'react'
import { getProductForEdit, getUserVendors, updateProduct } from '../../../../libs/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import FullPageLoader from '../../../../components/FullPageLoader'
import type { Category, Department, Vendor } from '../../../../types/Index'
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Select from 'react-select';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import MultiImageUploader from '../../../../components/MultiImageUploader.tsx';
import { toast } from 'react-toastify'
import type { AxiosError } from 'axios'

type Props = {
    productId: number | null
    vendorId: number | null
    onProductUpdated: () => void
    categories: Category[]
    departments: Department[]
}

const productUpdateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().max(1000),
    price: z.coerce.number().nonnegative("Price must be non-negative"),
    categoryId: z.coerce.number().int().positive("Category ID must be a positive integer"),
    departmentId: z.coerce.number().int().positive("Department ID must be a positive integer"),
    vendorId: z.coerce.number().int().positive("Vendor ID must be a positive integer"),
    status: z.coerce.boolean().default(true),
    images: z.array(z.instanceof(File)).min(1, "At least one product image is required"),
    defaultImageIndex: z.number().int().min(0, "Default image index must be non-negative")
})
    .refine(
        (data) => data.defaultImageIndex < data.images.length,
        { message: "Default image index is out of range", path: ["defaultImageIndex"] }
    )
    .refine(
        (data) => data.images.length > 0 && data.defaultImageIndex !== null,
        { message: "Please select a default image", path: ["defaultImageIndex"] }
    );

export type ProductUpdateData = z.infer<typeof productUpdateSchema>;

const animatedComponents = makeAnimated();

const EditProduct = ({ productId, vendorId, onProductUpdated, categories, departments }: Props) => {
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

    const [images, setImages] = useState<File[]>([]);
    const [defaultImageIndex, setDefaultImageIndex] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<boolean | null>(true);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<number | null>(null);

    const { data: vendors, isLoading: vendorIsLoading, error } = useQuery({
        queryKey: ['getVendors'],
        queryFn: getUserVendors
    });

    const { data: product, isLoading } = useQuery({
        queryKey: [`vendorProductToEdit`, vendorId, productId],
        queryFn: () => getProductForEdit(vendorId!, productId!),
        enabled: !!vendorId && !!productId,
    })

    const {
        register,
        formState: { errors },
        handleSubmit,
        setError,
        setValue,
        control,
        trigger
    } = useForm({
        resolver: zodResolver(productUpdateSchema),
        defaultValues: {
            status: true,
            description: ""
        },
    })

    const { mutate: updateProductMutation, isPending } = useMutation({
        mutationFn: ({ vendorId, productId, formData }: { vendorId: number, productId: number, formData: FormData }) =>
            updateProduct(vendorId, productId, formData),
        onSuccess: () => {
            // ✅ Close modal on success
            const modal = document.getElementById('updateProductModal') as HTMLDialogElement;
            modal?.close();

            // Reset form
            setImages([]);
            setDefaultImageIndex(null);
            setSelectedStatus(true);
            setSelectedDepartment(null);
            setSelectedCategory(null);
            setSelectedVendor(null);

            // ✅ Notify parent component to reload
            onProductUpdated?.();

            // Optional: Show success toast
            toast.success('Product updated successfully!');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            console.error('Error updating product:', error);
            // Optional: Show error toast
            toast.error(error?.response?.data?.message || 'Failed to update product');
        }
    });


    // Sync images and defaultImageIndex with react-hook-form
    // useEffect(() => {
    //     setValue('images', images);
    //     if (images.length > 0) {
    //         // Clear any previous image errors when images are added
    //         trigger('images');
    //     }
    // }, [images, setValue, trigger]);

    // useEffect(() => {
    //     if (defaultImageIndex !== null) {
    //         setValue('defaultImageIndex', defaultImageIndex);
    //         // Clear any previous defaultImageIndex errors
    //         trigger('defaultImageIndex');
    //     }
    // }, [defaultImageIndex, setValue, trigger]);

    // ✅ NEW: Populate form when product data loads
    useEffect(() => {
        if (product) {
            // Set form values
            setValue('name', product.name);
            setValue('description', product.description || '');
            setValue('price', product.price);
            setValue('status', product.status);
            setValue('departmentId', product.departmentId);
            setValue('categoryId', product.categoryId);
            setValue('vendorId', product.vendorId);

            // Set select states
            setSelectedStatus(product.status);
            setSelectedDepartment(product.departmentId);
            setSelectedCategory(product.categoryId);
            setSelectedVendor(product.vendorId);

            // Handle existing images if your API returns them
            // You might need to convert existing image URLs to File objects
            // or handle them differently based on your backend structure
        }
    }, [product, setValue]);

    const onSubmit: SubmitHandler<ProductUpdateData> = async (formData: ProductUpdateData) => {
        // Only require new images if there are no existing images
        if (images.length === 0 && (!product?.images || product.images.length === 0)) {
            setError('images', { message: 'At least one product image is required' });
            return;
        }
        
        // Validate that images are uploaded
        if (images.length === 0) {
            setError('images', { message: 'At least one product image is required' });
            return;
        }

        if (defaultImageIndex === null) {
            setError('defaultImageIndex', { message: 'Please select a default image' });
            return;
        }

        // Validate vendorId is selected
        if (!formData.vendorId) {
            setError('vendorId', { message: 'Please select a vendor' });
            return;
        }

        // Create FormData for file upload
        const submitData = new FormData();

        // Append regular fields
        submitData.append('name', formData.name);
        submitData.append('description', formData.description);
        submitData.append('price', formData.price.toString());
        submitData.append('status', formData.status.toString());

        if (formData.categoryId) submitData.append('categoryId', formData.categoryId.toString());
        if (formData.departmentId) submitData.append('departmentId', formData.departmentId.toString());

        // Only append new images if there are any
        if (images.length > 0) {
            images.forEach((file) => {
                submitData.append('images[]', file);
            });
            submitData.append('defaultImageIndex', defaultImageIndex!.toString());
        }

        // Call mutation with vendorId and formData
        await updateProductMutation({
            vendorId: vendorId!,
            productId: productId!,
            formData: submitData
        });
        onProductUpdated?.()
    }


    return (
        <>
            {isLoading && <FullPageLoader />}

            {
                !vendorIsLoading &&
                Array.isArray(categories) &&
                Array.isArray(departments) &&

                <dialog id="updateProductModal" className="modal">
                    <div className="w-11/12 max-w-5xl modal-box">
                        <h3 className="text-lg font-bold">Create Product</h3>
                        <button
                            className="absolute btn btn-sm btn-circle btn-ghost right-2 top-2"
                            onClick={() => {
                                const modal = document.getElementById('updateProductModal') as HTMLDialogElement;
                                modal?.close();
                            }}
                        >
                            ✕
                        </button>
                        <div className="modal-action">
                            <form onSubmit={handleSubmit(onSubmit)} className='flex-1 overflow-hidden'>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            {...register('name')}
                                            className={`w-full input text-sm h-[38px] focus:outline-none focus:border-[#388bff] input-bordered ${errors.name ? 'input-error' : ''}`}
                                            placeholder="Enter product Name"
                                        />
                                        {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
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
                                            Price
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('price', { valueAsNumber: true })}
                                            className={`w-full input text-sm h-[38px] pl-6 focus:outline-none focus:border-[#388bff] input-bordered ${errors.price ? 'input-error' : ''}`}
                                            placeholder="product selling price"
                                        />
                                        <span className="absolute left-1.5 top-[35px] text-[17px] text-gray-600 ">₦</span>
                                        {errors.price && <p className="mt-1 text-xs text-error">{errors.price.message}</p>}
                                    </div>

                                    {/* Department Select */}
                                    <div className="form-control">
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            <span className="label-text">Department</span>
                                        </label>
                                        <Controller
                                            name="departmentId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select<Department, false>
                                                    closeMenuOnSelect
                                                    components={animatedComponents}
                                                    options={departments ?? []}
                                                    getOptionLabel={(option: Department) => option.name}
                                                    getOptionValue={(option: Department) => String(option.id)}
                                                    value={departments?.find(department => department.id === selectedDepartment) || null}
                                                    onChange={(val) => {
                                                        const deptId = val?.id || null;
                                                        setSelectedDepartment(deptId);
                                                        field.onChange(deptId);
                                                        setSelectedCategory(null);
                                                        setValue('categoryId', null);
                                                    }}
                                                    onBlur={field.onBlur}
                                                    isClearable
                                                    placeholder="Select product department..."
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
                                        {errors.departmentId && <p className="mt-1 text-xs text-error">{errors.departmentId.message}</p>}
                                    </div>

                                    {/* Category Select */}
                                    <div className="form-control">
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            <span className="label-text">Category</span>
                                        </label>
                                        <Controller
                                            name="categoryId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select<Category, false>
                                                    closeMenuOnSelect
                                                    components={animatedComponents}
                                                    options={categories.filter((cat) => selectedDepartment ? cat.departmentId === selectedDepartment : true) ?? []}
                                                    getOptionLabel={(option: Category) => option.name}
                                                    getOptionValue={(option: Category) => String(option.id)}
                                                    value={categories?.find(category => category.id === selectedCategory) || null}
                                                    onChange={(val) => {
                                                        const catId = val?.id || null;
                                                        setSelectedCategory(catId);
                                                        field.onChange(catId);
                                                    }}
                                                    onBlur={field.onBlur}
                                                    isClearable
                                                    placeholder="Select product category..."
                                                    isDisabled={!selectedDepartment}
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
                                        {errors.categoryId && <p className="mt-1 text-xs text-error">{errors.categoryId.message}</p>}
                                    </div>

                                    {/* Vendor Select */}
                                    <div className="form-control md:col-span-2">
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            <span className="label-text">Vendor</span>
                                        </label>
                                        <Controller
                                            name="vendorId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select<Vendor, false>
                                                    closeMenuOnSelect
                                                    components={animatedComponents}
                                                    options={vendors ?? []}
                                                    getOptionLabel={(option: Vendor) => option.name}
                                                    getOptionValue={(option: Vendor) => String(option.id)}
                                                    value={vendors?.find((vendor: Vendor) => vendor.id === selectedVendor) || null}
                                                    onChange={(val) => {
                                                        const vendorId = val?.id || null;
                                                        setSelectedVendor(vendorId);
                                                        field.onChange(vendorId);
                                                    }}
                                                    onBlur={field.onBlur}
                                                    isClearable
                                                    placeholder="Select product vendor..."
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
                                        {errors.vendorId && <p className="mt-1 text-xs text-error">{errors.vendorId.message}</p>}
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            Description
                                        </label>
                                        <textarea
                                            {...register('description')}
                                            className={`w-full textarea text-sm py-2 min-h-[80px] resize-none focus:outline-none focus:border-[#388bff] textarea-bordered ${errors.description ? 'textarea-error' : ''}`}
                                            placeholder="Product Description" maxLength={1000}
                                        ></textarea>
                                        {errors.description && <p className="mt-1 text-xs text-error">{errors.description.message}</p>}
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className="block mb-2 text-sm font-medium label-text">
                                            Product Images <span className="text-error">*</span>
                                        </label>
                                        <MultiImageUploader
                                            initialImages={product?.images?.map((img: {url:string, default: boolean}) => ({
                                                url: img.url,
                                                isDefault: img.default
                                            })) || []}
                                            onChange={(imgs, defaultIdx) => {
                                                const files = imgs.map(i => i.file!).filter(Boolean);
                                                setImages(files);
                                                setDefaultImageIndex(defaultIdx);
                                            }}
                                        />
                                        {errors.images && <p className="mt-1 text-xs text-error">{errors.images.message}</p>}
                                        {errors.defaultImageIndex && <p className="mt-1 text-xs text-error">{errors.defaultImageIndex.message}</p>}
                                        {images.length > 0 && defaultImageIndex !== null && (
                                            <p className="mt-2 text-xs text-success">
                                                ✓ {images.length} image(s) uploaded, default: Image {defaultImageIndex + 1}
                                            </p>
                                        )}
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

export default EditProduct

function makeAnimated() {
    throw new Error('Function not implemented.')
}
