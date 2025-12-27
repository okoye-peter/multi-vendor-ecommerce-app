// workers/index.worker.ts
import emailWorker from './email.worker.js';
import reportWorker from './reportDownload.worker.js'; // Default import

console.log('🚀 Starting workers...');
console.log('📧 Email worker: Listening for email jobs');
console.log('📊 Report worker: Listening for report jobs');

// Add event listeners to confirm workers are active
emailWorker.on('ready', () => {
    console.log('✅ Email worker is ready');
});

reportWorker.on('ready', () => {
    console.log('✅ Report worker is ready');
});

// Keep process alive
process.on('SIGTERM', async () => {
    console.log('Shutting down workers...');
    await emailWorker.close();
    await reportWorker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Shutting down workers...');
    await emailWorker.close();
    await reportWorker.close();
    process.exit(0);
});

export { emailWorker, reportWorker };