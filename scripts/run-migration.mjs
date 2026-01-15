import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDocker = process.env.MYSQL_HOST === 'mysql' || process.env.NODE_ENV === 'production';
const defaultHost = isDocker ? 'mysql' : 'localhost';
const defaultPort = isDocker ? 3306 : 3309;

async function main() {
  const migrationFileName = process.argv[2];
  
  if (!migrationFileName) {
    console.error('Uso: node run-migration.mjs <nombre_archivo_migracion.sql>');
    process.exit(1);
  }

  // Use a single connection instead of a pool to avoid connection issues
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || defaultHost,
    port: parseInt(process.env.MYSQL_PORT || defaultPort.toString()),
    user: process.env.MYSQL_USER || 'kober_user',
    password: process.env.MYSQL_PASSWORD || 'kober_password',
    database: process.env.MYSQL_DATABASE || 'kober_shifts',
    multipleStatements: true,
  });

  try {
    const migrationPath = join(__dirname, '../docker/mysql', migrationFileName);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log(`Ejecutando migración: ${migrationFileName}...`);
    await connection.query(migrationSQL);
    console.log('✅ Migración ejecutada exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.sqlMessage || error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  El campo ya existe, continuando...');
    } else {
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
