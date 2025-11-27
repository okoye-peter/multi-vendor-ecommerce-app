import multer, { type FileFilterCallback } from "multer";
import sharp from "sharp";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

/* ===========================
   CLOUDINARY CONFIG
=========================== */

const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env variables are missing");
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

/* ===========================
   REQUEST TYPES (URL + FILE)
=========================== */

export interface RequestWithUploadedFile extends Request {
    cloudinaryUpload?: {
        url: string;
        file: Express.Multer.File;
    };
    uploadedFilePaths?: string[]; // rollback support
}

export interface RequestWithUploadedFiles extends Request {
    cloudinaryUploads?: {
        urls: string[];
        files: Express.Multer.File[];
    };
}

export interface RequestWithUploadedFields extends Request {
    cloudinaryFieldUploads?: Record<string, {
        urls: string[];
        files: Express.Multer.File[];
    }>;
}

export type UploadRequest =
    | RequestWithUploadedFile
    | RequestWithUploadedFiles
    | RequestWithUploadedFields;

/* ===========================
   MULTER CONFIG
=========================== */

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowedTypes: string[] = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp",
            "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
        ];

        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error(`Invalid file type: ${file.mimetype}`));
    },
});

/* ===========================
   FILE SERVICE (URL ONLY)
=========================== */

export class FileService {
    /* ---------- Upload Helper ---------- */

    private static uploadToCloudinary(
        buffer: Buffer,
        folder: string,
        publicId: string,
        mimetype: string
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const isImage = mimetype.startsWith("image/");

            const uploadOptions: Record<string, any> = {
                folder,
                public_id: publicId,
                resource_type: isImage ? "image" : "raw",
            };

            if (isImage) {
                uploadOptions.format = "webp";
                uploadOptions.quality = "auto:best";
            }

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) reject(error);
                    else if (result) resolve(result);
                    else reject(new Error("Upload failed"));
                }
            );

            Readable.from(buffer).pipe(uploadStream);
        });
    }

    /* ---------- URL → publicId ---------- */

    private static extractPublicIdFromUrl(url: string): {
        publicId: string;
        resourceType: "image" | "raw";
    } {
        const resourceType = url.includes("/image/upload/") ? "image" : "raw";

        const parts = url.split("/upload/");
        if (!parts[1]) throw new Error("Invalid Cloudinary URL");

        const withoutVersion = parts[1].replace(/^v\d+\//, "");
        const publicId = withoutVersion.replace(/\.[^/.]+$/, "");

        return { publicId, resourceType };
    }

    /* ---------- Upload Single ---------- */

    static async uploadSingle(
        file: Express.Multer.File,
        folderName: string
    ): Promise<string> {
        if (!file?.buffer) throw new Error("No file provided");

        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const nameWithoutExt = path.parse(safeName).name;

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const publicId = `${timestamp}-${randomStr}-${nameWithoutExt}`;

        const isImage = file.mimetype.startsWith("image/");
        let processedBuffer = file.buffer;

        if (isImage) {
            try {
                processedBuffer = await sharp(file.buffer)
                    .webp({ quality: 98, effort: 6 })
                    .toBuffer();
            } catch {
                processedBuffer = file.buffer;
            }
        }

        const result = await this.uploadToCloudinary(
            processedBuffer,
            folderName,
            publicId,
            file.mimetype
        );

        return result.secure_url;
    }

    /* ---------- Upload Multiple ---------- */

    static async uploadMultiple(
        files: Express.Multer.File[],
        folderName: string
    ): Promise<string[]> {
        if (!files?.length) throw new Error("No files provided");

        const uploadedUrls: string[] = [];

        try {
            for (const file of files) {
                if (!file.buffer) continue;

                const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
                const nameWithoutExt = path.parse(safeName).name;

                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(7);
                const publicId = `${timestamp}-${randomStr}-${nameWithoutExt}`;

                const isImage = file.mimetype.startsWith("image/");
                let processedBuffer = file.buffer;

                if (isImage) {
                    try {
                        processedBuffer = await sharp(file.buffer)
                            .webp({ quality: 98, effort: 6 })
                            .toBuffer();
                    } catch {
                        processedBuffer = file.buffer;
                    }
                }

                const result = await this.uploadToCloudinary(
                    processedBuffer,
                    folderName,
                    publicId,
                    file.mimetype
                );

                uploadedUrls.push(result.secure_url);
            }

            return uploadedUrls;
        } catch (err) {
            await this.rollback(uploadedUrls);
            throw err;
        }
    }

    /* ---------- Delete Single (BY URL) ---------- */

    static async deleteSingle(url: string): Promise<void> {
        try {
            const { publicId, resourceType } =
                this.extractPublicIdFromUrl(url);

            await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
            });

            console.log(`Deleted: ${publicId}`);
        } catch (err) {
            console.error(`Failed to delete: ${url}`, err);
        }
    }

    /* ---------- Delete Multiple ---------- */

    static async deleteMultiple(urls: string[]): Promise<void> {
        await Promise.allSettled(
            urls.map((url) => this.deleteSingle(url))
        );
    }

    /* ---------- Rollback ---------- */

    static async rollback(
        filePaths: string | string[]
    ): Promise<void> {
        if (Array.isArray(filePaths)) {
            await this.deleteMultiple(filePaths);
        } else {
            await this.deleteSingle(filePaths);
        }
    }
}

