import { Queue, Job } from 'bullmq';
import redisConnection from '../config/redis.config.js';

export enum ReportType {
    SALES_REPORT = 'SALES_REPORT',
    PRODUCT_SALES_REPORT = 'PRODUCT_SALES_REPORT',
    USER_ACTIVITY = 'USER_ACTIVITY',
    INVENTORY = 'INVENTORY',
    INVOICES = 'INVOICES'
}

export interface ReportJobData {
    reportType: ReportType;
    filters: Record<string, any>; // Optional additional filters
    emailTo: string;
    reportName: string
}

// Create the email queue
export const reportQueue = new Queue<ReportJobData>('report_download', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3, // Retry failed jobs up to 3 times
        backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 seconds, then 4s, 8s
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
});

export const addToReportQueue = async (emailTo: string, reportName: string, reportType: ReportType, filters: Record<string, any> ) => { 
    try {
        const job = await reportQueue.add('product_sales_report', {
            reportType,
            emailTo,
            filters,
            reportName
        })
        console.log(`report download queued with job ID: ${job.id}`);
        return job;
    } catch (error) {
        console.error('Error queuing report download:', error);
        throw error;
    }
}
