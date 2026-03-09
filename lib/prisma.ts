import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  prismaConnected: boolean;
};

// Create Prisma client with extended error handling
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    // Connection pool optimization for Supabase pooler
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection management with auto-reconnect
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

async function ensureConnection() {
  if (globalForPrisma.prismaConnected) {
    return;
  }

  try {
    await prisma.$connect();
    globalForPrisma.prismaConnected = true;
    connectionAttempts = 0;
    console.log('✅ Database connected successfully');
  } catch (err) {
    connectionAttempts++;
    console.error(`❌ Database connection failed (attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, err);
    
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 16000);
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      setTimeout(() => ensureConnection(), delay);
    } else {
      console.error('💀 Max reconnection attempts reached. Manual intervention required.');
    }
  }
}

// Auto-connect on module load
ensureConnection();

// Heartbeat to keep connection alive
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.warn('⚠️ Heartbeat failed, reconnecting...', err);
    globalForPrisma.prismaConnected = false;
    await ensureConnection();
  }
}, 60000); // Check every 60 seconds

// Graceful shutdown on SIGINT/SIGTERM
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default prisma;
