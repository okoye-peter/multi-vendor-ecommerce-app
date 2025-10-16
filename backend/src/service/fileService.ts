// src/middleware/fileUpload.ts
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import type { Request, Response, NextFunction } from "express";

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

// Configure multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit (adjust as needed)
    },
    fileFilter: (req, file, cb) => {
        // Add allowed file types here
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
    /**
     * Upload a single file to specified folder
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
        const filename = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadDir, filename);

        await fs.writeFile(filePath, file.buffer);

        return path.posix.join("uploads", folderName, filename);
    }

    /**
     * Upload multiple files to specified folder
     * Returns uploaded paths and rollback function
     */
    static async uploadMultiple(
        files: Express.Multer.File[],
        folderName: string
    ): Promise<string[]> {
        if (!files || files.length === 0) {
            throw new Error("No files provided");
        }

        const uploadDir = path.resolve("public", "uploads", folderName);
        await fs.mkdir(uploadDir, { recursive: true });

        const uploadedPaths: string[] = [];

        try {
            for (const file of files) {
                if (!file.buffer) continue;

                const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
                const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeName}`;
                const filePath = path.join(uploadDir, filename);

                await fs.writeFile(filePath, file.buffer);
                uploadedPaths.push(path.posix.join("uploads", folderName, filename));
            }

            return uploadedPaths;
        } catch (error) {
            // Rollback: delete all uploaded files if any error occurs
            await this.deleteMultiple(uploadedPaths);
            throw error;
        }
    }

    /**
     * Delete a single file
     */
    static async deleteSingle(filePath: string): Promise<void> {
        try {
            const fullPath = path.resolve("public", filePath);
            await fs.unlink(fullPath);
        } catch (err: any) {
            if (err.code !== "ENOENT") {
                console.error(`Failed to delete file: ${filePath}`, err);
            }
        }
    }

    /**
     * Delete multiple files
     */
    static async deleteMultiple(filePaths: string[]): Promise<void> {
        const deletePromises = filePaths.map((filePath) =>
            this.deleteSingle(filePath).catch((err) => {
                console.error(`Failed to delete ${filePath}:`, err);
            })
        );
        await Promise.allSettled(deletePromises);
    }

    /**
     * Rollback uploaded files (cleanup helper)
     */
    static async rollback(filePaths: string | string[]): Promise<void> {
        const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
        await this.deleteMultiple(paths);
    }
}

// Middleware for single file upload
export const uploadSingleFile = (fieldName: string) => {
    return upload.single(fieldName);
};

// Middleware for multiple files upload (same field name)
export const uploadMultipleFiles = (fieldName: string, maxCount: number = 10) => {
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

// Middleware to handle multiple files upload and save to disk with rollback
export const handleMultipleFilesUpload = (folderName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return next();
            }

            const filePaths = await FileService.uploadMultiple(req.files, folderName);
            
            // Attach files info to request
            (req as any).uploadedFiles = req.files.map((file, index) => ({
                ...file,
                path: filePaths[index],
            }));

            // Store uploaded paths for potential rollback
            (req as any).uploadedFilePaths = filePaths;

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware to handle fields with multiple files with rollback
export const handleFieldsUpload = (folderName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const allUploadedPaths: string[] = [];

        try {
            if (!req.files || typeof req.files !== 'object') {
                return next();
            }

            const uploadedFields: Record<string, any> = {};

            for (const [fieldName, files] of Object.entries(req.files)) {
                if (Array.isArray(files)) {
                    try {
                        const filePaths = await FileService.uploadMultiple(files, folderName);
                        allUploadedPaths.push(...filePaths);
                        
                        uploadedFields[fieldName] = files.map((file, index) => ({
                            ...file,
                            path: filePaths[index],
                        }));
                    } catch (error) {
                        // Rollback all uploaded files if one field fails
                        await FileService.rollback(allUploadedPaths);
                        throw error;
                    }
                }
            }

            (req as any).uploadedFields = uploadedFields;
            (req as any).uploadedFilePaths = allUploadedPaths;
            
            next();
        } catch (error) {
            // Ensure rollback even if error occurs outside field loop
            await FileService.rollback(allUploadedPaths);
            next(error);
        }
    };
};

// Middleware to rollback uploaded files on error
export const rollbackOnError = () => {
    return async (err: any, req: Request, res: Response, next: NextFunction) => {
        // If there are uploaded files and an error occurred, delete them
        if (err && (req as any).uploadedFilePaths) {
            const paths = (req as any).uploadedFilePaths;
            await FileService.rollback(paths);
            console.log(`Rolled back ${paths.length} file(s) due to error`);
        }
        
        next(err);
    };
};

export default upload;