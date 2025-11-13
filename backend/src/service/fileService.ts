// src/middleware/fileUpload.ts
import multer from "multer";
import sharp from "sharp";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
}

export interface ProductImage {
    url: string; // Single URL to use in frontend (e.g., "uploads/products/image.webp")
    availableSizes: string[]; // ["thumb", "small", "medium", "large", "xlarge", "original"]
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer to use memory storage
const storage = multer.memoryStorage();

interface ImageSize {
    suffix: string;
    width: number;
    height?: number;
    quality?: number;
}

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp",
            "image/gif",
            "application/pdf",
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
    },
});

export class FileService {
    // Define your image sizes for different screen sizes with high quality
    private static readonly IMAGE_SIZES: ImageSize[] = [
        { suffix: "thumb", width: 150, height: 150, quality: 90 }, // Thumbnails
        { suffix: "small", width: 320, quality: 92 }, // Mobile
        { suffix: "medium", width: 640, quality: 92 }, // Tablet
        { suffix: "large", width: 1024, quality: 95 }, // Desktop
        { suffix: "xlarge", width: 1920, quality: 95 }, // Large displays
    ];

    /**
     * Upload a single file to specified folder - saves only ONE file
     * Returns simple path string
     */
    static async uploadSingle(
        file: Express.Multer.File,
        folderName: string
    ): Promise<string> {
        if (!file || !file.buffer) {
            throw new Error("No file provided or file buffer missing");
        }

        const uploadDir = path.resolve("public", "uploads", folderName);
        await fs.mkdir(uploadDir, { recursive: true });

        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const nameWithoutExt = path.parse(safeName).name;
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);

        // Check if file is an image
        const isImage = file.mimetype.startsWith("image/");

        // Always save as .webp for images
        const filename = isImage
            ? `${timestamp}-${randomStr}-${nameWithoutExt}.webp`
            : `${timestamp}-${randomStr}-${safeName}`;

        const filePath = path.join(uploadDir, filename);

        if (isImage) {
            // Convert and optimize to WebP with high quality
            await sharp(file.buffer)
                .webp({ quality: 98, effort: 6 })
                .toFile(filePath);
        } else {
            // For non-images, save as-is
            await fs.writeFile(filePath, file.buffer);
        }

