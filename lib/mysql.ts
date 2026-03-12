import mysql from 'mysql2/promise';

const isDocker = process.env.MYSQL_HOST === 'mysql';
const defaultHost = isDocker ? 'mysql' : 'localhost';
const defaultPort = isDocker ? 3306 : 3309;

let pool: mysql.Pool | null = null;
let lastConnectionTest = 0;
const CONNECTION_TEST_INTERVAL = 30000;

function createPool(): mysql.Pool {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || defaultHost,
    port: parseInt(process.env.MYSQL_PORT || defaultPort.toString()),
    user: process.env.MYSQL_USER || 'kober_user',
    password: process.env.MYSQL_PASSWORD || 'kober_password',
    database: process.env.MYSQL_DATABASE || 'kober_shifts',
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000, 
    ...(isDocker ? {} : { ssl: { rejectUnauthorized: false } }),
    
    timezone: '+00:00', 
  });
  
  pool.query("SET time_zone = '-03:00'").catch(() => {
    
  });
  
  return pool;
}

// Inicializar el pool
pool = createPool();

async function testConnection(retryCount = 0): Promise<boolean> {
  if (!pool) {
    pool = createPool();
  }

  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    if (retryCount === 0) {
      console.log('✅ MySQL connected successfully');
    }
    return true;
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error(`❌ MySQL connection error (attempt ${retryCount + 1}):`, errorMessage);
    
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
      try {
        await pool.end();
      } catch (e) {
      }
      pool = createPool();
    }

    if (retryCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return testConnection(retryCount + 1);
    }

    return false;
  }
}

async function ensureConnection(): Promise<mysql.Pool> {
  const now = Date.now();
  
  if (!pool || (now - lastConnectionTest) > CONNECTION_TEST_INTERVAL) {
    const isConnected = await testConnection();
    lastConnectionTest = now;
    
    if (!isConnected) {
      throw new Error('MySQL connection failed after retries');
    }
  }

  if (!pool) {
    pool = createPool();
  }

  return pool;
}

if (isDocker || process.env.NODE_ENV === 'production') {
  testConnection().catch(() => {
    console.warn('⚠️  MySQL initial connection test failed, will retry on first query');
  });
}

export async function ensureMySQLConnection(): Promise<mysql.Pool> {
  return ensureConnection();
}

const poolWrapper = {
  async execute(...args: Parameters<mysql.Pool['execute']>) {
    const activePool = await ensureConnection();
    return activePool.execute(...args);
  },
  async query(...args: Parameters<mysql.Pool['query']>) {
    const activePool = await ensureConnection();
    return activePool.query(...args);
  },
  async getConnection() {
    const activePool = await ensureConnection();
    return activePool.getConnection();
  },
  async end() {
    if (pool) {
      await pool.end();
      pool = null;
    }
  },
  get config() {
    return pool?.config;
  },
} as mysql.Pool;

export default poolWrapper;

