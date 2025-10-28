import { Queue } from 'bullmq';
import redisConnection from '../config/redis.config.ts';

// Define the structure of email job data
export interface EmailJobData {
    type: 'verification' | 'passwordReset' | 'welcome'; // Add more types as needed
    recipientEmail: string;
    token?: number;
    data?: any; // For additional data like username, etc.
}

// Create the email queue
export const emailQueue = new Queue<EmailJobData>('email', {
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

// Helper function to add verification email to queue
export const queueVerificationEmail = async (
    recipientEmail: string,
    token: number
) => {
    try {
        const job = await emailQueue.add(
            'send-verification-email', // Job name
            {
                type: 'verification',
                recipientEmail,
                token,
            },
            {
                priority: 1, // Higher priority for verification emails
            }
        );

        console.log(`Verification email queued with job ID: ${job.id}`);
        return job;
    } catch (error) {
        console.error('Error queuing verification email:', error);
        throw error;
    }
};

// Helper for other email types
export const queueWelcomeEmail = async (recipientEmail: string, username: string) => {
    try {
        const job = await emailQueue.add(
            'send-welcome-email',
            {
                type: 'welcome',
                recipientEmail,
                data: { username },
            }
        );

        console.log(`Welcome email queued with job ID: ${job.id}`);
        return job;
    } catch (error) {
        console.error('Error queuing welcome email:', error);
        throw error;
    }
};

export const queuePasswordResetTokenEmail = async (
    recipientEmail: string,
    token: number
) => {
    try {
        const job = await emailQueue.add(
            'send-password-reset-token-email', // Job name
            {
                type: 'passwordReset',
                recipientEmail,
                token,
            },
            {
                priority: 1, // Higher priority for verification emails
            }
        );

        console.log(`password Reset email queued with job ID: ${job.id}`);
        return job;
    } catch (error) {
        console.error('Error queuing password Reset email:', error);
        throw error;
    }
};