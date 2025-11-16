import React, { useState } from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";

export type UploadedImage = {
    file: File | null;
    dataURL: string | undefined;
};

type Props = {
    onChange?: (images: UploadedImage[], defaultIndex: number | null) => void;
};

const MultiImageUploader: React.FC<Props> = ({ onChange }) => {
    const [images, setImages] = useState<ImageListType>([]);
    const [defaultIndex, setDefaultIndex] = useState<number | null>(null);

    const onChangeImages = (imageList: ImageListType) => {
        setImages(imageList);

        // Reset default if it was removed or if no images
        let newDefaultIndex = defaultIndex;
        if (imageList.length === 0) {
            newDefaultIndex = null;
        } else if (defaultIndex !== null && defaultIndex >= imageList.length) {
            newDefaultIndex = null;
        }

        // Update default index state if changed
        if (newDefaultIndex !== defaultIndex) {
            setDefaultIndex(newDefaultIndex);
        }

        // Send data to parent component
        if (onChange) {
            const mapped = imageList.map(img => ({
                file: img.file ?? null,
                dataURL: img.dataURL,
            }));

            onChange(mapped, newDefaultIndex);
        }
    };

    const handleSetDefault = (index: number) => {
        setDefaultIndex(index);

        // Notify parent immediately with updated default
        if (onChange) {
            const mapped = images.map(img => ({
                file: img.file ?? null,
                dataURL: img.dataURL,
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
                    {/* Upload Button */}
                    <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={onImageUpload}
                    >
                        Upload Images
                    </button>

                    {/* Image Grid */}
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