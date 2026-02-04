import mysql from 'mysql2/promise';

// Si la aplicación corre localmente (no en Docker), usar localhost:3309
// Si corre en Docker, usar mysql:3306
const isDocker = process.env.MYSQL_HOST === 'mysql' || process.env.NODE_ENV === 'production';
const defaultHost = isDocker ? 'mysql' : 'localhost';
const defaultPort = isDocker ? 3306 : 3309;

let pool: mysql.Pool | null = null;
let lastConnectionTest = 0;
const CONNECTION_TEST_INTERVAL = 30000; // Test cada 30 segundos

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
    connectTimeout: 10000, // 10 segundos
    /**
     * MySQL 8 usa `caching_sha2_password` por defecto. En algunos entornos (host->docker),
     * mysql2 puede fallar el handshake sin TLS. Forzamos TLS en modo local.
     */
    ...(isDocker ? {} : { ssl: { rejectUnauthorized: false } }),
    // Configure timezone for the connection
    timezone: '+00:00', // Store dates in UTC, but we'll handle conversion in application code
  });
  
  // Set session timezone to match application timezone (Buenos Aires)
  pool.query("SET time_zone = '-03:00'").catch(() => {
    // Ignore errors, timezone might not be critical
  });
  
  return pool;
}

// Inicializar el pool
pool = createPool();

// Función para verificar la conexión
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
    
    // Si el pool está roto, recrearlo
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
      try {
        await pool.end();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      pool = createPool();
    }

    // Reintentar hasta 3 veces con backoff
    if (retryCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return testConnection(retryCount + 1);
    }

    return false;
  }
}

// Función para asegurar conexión antes de usar
async function ensureConnection(): Promise<mysql.Pool> {
  const now = Date.now();
  
  // Testear conexión periódicamente o si no hay pool
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

// Testear conexión al iniciar (no bloqueante)
if (isDocker || process.env.NODE_ENV === 'production') {
  testConnection().catch(() => {
    console.warn('⚠️  MySQL initial connection test failed, will retry on first query');
  });
}

// Exportar función helper para asegurar conexión
export async function ensureMySQLConnection(): Promise<mysql.Pool> {
  return ensureConnection();
}

// Crear un wrapper del pool que asegura conexión antes de cada operación
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

// Exportar pool wrapper que asegura conexión
export default poolWrapper;

