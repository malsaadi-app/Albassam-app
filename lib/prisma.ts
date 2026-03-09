import { PrismaClient } from '@prisma/client';

// Singleton pattern
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient | undefined;
};

// Create Prisma client with optimized configuration
function createPrismaClient() {
  // Build DATABASE_URL with proper parameters for pooling
  const dbUrl = new URL(process.env.DATABASE_URL!);
  
  // Add pgbouncer mode for transaction pooling
  if (!dbUrl.searchParams.has('pgbouncer')) {
    dbUrl.searchParams.append('pgbouncer', 'true');
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    datasources: {
      db: {
        url: dbUrl.toString(),
      },
    },
  });

  return client;
}

// Export singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health check with auto-reconnect
let isConnecting = false;

async function ensureConnected() {
  if (isConnecting) return;
  
  try {
    isConnecting = true;
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    console.error('❌ Connection test failed, attempting reconnect...');
    
    // Force reconnect
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('✅ Reconnected successfully');
    } catch (reconnectError) {
      console.error('💀 Reconnect failed:', reconnectError);
      throw reconnectError;
    }
  } finally {
    isConnecting = false;
  }
}

// Initial connection test
ensureConnected().catch(err => {
  console.error('Failed to establish initial database connection:', err);
});

// Periodic connection health check (every 5 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    ensureConnected().catch(err => {
      console.error('Periodic health check failed:', err);
    });
  }, 5 * 60 * 1000); // 5 minutes
}

// Graceful shutdown handlers
if (process.env.NODE_ENV === 'production') {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, closing Prisma connection...`);
    try {
      await prisma.$disconnect();
      console.log('✅ Prisma disconnected successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during Prisma disconnect:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('beforeExit', () => shutdown('beforeExit'));
}

export default prisma;
