import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Use DIRECT_URL for pooled runtime connections
// DATABASE_URL is used for migrations (direct connection)
if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL environment variable is required');
}

// Create connection pool using the pooled connection
const connectionString = process.env.DIRECT_URL;
const pool = new Pool({
    connectionString,
    // Recommended settings for pooled connections
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
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
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    await pool.end();
});

export default prisma;