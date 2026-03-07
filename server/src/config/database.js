const { Pool } = require('pg');

const isSSL = process.env.DB_SSL === 'true';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSSL ? { rejectUnauthorized: false } : false,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    console.log('📦 PostgreSQL pool — new client connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
    process.exit(1);
});

/**
 * Execute a parameterised query against the pool.
 * @param {string} text  SQL query string with $1, $2 … placeholders
 * @param {Array}  params  Bind parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
        console.log('  🔍 query', { text: text.substring(0, 80), duration: `${duration}ms`, rows: result.rowCount });
    }

    return result;
};

/**
 * Acquire a client from the pool for transactions.
 * Remember to call client.release() when done.
 */
const getClient = async () => {
    const client = await pool.connect();
    return client;
};

module.exports = { pool, query, getClient };
