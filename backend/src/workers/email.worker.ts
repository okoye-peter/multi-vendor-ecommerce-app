import { Worker, Job } from 'bullmq';
import redisConnection from '../config/redis.config.ts';
// import { sendEmailVerificationCode } from '../services/email.service.ts';
import type { EmailJobData } from '../queues/email.queue.ts';
import { sendEmailVerificationCode, sendPasswordResetToken } from '../utils/sendEmail.ts';

// Create worker to process email jobs
export const emailWorker = new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
        console.log(`Processing email job ${job.id} of type: ${job.data.type}`);

        try {
            // Handle different email types
            switch (job.data.type) {
                case 'verification':
                    if (!job.data.token) {
                        throw new Error('Verification token is required');
                    }
                    await sendEmailVerificationCode(job.data.recipientEmail, job.data.token);
                    break;

                case 'welcome':
                    // Add your welcome email logic here
                    // await sendWelcomeEmail(job.data.recipientEmail, job.data.data.username);
                    console.log('Welcome email would be sent here');
                    break;

                case 'passwordReset':
                    if (!job.data.token) {
                        throw new Error('Verification token is required');
                    }
                    await sendPasswordResetToken(job.data.recipientEmail, job.data.token);
                    break;

                default:
                    throw new Error(`Unknown email type: ${job.data.type}`);
            }

            return { success: true, emailType: job.data.type };
        } catch (error) {
            console.error(`Failed to send ${job.data.type} email:`, error);
            throw error; // This will trigger retry logic
        }
    },
    {
        connection: redisConnection,
        concurrency: 5, // Process 5 emails simultaneously
        limiter: {
            max: 10, // Max 10 jobs
            duration: 1000, // Per 1 second (rate limiting)
        },
    }
);

// Event listeners for monitoring
emailWorker.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
});

emailWorker.on('error', (err) => {
    console.error('Email worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing email worker...');
    await emailWorker.close();
});

export default emailWorker;