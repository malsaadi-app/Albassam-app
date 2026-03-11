const { execSync } = require('child_process');

// Use direct connection (port 5432) instead of pooler (port 6543)
const directUrl = 'postgresql://postgres.uvizfidyfhxwekqbtkma:hazGyk-6wecqo-rokxij@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=false';

process.env.DATABASE_URL = directUrl;

console.log('🔄 Applying schema changes to database...');
console.log('📡 Using direct connection (port 5432)');
console.log('');

try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: directUrl }
  });
  
  console.log('');
  console.log('✅ Schema applied successfully!');
  
} catch (error) {
  console.error('❌ Error applying schema:', error.message);
  process.exit(1);
}
