const mysql = require('mysql2/promise');

// Database configurations for multiple databases
const dbConfigs = {
  sms: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: ['DATE', 'DATETIME', 'TIMESTAMP'],
    timezone: process.env.DB_TIMEZONE || 'local',
    multipleStatements: true
    // debug: process.env.NODE_ENV === "development" ? ["ComQueryPacket"] : false,
    // trace: process.env.NODE_ENV === "development",
  },
  // Add more database configurations as needed
  school: {
    host: process.env.SCHOOL_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.SCHOOL_DB_PORT || process.env.DB_PORT || 3306,
    user: process.env.SCHOOL_DB_USER || process.env.DB_USER || 'root',
    password: process.env.SCHOOL_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.SCHOOL_DB_NAME || 'school_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: ['DATE', 'DATETIME', 'TIMESTAMP'],
    timezone: process.env.DB_TIMEZONE || 'local',
    multipleStatements: true
  },
  ecommerce: {
    host: process.env.ECOMMERCE_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.ECOMMERCE_DB_PORT || process.env.DB_PORT || 3306,
    user: process.env.ECOMMERCE_DB_USER || process.env.DB_USER || 'root',
    password: process.env.ECOMMERCE_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.ECOMMERCE_DB_NAME || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: ['DATE', 'DATETIME', 'TIMESTAMP'],
    timezone: process.env.DB_TIMEZONE || 'local',
    multipleStatements: true
  }
};

// Connection pools for each database
const pools = {};

// Initialize connection pools
Object.keys(dbConfigs).forEach((dbName) => {
  pools[dbName] = mysql.createPool(dbConfigs[dbName]);
});

// Test connections
const testConnections = async () => {
  for (const [dbName, pool] of Object.entries(pools)) {
    try {
      const connection = await pool.getConnection();
      console.log(`✅ Database '${dbName}' connected successfully`);

      // Verify timestamp handling
      const [rows] = await connection.execute('SELECT NOW() as currentTime');
      console.log(`✓ ${dbName} timestamp test: ${rows[0].currentTime}`);

      connection.release();
    } catch (err) {
      console.error(`❌ Database '${dbName}' connection failed:`, err.message);
    }
  }
};

// Test connections on module load
testConnections();

/**
 * Generic database query executor with internal database switching
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @param {string} dbName - Database name (internal use only, defaults to 'default')
 * @returns {Promise} Query result
 */
const executeQuery = async (sql, params = [], dbName = 'sms') => {
  try {
    //console.log('🚀 ~ executeQuery ~ pools:', pools);
    if (!pools[dbName]) {
      console.warn(`Database '${dbName}' not configured, falling back to default`);
      dbName = 'sms';
    }

    const [results] = await pools[dbName].execute(sql, params);
    // Remove the //console.log to avoid cluttering logs
    return results;
  } catch (error) {
    console.error(`Error executing query on '${dbName}' database:`, error);
    throw error;
  }
};

/**
 * Get connection from specific database pool
 * @param {string} dbName - Database name (optional, defaults to 'default')
 * @returns {Promise} Database connection
 */
const getConnection = async (dbName = 'sms') => {
  try {
    if (!pools[dbName]) {
      throw new Error(`Database '${dbName}' not configured`);
    }

    return await pools[dbName].getConnection();
  } catch (error) {
    console.error(`Error getting connection from '${dbName}' database:`, error);
    throw error;
  }
};

/**
 * Execute query with transaction support
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @param {string} dbName - Database name (optional, defaults to 'default')
 * @returns {Promise} Query result
 */
const executeTransaction = async (queries, dbName = 'sms') => {
  const connection = await getConnection(dbName);

  try {
    await connection.beginTransaction();

    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }

    await connection.commit();
    //console.log(`✅ Transaction completed successfully on '${dbName}' database`);
    return results;
  } catch (error) {
    await connection.rollback();
    console.error(`❌ Transaction failed on '${dbName}' database:`, error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Switch database context for a specific operation
 * @param {string} dbName - Database name
 * @param {Function} operation - Function to execute with the database context
 * @returns {Promise} Operation result
 */
const withDatabase = async (operation, dbName = 'sms') => {
  try {
    if (!pools[dbName]) {
      throw new Error(`Database '${dbName}' not configured`);
    }

    //console.log(`🔄 Switching to '${dbName}' database context`);
    return await operation(pools[dbName]);
  } catch (error) {
    console.error(`Error in database context '${dbName}':`, error);
    throw error;
  }
};

// Default database methods (backward compatibility)
const defaultPool = pools.sms;

module.exports = {
  // Default database methods
  pool: defaultPool,
  execute: defaultPool.execute.bind(defaultPool),
  query: defaultPool.query.bind(defaultPool),
  getConnectionDefault: defaultPool.getConnection.bind(defaultPool),
  // Multi-database methods
  executeQuery,
  getConnection: getConnection,
  executeTransaction,
  withDatabase,
  pools,

  // Database utilities
  getDatabaseList: () => Object.keys(dbConfigs),
  addDatabase: (name, config) => {
    dbConfigs[name] = config;
    pools[name] = mysql.createPool(config);
    //console.log(`✅ Added new database configuration: ${name}`);
  }
};
