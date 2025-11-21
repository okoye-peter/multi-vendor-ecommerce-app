import React, { useState, useEffect } from "react";
import ImageUploading, { type ImageListType } from "react-images-uploading";

export type UploadedImage = {
    file: File | null;
    dataURL: string | undefined;
    existingUrl?: string; // ✅ Add this for existing images
};

type Props = {
    onChange?: (images: UploadedImage[], defaultIndex: number | null) => void;
    initialImages?: { url: string; isDefault: boolean }[]; // ✅ Add this prop
};

const MultiImageUploader: React.FC<Props> = ({ onChange, initialImages = [] }) => {
    const [images, setImages] = useState<ImageListType>([]);
    const [defaultIndex, setDefaultIndex] = useState<number | null>(null);

    // ✅ Load initial images when component mounts or initialImages change
    useEffect(() => {
        if (initialImages.length > 0) {
            const convertedImages = initialImages.map(img => ({
                dataURL: `${import.meta.env.VITE_API_BASE_URL || ''}/${img.url}`, // Adjust base URL as needed
                file: undefined,
            }));
            
            setImages(convertedImages);
            
            // Set default index
            const defaultIdx = initialImages.findIndex(img => img.isDefault);
            setDefaultIndex(defaultIdx >= 0 ? defaultIdx : null);

            // Notify parent
            if (onChange) {
                const mapped = convertedImages.map((img, idx) => ({
                    file: null,
                    dataURL: img.dataURL,
                    existingUrl: initialImages[idx].url,
                }));
                onChange(mapped, defaultIdx >= 0 ? defaultIdx : null);
            }
        }
    }, [initialImages]);

    const onChangeImages = (imageList: ImageListType) => {
        setImages(imageList);

        let newDefaultIndex = defaultIndex;
        if (imageList.length === 0) {
            newDefaultIndex = null;
        } else if (defaultIndex !== null && defaultIndex >= imageList.length) {
            newDefaultIndex = null;
        }

        if (newDefaultIndex !== defaultIndex) {
            setDefaultIndex(newDefaultIndex);
        }

        if (onChange) {
            const mapped = imageList.map((img, idx) => ({
                file: img.file ?? null,
                dataURL: img.dataURL,
                // Preserve existing URL if this was an initial image that wasn't replaced
                existingUrl: initialImages[idx]?.url && !img.file ? initialImages[idx].url : undefined,
            }));

            onChange(mapped, newDefaultIndex);
        }
    };

    const handleSetDefault = (index: number) => {
        setDefaultIndex(index);

        if (onChange) {
            const mapped = images.map((img, idx) => ({
                file: img.file ?? null,
                dataURL: img.dataURL,
                existingUrl: initialImages[idx]?.url && !img.file ? initialImages[idx].url : undefined,
            }));

            onChange(mapped, index);
        }
    };

    return (
        <ImageUploading
            multiple
            value={images}
            onChange={onChangeImages}
            maxNumber={8}
        >
            {({ imageList, onImageUpload }) => (
                <div className="space-y-4">
                    <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={onImageUpload}
                    >
                        {images.length > 0 ? 'Add More Images' : 'Upload Images'}
                    </button>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {imageList.map((image, index) => (
                            <div key={index} className="relative shadow-xl card bg-base-200">
                                {defaultIndex === index && (
                                    <div className="absolute badge badge-primary top-2 left-2">
                                        Default
                                    </div>
                                )}

                                <figure>
                                    <img 
                                        src={image.dataURL} 
                                        alt={`Upload ${index + 1}`}
                                        className="object-cover w-full h-36" 
                                    />
                                </figure>

                                <div className="p-2 space-y-2">
                                    <button
                                        type="button"
                                        className="w-full btn btn-xs btn-info"
                                        onClick={image.onUpdate}
                                    >
                                        Replace
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full btn btn-xs btn-success"
                                        onClick={() => handleSetDefault(index)}
                                        disabled={defaultIndex === index}
                                    >
                                        {defaultIndex === index ? 'Is Default' : 'Set Default'}
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full btn btn-xs btn-error"
                                        onClick={image.onRemove}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {images.length === 0 && (
                        <p className="text-sm italic text-gray-500">No images uploaded yet.</p>
                    )}
                </div>
            )}
        </ImageUploading>
    );
};

export default MultiImageUploader;