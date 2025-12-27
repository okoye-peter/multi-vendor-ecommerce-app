import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// DATABASE_URL should be your pooled connection (e.g., from Supabase/Neon pooler)
// DIRECT_URL should be your direct connection (used by Prisma Migrate)
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// Create connection pool using the pooled connection
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    // Optimized settings for pooled connections
    max: 10, // Reduced from 20 - most providers limit connections
    min: 2, // Keep some connections alive
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Add SSL config if using cloud databases
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Prisma Client singleton pattern
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Graceful shutdown
const cleanup = async () => {
    console.log('Cleaning up database connections...');
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);

// Optional: Test connection on startup
export async function testConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection successful');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

export default prisma;