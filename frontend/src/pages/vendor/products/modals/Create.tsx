import type { Category, Department, Vendor } from '../../../../types/Index.ts';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserVendors, createProduct } from '../../../../libs/api.ts';
import PageLoader from '../../../../components/PageLoader.tsx';
import { useState, useEffect } from 'react';
import MultiImageUploader from '../../../../components/MultiImageUploader.tsx';
import type { AxiosError } from 'axios';
import { toast } from 'react-toastify';

type Props = {
    categories: Category[];
    departments: Department[];
    onProductCreated?: () => void;
};

const createProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().max(1000).default(""),
    price: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? undefined : Number(val),
        z.number().nonnegative("Price must be non-negative")
    ),
    categoryId: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? null : Number(val),
        z.number().int().positive("Category ID must be a positive integer").nullable()
    ),
    departmentId: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? null : Number(val),
        z.number().int().positive("Department ID must be a positive integer").nullable()
    ),
    vendorId: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? null : Number(val),
        z.number().int().positive("Vendor ID must be a positive integer").nullable()
    ),
    quantity: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? 0 : Number(val),
        z.number().int().min(0).default(0)
    ),
    expiry_date: z.preprocess(
        (val) => {
            if (!val || val === "") return null;
            const date = new Date(val as string);
            return isNaN(date.getTime()) ? null : date;
        },
        z.date().nullable().optional()
    ),
    cost_price: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? null : Number(val),
        z.number().nonnegative("Cost Price must be non-negative").nullable().optional()
    ),
    status: z.boolean().default(true),
    images: z.array(z.instanceof(File)).min(1, "At least one product image is required")
    .refine(
        files => files.every(file => file.type.startsWith("image/")),
        { message: "Only image files are allowed" }
    ),
    defaultImageIndex: z.number().int().min(0, "Default image index must be non-negative")
}).refine(
    (data) => data.quantity <= 0 || (data.cost_price !== null && data.cost_price !== undefined),
    { message: "Cost price is required when quantity is greater than 0", path: ["cost_price"] }
)
    .refine(
        (data) => data.defaultImageIndex < data.images.length,
        { message: "Default image index is out of range", path: ["defaultImageIndex"] }
    )
    .refine(
        (data) => data.images.length > 0 && data.defaultImageIndex !== null,
        { message: "Please select a default image", path: ["defaultImageIndex"] }
    );

export type ProductData = z.infer<typeof createProductSchema>;

const animatedComponents = makeAnimated();

const Create = ({ categories, departments, onProductCreated }: Props) => {
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
    const [imageUploaderKey, setImageUploaderKey] = useState(0); // Add key to force reset

    const { data: vendors, isLoading: vendorIsLoading, error } = useQuery({
        queryKey: ['getVendors'],
        queryFn: getUserVendors
    });

    const [selectedStatus, setSelectedStatus] = useState<boolean | null>(true);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<number | null>(null);

    const {
        register,
        formState: { errors },
        handleSubmit,
        setError,
        setValue,
        control,
        trigger,
        reset
    } = useForm({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            name: "",
            description: "",
            price: undefined,
            categoryId: null,
            departmentId: null,
            vendorId: null,
            quantity: 0,
            expiry_date: null,
            cost_price: null,
            status: true,
            images: [],
            defaultImageIndex: 0
        },
    })

    const { mutate: saveProduct, isPending } = useMutation({
        mutationFn: ({ vendorId, formData }: { vendorId: number, formData: FormData }) =>
            createProduct(vendorId, formData),
        onSuccess: () => {
            // ✅ Reset react-hook-form
            reset();

            // ✅ Reset all state variables
            setImages([]);
            setDefaultImageIndex(null);
            setSelectedStatus(true);
            setSelectedDepartment(null);
            setSelectedCategory(null);
            setSelectedVendor(null);
            
            // ✅ Force MultiImageUploader to reset by changing key
            setImageUploaderKey(prev => prev + 1);

            // ✅ Close modal
            const modal = document.getElementById('createProductModal') as HTMLDialogElement;
            modal?.close();

            // ✅ Notify parent component to reload
            onProductCreated?.();

            // ✅ Show success toast
            toast.success('Product created successfully!');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            console.error('Error creating product:', error);
            toast.error(error?.response?.data?.message || 'Failed to create product');
        }
    });

    // Sync images and defaultImageIndex with react-hook-form
    useEffect(() => {
        setValue('images', images);
        if (images.length > 0) {
            trigger('images');
        }
    }, [images, setValue, trigger]);

    useEffect(() => {
        if (defaultImageIndex !== null) {
            setValue('defaultImageIndex', defaultImageIndex);
            trigger('defaultImageIndex');
        }
    }, [defaultImageIndex, setValue, trigger]);


    const onSubmit: SubmitHandler<ProductData> = async (formData: ProductData) => {
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
        submitData.append('quantity', formData.quantity.toString());
        submitData.append('status', formData.status.toString());

        if (formData.categoryId) submitData.append('categoryId', formData.categoryId.toString());
        if (formData.departmentId) submitData.append('departmentId', formData.departmentId.toString());
        if (formData.cost_price) submitData.append('cost_price', formData.cost_price.toString());
        if (formData.expiry_date) submitData.append('expiry_date', formData.expiry_date.toISOString());

        // Append images
        images.forEach((file) => {
            submitData.append('images[]', file);
        });

        // Append default image index
        submitData.append('defaultImageIndex', defaultImageIndex.toString());

        // Call mutation with vendorId and formData
        saveProduct({
            vendorId: formData.vendorId,
            formData: submitData
        });
    }

    return (
        <>
            {(vendorIsLoading || isPending) && <PageLoader />}

            {!vendorIsLoading && error && <div>{error?.message}</div>}

            {
                !vendorIsLoading &&
                Array.isArray(categories) &&
                Array.isArray(departments) &&

                <dialog id="createProductModal" className="modal">
                    <div className="w-11/12 max-w-5xl modal-box">
                        <h3 className="text-lg font-bold">Create Product</h3>
                        <button
                            className="absolute btn btn-sm btn-circle btn-ghost right-2 top-2"
                            onClick={() => {
                                const modal = document.getElementById('createProductModal') as HTMLDialogElement;
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
                                                    onChange={(val: { name: string, value: boolean }) => {
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
                                                        option: (state: {isSelected: boolean, isFocused: boolean }) =>
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
                                            className={`w-full input text-sm h-[38px] pl-6 focus:outline-none bg-transparent focus:border-[#388bff] input-bordered ${errors.price ? 'input-error' : ''}`}
                                            placeholder="product selling price"
                                        />
                                        <span className="absolute left-1.5 top-[35px] text-[17px] text-gray-600">₦</span>
                                        {errors.price && <p className="mt-1 text-xs text-error">{errors.price.message}</p>}
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
                                                    onChange={(val: Department) => {
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
                                                        option: (state: { isSelected: boolean, isFocused: boolean }) =>
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
                                                    onChange={(val: Category) => {
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
                                                        option: (state: { isSelected: boolean, isFocused: boolean }) =>
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
                                                    onChange={(val: Vendor) => {
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
                                                        option: (state: { isSelected: boolean, isFocused: boolean }) =>
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
                                            key={imageUploaderKey}
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
                                            Creating Product...
                                        </>
                                    ) : (
                                        'Create Product'
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

export default Create