/* ===========================
   MULTER MIDDLEWARE EXPORTS
=========================== */

export const uploadSingleFile = (fieldName: string) =>
    upload.single(fieldName);

export const uploadMultipleFiles = (
    fieldName: string,
    maxCount: number = 10
) => upload.array(fieldName, maxCount);

export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
    upload.fields(fields);

/* ===========================
   CLOUDINARY MIDDLEWARES
=========================== */

export const handleSingleFileUpload = (folderName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) return next();

            const fileUrl = await FileService.uploadSingle(req.file, folderName);

            const extendedReq = req as RequestWithUploadedFile;
            extendedReq.cloudinaryUpload = {
                url: fileUrl,
                file: req.file
            };
            extendedReq.uploadedFilePaths = [fileUrl];

            next();
        } catch (err) {
            next(err);
        }
    };
};

export const handleMultipleFilesUpload = (folderName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.files || !Array.isArray(req.files)) return next();

            const urls = await FileService.uploadMultiple(req.files, folderName);

            const extendedReq = req as RequestWithUploadedFiles;
            extendedReq.cloudinaryUploads = {
                urls: urls,
                files: req.files
            };

            next();
        } catch (err) {
            next(err);
        }
    };
};

export const handleFieldsUpload = (folderName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const allUploadedUrls: string[] = [];

        try {
            if (!req.files || typeof req.files !== "object") return next();

            const uploadedFields: Record<string, {
                urls: string[];
                files: Express.Multer.File[];
            }> = {};

            for (const [fieldName, files] of Object.entries(req.files)) {
                if (Array.isArray(files)) {
                    const urls = await FileService.uploadMultiple(
                        files,
                        folderName
                    );

                    uploadedFields[fieldName] = {
                        urls: urls,
                        files: files
                    };
                    allUploadedUrls.push(...urls);
                }
            }

            const extendedReq = req as RequestWithUploadedFields;
            extendedReq.cloudinaryFieldUploads = uploadedFields;

            next();
        } catch (err) {
            await FileService.rollback(allUploadedUrls);
            next(err);
        }
    };
};

/* ===========================
   ROLLBACK ON ERROR
=========================== */

export const rollbackOnError = () => {
    return async (
        err: Error | null,
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const uploadReq = req as UploadRequest;

        if (err && "cloudinaryUploads" in uploadReq && uploadReq.cloudinaryUploads) {
            await FileService.rollback(uploadReq.cloudinaryUploads.urls);
        }

        if (err && "uploadedFilePaths" in uploadReq && uploadReq.uploadedFilePaths) {
            await FileService.rollback(uploadReq.uploadedFilePaths);
        }

        next(err);
    };
};

export default upload;