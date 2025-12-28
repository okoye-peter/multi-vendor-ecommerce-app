import { Worker, Job } from 'bullmq';
import redisConnection from '../config/redis.config.js';
import { ReportType, type ReportJobData } from '../queues/reportDownload.queue.js';
import prisma from '../libs/prisma.js';
import ExcelJS from 'exceljs';
import { getOrderStatusLabel } from '../enums/orderStatus.js';
import { format } from 'date-fns';
import { sendReportEmail } from '../utils/sendEmail.js';

// Fix the type to match Prisma's actual schema
type OrderWithSubProducts = {
    id: number;
    productId: number | null;
    requestedQuantity: number;
    quantity: number;
    orderGroupId: number;
    priceOnPurchase: number;
    createdAt: Date;
    subProducts: {
        id: number;
        subProductId: number | null;
        quantity: number;
        subProduct: {
            id: number;
            batch_no: string;
            cost_price: number;
        } | null;
    }[];
    orderGroup: {
        id: number;
        ref_no: string;
        status: number;
    };
};

export const reportWorker = new Worker<ReportJobData>(
    'report_download',
    async (job: Job<ReportJobData>) => {
        try {
            await job.updateProgress(10);

            let recordCount = 0;
            let buffer: any; // ✅ Changed from Buffer to any to avoid type conflicts

            switch (job.data.reportType) {
                case ReportType.PRODUCT_SALES_REPORT: {
                    await job.updateProgress(20);

                    const sales: OrderWithSubProducts[] = await prisma.order.findMany({
                        where: job.data.filters,
                        select: {
                            id: true,
                            productId: true,
                            requestedQuantity: true,
                            quantity: true,
                            orderGroupId: true,
                            priceOnPurchase: true,
                            createdAt: true,
                            subProducts: {
                                select: {
                                    id: true,
                                    subProductId: true,
                                    quantity: true,
                                    subProduct: {
                                        select: {
                                            id: true,
                                            batch_no: true,
                                            cost_price: true
                                        }
                                    }
                                }
                            },
                            orderGroup: {
                                select: {
                                    id: true,
                                    ref_no: true,
                                    status: true
                                }
                            }
                        }
                    });

                    recordCount = sales.length;

                    if (sales.length === 0) {
                        throw new Error('No data found for the specified filters');
                    }

                    const workbook = new ExcelJS.Workbook();
                    workbook.creator = 'My App';
                    workbook.created = new Date();

                    const sheet = workbook.addWorksheet(job.data.reportName);

                    sheet.columns = [
                        { header: 'S/N', key: 'id', width: 10 },
                        { header: 'Order Ref No', key: 'ref_no', width: 20 },
                        { header: 'Status', key: 'status', width: 15 },
                        { header: 'Amount', key: 'amount', width: 15 },
                        { header: 'Quantity', key: 'quantity', width: 12 },
                        { header: 'Price', key: 'priceOnPurchase', width: 15 },
                        { header: 'Batches', key: 'subProducts', width: 60 },
                        { header: 'Date', key: 'date', width: 20 },
                    ];

                    const rows = sales.map((order, index) => {
                        return {
                            id: index + 1,
                            ref_no: order.orderGroup.ref_no,
                            status: getOrderStatusLabel(order.orderGroup.status as import('../enums/orderStatus.js').OrderStatusValue),
                            amount: (order.quantity * order.priceOnPurchase),
                            quantity: order.quantity,
                            priceOnPurchase: order.priceOnPurchase,
                            subProducts: order.subProducts
                                .map((subp) => {
                                    if (!subp.subProduct) return '';
                                    return `Batch: ${subp.subProduct.batch_no} * Cost: ₦${subp.subProduct.cost_price} * Qty: ${subp.quantity}`;
                                })
                                .filter(Boolean)
                                .join('\n'),
                            date: format(new Date(order.createdAt), 'dd MMM, yyyy')
                        };
                    });

                    sheet.addRows(rows);

                    // Header styling
                    sheet.getRow(1).font = { bold: true, size: 12 };
                    sheet.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' }
                    };

                    // Format amount and price columns as currency
                    sheet.getColumn('amount').numFmt = '₦#,##0.00';
                    sheet.getColumn('priceOnPurchase').numFmt = '₦#,##0.00';

                    // Enable text wrapping for batches column
                    sheet.getColumn('subProducts').alignment = {
                        wrapText: true,
                        vertical: 'top'
                    };

                    // Generate buffer
                    buffer = await workbook.xlsx.writeBuffer();
                    break;
                }

                case 'SALES_REPORT':
                    throw new Error('Report type not implemented yet');

                case 'USER_ACTIVITY':
                    throw new Error('Report type not implemented yet');

                case 'INVENTORY':
                    throw new Error('Report type not implemented yet');

                case 'INVOICES':
                    throw new Error('Report type not implemented yet');

                default:
                    throw new Error(`Unknown report type: ${job.data.reportType}`);
            }

            // Send email with attachment
            await job.updateProgress(80);

            await sendReportEmail(
                job.data.emailTo,
                buffer,
                job.data.reportName,
                recordCount
            );

            console.log(`Report sent successfully to ${job.data.emailTo}`);

            return {
                success: true,
                recordCount,
                emailTo: job.data.emailTo,
                reportName: job.data.reportName
            };

        } catch (error) {
            console.error(`Report generation failed for job ${job.id}:`, error);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 3,
        limiter: {
            max: 10,
            duration: 1000,
        },
    }
);

// Event listeners
reportWorker.on('ready', () => {
    console.log('🎯 Report worker is ready and waiting for jobs');
});

reportWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
});

reportWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
});

reportWorker.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

reportWorker.on('error', (err) => {
    console.error('⚠️ Report worker error:', err);
});


export default reportWorker;