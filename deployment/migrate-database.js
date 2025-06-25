const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDatabase() {
  console.log('🗄️ Starting database migration...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('✅ Database schema created successfully');

    await client.end();
    console.log('✅ Database migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateDatabase();
}

module.exports = migrateDatabase;