        return path.posix.join("uploads", folderName, filename);
    }

    /**
     * Upload multiple files with responsive image sizes
     * Returns array with single URL per image that supports ?size= query parameter
     */
    static async uploadMultiple(
        files: Express.Multer.File[],
        folderName: string,
        generateSizes: boolean = true
    ): Promise<ProductImage[]> {
        if (!files || files.length === 0) {
            throw new Error("No files provided");
        }

        const uploadDir = path.resolve("public", "uploads", folderName);
        await fs.mkdir(uploadDir, { recursive: true });

        const uploadedFiles: ProductImage[] = [];
        const allGeneratedPaths: string[] = [];

        try {
            for (const file of files) {
                if (!file.buffer) continue;

                // Check if file is an image
                const isImage = file.mimetype.startsWith("image/");

                const safeName = file.originalname.replace(
                    /[^a-zA-Z0-9.\-_]/g,
                    "_"
                );
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(7);
                const nameWithoutExt = path.parse(safeName).name;

                // Base filename without size suffix
                const baseFilename = `${timestamp}-${randomStr}-${nameWithoutExt}`;

                // Save original with -original suffix
                const originalFilename = `${baseFilename}-original.webp`;
                const originalPath = path.join(uploadDir, originalFilename);

                if (isImage) {
                    // Convert and optimize original image to WebP with highest quality
                    await sharp(file.buffer)
                        .webp({ quality: 98, effort: 6 })
                        .toFile(originalPath);
                } else {
                    // For non-images (like PDFs), save as-is
                    await fs.writeFile(originalPath, file.buffer);
                }

                const originalRelativePath = path.posix.join(
                    "uploads",
                    folderName,
                    originalFilename
                );
                allGeneratedPaths.push(originalRelativePath);

                const availableSizes: string[] = ["original"];

                // Generate different sizes only for images
                if (isImage && generateSizes) {
                    for (const size of this.IMAGE_SIZES) {
                        const sizedFilename = `${baseFilename}-${size.suffix}.webp`;
                        const sizedPath = path.join(uploadDir, sizedFilename);
                        const sizedRelativePath = path.posix.join(
                            "uploads",
                            folderName,
                            sizedFilename
                        );

                        // Process image with sharp
                        let sharpInstance = sharp(file.buffer);

                        // Resize with options
                        if (size.height) {
                            // Fixed dimensions (for thumbnails) with sharp, clear resizing
                            sharpInstance = sharpInstance.resize(size.width, size.height, {
                                fit: "cover",
                                position: "center",
                                kernel: "lanczos3",
                            });
                        } else {
                            // Maintain aspect ratio with high-quality resampling
                            sharpInstance = sharpInstance.resize(size.width, null, {
                                fit: "inside",
                                withoutEnlargement: true,
                                kernel: "lanczos3",
                            });
                        }

                        // Convert to WebP with high quality and sharpening
                        await sharpInstance
                            .sharpen()
                            .webp({
                                quality: size.quality || 92,
                                effort: 6,
                            })
                            .toFile(sizedPath);

                        allGeneratedPaths.push(sizedRelativePath);
                        availableSizes.push(size.suffix);
                    }
                }

                // Return base URL without size suffix - frontend adds ?size=large
                const baseUrl = path.posix.join(
                    "uploads",
                    folderName,
                    `${baseFilename}.webp`
                );

                uploadedFiles.push({
                    url: baseUrl,
                    availableSizes,
                });
            }

            return uploadedFiles;
        } catch (error) {
            // Rollback: delete all uploaded files if any error occurs
            await this.deleteMultiple(allGeneratedPaths);
            throw error;
        }
    }

    /**
     * Delete a single file
     */
    static async deleteSingle(filePath: string): Promise<void> {
        try {
            // Ensure correct absolute path
            const fullPath = path.join(__dirname, "../../public", filePath);
            await fs.unlink(fullPath);
            console.log(`Deleted file: ${fullPath}`);
        } catch (err: any) {
            if (err.code === "ENOENT") {
                console.warn(`File not found: ${filePath}`);
            } else {
                console.error(`Failed to delete file: ${filePath}`, err);
            }
        }
    }
    
    /**
     * Delete multiple files
     */
    static async deleteMultiple(fileUrls: string[]): Promise<void> {
        const allDeletePromises: Promise<void>[] = [];

        // Define sizes as literal union so TypeScript is happy
        const sizes: ("thumb" | "small" | "medium" | "large" | "xlarge" | "original")[] = [
            'thumb', 'small', 'medium', 'large', 'xlarge', 'original'
        ];

        for (const fileUrl of fileUrls) {
            // 1️⃣ Delete the base file URL itself
            const baseFilePath = path.join(__dirname, "../../public", fileUrl);
            allDeletePromises.push(
                this.deleteSingle(baseFilePath).catch(err => {
                    console.error(`Failed to delete base file: ${baseFilePath}`, err);
                })
            );

            // 2️⃣ Delete all size variants
            for (const size of sizes) {
                const variantPath = FileService.getImagePath(fileUrl, size)

                allDeletePromises.push(
                    this.deleteSingle(variantPath).catch(err => {
                        console.error(`Failed to delete variant: ${variantPath}`, err);
                    })
                );
            }
        }

        // Wait for all deletion attempts
        await Promise.allSettled(allDeletePromises);
    }

    /**
     * Delete a product image and all its sizes
     * Extracts base filename and deletes all size variants
     */
    static async deleteProductImage(productImage: ProductImage): Promise<void> {
        const parsed = path.parse(productImage.url);
        const baseFilename = parsed.name; // e.g., "1234567890-abc123-image"
        const dir = parsed.dir;

        const pathsToDelete: string[] = [];

        // Delete all size variants
        for (const size of productImage.availableSizes) {
            const sizedPath = path.posix.join(dir, `${baseFilename}-${size}.webp`);
            pathsToDelete.push(sizedPath);
        }

        await this.deleteMultiple(pathsToDelete);
    }

    /**
     * Delete multiple product images with all their sizes
     */
    static async deleteProductImages(productImages: ProductImage[]): Promise<void> {
        for (const image of productImages) {
            await this.deleteProductImage(image);
        }
    }

    /**
     * Rollback uploaded files (cleanup helper)
     */
    static async rollback(
        filePaths: string | string[] | ProductImage[]
    ): Promise<void> {
        if (Array.isArray(filePaths) && filePaths.length > 0) {
            // Check if it's ProductImage array
            if (typeof filePaths[0] === "object" && "url" in filePaths[0]) {
                await this.deleteProductImages(filePaths as ProductImage[]);
            } else {
                await this.deleteMultiple(filePaths as string[]);
            }
        } else if (typeof filePaths === "string") {
            await this.deleteSingle(filePaths);
        }
    }

    /**
     * Get the actual file path for a specific size
     * Used by middleware to serve the correct image
     */
    static getImagePath(
        baseUrl: string,
        size?: "thumb" | "small" | "medium" | "large" | "xlarge" | "original"
    ): string {
        if (!size || size === "original") {
            // Replace .webp with -original.webp
            return baseUrl.replace(/\.webp$/, "-original.webp");
        }

        // Replace .webp with -size.webp
        return baseUrl.replace(/\.webp$/, `-${size}.webp`);
    }
}

