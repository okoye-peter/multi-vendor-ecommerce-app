import React, { useState, useEffect } from "react";
import ImageUploading, { type ImageListType } from "react-images-uploading";
import { Upload, X, Check, Image as ImageIcon, RefreshCw, Trash2, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

export type UploadedImage = {
    file: File | null;
    dataURL: string | undefined;
    existingUrl?: string;
};

type Props = {
    onChange?: (images: UploadedImage[], defaultIndex: number | null) => void;
    initialImages?: { url: string; isDefault: boolean }[];
};

const MultiImageUploader: React.FC<Props> = ({ onChange, initialImages = [] }) => {
    const [images, setImages] = useState<ImageListType>([]);
    const [defaultIndex, setDefaultIndex] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const initialImagesKey = JSON.stringify(initialImages);
    
    useEffect(() => {
        if (initialImages.length > 0 && !isInitialized) {
            const convertedImages = initialImages.map(img => ({
                dataURL: img.url,
                file: undefined,
            }));
            
            setImages(convertedImages);
            
            const defaultIdx = initialImages.findIndex(img => img.isDefault);
            setDefaultIndex(defaultIdx >= 0 ? defaultIdx : null);

            if (onChange) {
                const mapped = convertedImages.map((img, idx) => ({
                    file: null,
                    dataURL: img.dataURL,
                    existingUrl: initialImages[idx].url,
                }));
                onChange(mapped, defaultIdx >= 0 ? defaultIdx : null);
            }

            setIsInitialized(true);
        }
    }, [initialImagesKey, isInitialized, onChange]); 

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

    const handleRemove = (index: number) => {
        const newImages = images.filter((_, idx) => idx !== index);
        onChangeImages(newImages);
    };

    const handleReplace = (index: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const newImages = [...images];
                    newImages[index] = {
                        dataURL: reader.result as string,
                        file: file,
                    };
                    onChangeImages(newImages);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    return (
        <ImageUploading
            multiple
            value={images}
            onChange={onChangeImages}
            maxNumber={8}
        >
            {({ imageList, onImageUpload, dragProps, isDragging }) => (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Product Assets</h4>
                            <p className="text-xs text-muted-foreground font-medium">Upload up to 8 high-resolution images. First image is featured.</p>
                        </div>
                        <Button 
                            type="button"
                            onClick={onImageUpload}
                            {...dragProps}
                            className={cn(
                                "h-12 rounded-2xl font-black gap-2 shadow-xl shadow-primary/20 hover-lift",
                                isDragging ? "bg-primary/90 scale-95" : ""
                            )}
                        >
                            <Upload className="h-4 w-4" />
                            {images.length > 0 ? 'Add More' : 'Upload Assets'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {imageList.map((image, index) => (
                            <Card key={index} className="group relative border-none bg-background shadow-xl shadow-black/[0.02] rounded-[2rem] overflow-hidden animate-scale-in">
                                <CardContent className="p-0">
                                    <div className="relative aspect-square overflow-hidden bg-muted/30">
                                        <img 
                                            src={image.dataURL} 
                                            alt={`Asset ${index + 1}`}
                                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" 
                                        />
                                        
                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            {defaultIndex === index && (
                                                <Badge className="bg-primary/90 backdrop-blur-md text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none">
                                                    Featured
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Quick Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-10 w-32 rounded-xl font-bold text-xs gap-2 bg-white/10 text-white border-white/20 hover:bg-white hover:text-foreground backdrop-blur-md"
                                                onClick={() => handleSetDefault(index)}
                                                disabled={defaultIndex === index}
                                            >
                                                <Star className={cn("h-3 w-3", defaultIndex === index && "fill-current")} />
                                                {defaultIndex === index ? 'Featured' : 'Set Featured'}
                                            </Button>
                                            
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl bg-white/10 text-white border-white/20 hover:bg-white hover:text-foreground backdrop-blur-md"
                                                    onClick={() => handleReplace(index)}
                                                >
                                                    <RefreshCw className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl bg-destructive/80 text-white border-none hover:bg-destructive shadow-lg"
                                                    onClick={() => handleRemove(index)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        
                        {images.length < 8 && (
                           <button
                                type="button"
                                onClick={onImageUpload}
                                className="aspect-square rounded-[2rem] border-4 border-dashed border-muted flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                           >
                                <Plus className="h-10 w-10" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Asset</span>
                           </button>
                        )}
                    </div>

                    {images.length === 0 && (
                        <div className="py-20 rounded-[3rem] border-4 border-dashed border-muted/50 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-20 w-20 rounded-[2.5rem] bg-muted/30 flex items-center justify-center text-muted-foreground">
                                <ImageIcon size={40} />
                            </div>
                            <div>
                                <h5 className="font-black text-xl tracking-tight">Gallery is empty</h5>
                                <p className="text-sm text-muted-foreground font-medium">Drag assets here or use the button above.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ImageUploading>
    );
};

export default MultiImageUploader;