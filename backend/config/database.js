const { Pool } = require('pg');

// Use DATABASE_URL from Railway environment variables
const connectionString = process.env.DATABASE_URL;

console.log('🗄️ Database URL:', connectionString ? 'Configured' : 'Not configured');

const pool = new Pool({
connectionString: connectionString,
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
pool.on('connect', () => {
console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
console.error('❌ Database connection error:', err);
});

// Test connection on startup
pool.connect()
.then(() => console.log('✅ Database connected successfully'))
.catch(err => console.error('❌ Database connection failed:', err.message));

// Helper function to execute queries
const query = (text, params) => {
return pool.query(text, params);
};

module.exports = {
pool,
query
};
