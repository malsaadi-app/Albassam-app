/**
 * Data Migration Script: SQLite → PostgreSQL
 * Migrates all data from old SQLite database to new Supabase PostgreSQL
 */

const { PrismaClient: PrismaClientSQLite } = require('@prisma/client');
const { PrismaClient: PrismaClientPostgres } = require('@prisma/client');

// SQLite client (source)
const sqliteClient = new PrismaClientSQLite({
  datasources: {
    db: {
      url: 'file:./prisma/prod.db',
    },
  },
});

// PostgreSQL client (destination)
const postgresClient = new PrismaClientPostgres();

async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...\n');

  try {
    // Order matters due to foreign key constraints!
    const tables = [
      // 1. Independent tables (no foreign keys)
      'SystemRole',
      'Department',
      'JobTitle',
      'Position',
      'Branch',
      'Supplier',
      'MaintenanceVendor',
      
      // 2. Tables with FKs to independent tables
      'User',
      'Employee',
      'TaskTemplate',
      'HRRequestType',
      'ProcurementCategory',
      'Asset',
      
      // 3. Tables with FKs to User/Employee
      'Task',
      'HRRequest',
      'AttendanceRecord',
      'AttendanceRequest',
      'Leave',
      'Payroll',
      'PayrollDetail',
      'JobApplication',
      'Replacement',
      'Shift',
      'ShiftAssignment',
      'PurchaseRequest',
      'PurchaseRequestItem',
      'PurchaseOrder',
      'PurchaseOrderItem',
      'Quotation',
      'QuotationItem',
      'GoodsReceipt',
      'GoodsReceiptItem',
      'MaintenanceRequest',
      'WorkOrder',
      
      // 4. Supporting tables
      'Comment',
      'Notification',
      'ActivityLog',
      'HRRequestAuditLog',
      'HRDelegation',
      'HRWorkflowSettings',
      'HRRequestTypeWorkflow',
      'ProcurementCategoryWorkflow',
      'EmployeeFile',
    ];

    let totalRecords = 0;

    for (const table of tables) {
      try {
        const modelName = table.charAt(0).toLowerCase() + table.slice(1);
        
        // Check if model exists
        if (!sqliteClient[modelName]) {
          console.log(`⚠️  Model '${modelName}' not found, skipping...`);
          continue;
        }

        // Fetch all records from SQLite
        const records = await sqliteClient[modelName].findMany();
        
        if (records.length === 0) {
          console.log(`✓ ${table}: 0 records (empty)`);
          continue;
        }

        // Insert records into PostgreSQL
        let inserted = 0;
        for (const record of records) {
          try {
            await postgresClient[modelName].create({
              data: record,
            });
            inserted++;
          } catch (error) {
            // Skip if record already exists (duplicate key)
            if (error.code === 'P2002') {
              console.log(`  ⟳ Skipping duplicate record in ${table}`);
            } else {
              console.error(`  ✗ Error inserting into ${table}:`, error.message);
            }
          }
        }

        totalRecords += inserted;
        console.log(`✓ ${table}: ${inserted}/${records.length} records migrated`);
        
      } catch (error) {
        console.error(`✗ Error migrating ${table}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration complete! Total records migrated: ${totalRecords}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
