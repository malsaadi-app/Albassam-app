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
let isReconnecting = false;

async function forceReconnect() {
  if (isReconnecting) {
    console.log('🔄 Reconnection already in progress...');
    return;
  }

  isReconnecting = true;
  globalForPrisma.prismaConnected = false;

  try {
    // Disconnect first
    await prisma.$disconnect().catch(() => {});
    
    // Then reconnect
    await prisma.$connect();
    globalForPrisma.prismaConnected = true;
    connectionAttempts = 0;
    isReconnecting = false;
    console.log('✅ Database reconnected successfully');
  } catch (err) {
    connectionAttempts++;
    console.error(`❌ Database reconnection failed (attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, err);
    
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const delay = Math.min(2000 * Math.pow(2, connectionAttempts - 1), 32000);
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      setTimeout(() => {
        isReconnecting = false;
        forceReconnect();
      }, delay);
    } else {
      isReconnecting = false;
      console.error('💀 Max reconnection attempts reached. Manual restart required.');
    }
  }
}

async function ensureConnection() {
  try {
    await prisma.$connect();
    globalForPrisma.prismaConnected = true;
    connectionAttempts = 0;
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Initial database connection failed:', err);
    await forceReconnect();
  }
}

// Auto-connect on module load
ensureConnection();

// Heartbeat to keep connection alive - every 30 seconds
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    // Reset attempts on successful heartbeat
    connectionAttempts = 0;
  } catch (err) {
    console.warn('⚠️ Heartbeat failed, forcing reconnection...');
    await forceReconnect();
  }
}, 30000); // Check every 30 seconds (more frequent)

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
