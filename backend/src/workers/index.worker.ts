import emailWorker from './email.worker.ts';

console.log('🚀 Starting workers...');

// Workers are now running and will process jobs from the queue

export { emailWorker };