// Middleware for single file upload
export const uploadSingleFile = (fieldName: string) => {
    return upload.single(fieldName);
};

// Middleware for multiple files upload (same field name)
export const uploadMultipleFiles = (
    fieldName: string,
    maxCount: number = 10
) => {
    return upload.array(fieldName, maxCount);
};

// Middleware for multiple files with different field names
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
    return upload.fields(fields);
};

// Middleware to handle file upload and save to disk with rollback
export const handleSingleFileUpload = (folderName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                return next();
            }

            const filePath = await FileService.uploadSingle(req.file, folderName);

            // Attach file info to request for use in controllers
            (req as any).uploadedFile = {
                ...req.file,
                path: filePath,
            };

            // Store uploaded path for potential rollback
            (req as any).uploadedFilePaths = [filePath];

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware to handle multiple files upload with responsive sizes
export const handleMultipleFilesUpload = (
    folderName: string,
    generateSizes: boolean = true
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (
                !req.files ||
                !Array.isArray(req.files) ||
                req.files.length === 0
            ) {
                return next();
            }

            const productImages = await FileService.uploadMultiple(
                req.files,
                folderName,
                generateSizes
            );

            // Attach files info to request
            (req as any).uploadedFiles = productImages;

            // Store for potential rollback
            (req as any).uploadedProductImages = productImages;

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware to handle fields with multiple files with rollback
export const handleFieldsUpload = (
    folderName: string,
    generateSizes: boolean = true
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const allUploadedImages: ProductImage[] = [];

        try {
            if (!req.files || typeof req.files !== "object") {
                return next();
            }

            const uploadedFields: Record<string, ProductImage[]> = {};

            for (const [fieldName, files] of Object.entries(req.files)) {
                if (Array.isArray(files)) {
                    try {
                        const productImages = await FileService.uploadMultiple(
                            files,
                            folderName,
                            generateSizes
                        );
                        allUploadedImages.push(...productImages);

                        uploadedFields[fieldName] = productImages;
                    } catch (error) {
                        // Rollback all uploaded files if one field fails
                        await FileService.rollback(allUploadedImages);
                        throw error;
                    }
                }
            }

            (req as any).uploadedFields = uploadedFields;
            (req as any).uploadedProductImages = allUploadedImages;

            next();
        } catch (error) {
            // Ensure rollback even if error occurs outside field loop
            await FileService.rollback(allUploadedImages);
            next(error);
        }
    };
};

// Middleware to rollback uploaded files on error
export const rollbackOnError = () => {
    return async (
        err: any,
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        // If there are uploaded product images and an error occurred, delete them
        if (err && (req as any).uploadedProductImages) {
            const images = (req as any).uploadedProductImages;
            await FileService.rollback(images);
            console.log(
                `Rolled back ${images.length} product image(s) with all sizes due to error`
            );
        }
        // Fallback to old path-based rollback
        else if (err && (req as any).uploadedFilePaths) {
            const paths = (req as any).uploadedFilePaths;
            await FileService.rollback(paths);
            console.log(`Rolled back ${paths.length} file(s) due to error`);
        }

        next(err);
    };
};

/**
 * Middleware to serve images with size parameter support
 * Usage: app.use('/uploads', serveResponsiveImages(), express.static('public/uploads'))
 */
export const serveResponsiveImages = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const size = req.query.size as string | undefined;
        const validSizes = ["thumb", "small", "medium", "large", "xlarge", "original"];

        // Only process .webp files
        if (req.path.endsWith(".webp")) {
            let newPath: string;

            if (size && validSizes.includes(size)) {
                newPath = req.path.replace(/\.webp$/, `-${size}.webp`);
            } else {
                // If no size or invalid size, use original
                newPath = req.path.replace(/\.webp$/, `-original.webp`);
            }

            // ✅ Fixed relative path (go up two directories from /src/service/)
            const absolutePath = path.join(__dirname, "../../public/uploads/", newPath);

            if (await fsSync.existsSync(absolutePath)) {
                req.url = newPath;
                console.log("✅ Serving image:", newPath);
            } else {
                const fallbackPath = req.path.replace(/\.webp$/, `-original.webp`);
                req.url = fallbackPath;
                console.log("⚠️  Not found, falling back to:", fallbackPath);
            }
        }

        next();
    };
};

export default upload;