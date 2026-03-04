/**
 * Migración: eliminar especialidades de la plataforma.
 * - Elimina FK y columna specialtyId de appointments
 * - Elimina tabla professional_specialties
 * - Elimina FK y columna specialtyId de professional_profiles
 * - Elimina tabla specialties
 */
import mysql from 'mysql2/promise';

const isDocker = process.env.MYSQL_HOST === 'mysql' || process.env.NODE_ENV === 'production';
const defaultHost = isDocker ? 'mysql' : 'localhost';
const defaultPort = isDocker ? 3306 : 3309;

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || defaultHost,
    port: parseInt(process.env.MYSQL_PORT || defaultPort.toString()),
    user: process.env.MYSQL_USER || 'kober_user',
    password: process.env.MYSQL_PASSWORD || 'kober_password',
    database: process.env.MYSQL_DATABASE || 'kober_shifts',
    multipleStatements: true,
  });

  try {
    console.log('Ejecutando migración: remove specialties...');

    // 1. Drop FK appointments -> specialties (si existe)
    const [fkAppRows] = await connection.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments' AND REFERENCED_TABLE_NAME = 'specialties' LIMIT 1`,
      [process.env.MYSQL_DATABASE || 'kober_shifts']
    );
    const fkApp = Array.isArray(fkAppRows) ? fkAppRows[0] : null;
    if (fkApp && fkApp.CONSTRAINT_NAME) {
      await connection.query(`ALTER TABLE appointments DROP FOREIGN KEY \`${fkApp.CONSTRAINT_NAME}\``);
      console.log('  - FK appointments -> specialties eliminada');
    }

    // 2. Drop column specialtyId from appointments (si existe)
    const [colsAppRows] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'specialtyId'`,
      [process.env.MYSQL_DATABASE || 'kober_shifts']
    );
    if (Array.isArray(colsAppRows) && colsAppRows.length > 0) {
      await connection.query('ALTER TABLE appointments DROP COLUMN specialtyId');
      console.log('  - Columna appointments.specialtyId eliminada');
    }

    // 3. Drop table professional_specialties
    await connection.query('DROP TABLE IF EXISTS professional_specialties');
    console.log('  - Tabla professional_specialties eliminada');

    // 4. Drop FK professional_profiles -> specialties (si existe)
    const [fkProfRows] = await connection.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'professional_profiles' AND REFERENCED_TABLE_NAME = 'specialties' LIMIT 1`,
      [process.env.MYSQL_DATABASE || 'kober_shifts']
    );
    const fkProf = Array.isArray(fkProfRows) ? fkProfRows[0] : null;
    if (fkProf && fkProf.CONSTRAINT_NAME) {
      await connection.query(`ALTER TABLE professional_profiles DROP FOREIGN KEY \`${fkProf.CONSTRAINT_NAME}\``);
      console.log('  - FK professional_profiles -> specialties eliminada');
    }

    // 5. Drop column specialtyId from professional_profiles (si existe)
    const [colsProfRows] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'professional_profiles' AND COLUMN_NAME = 'specialtyId'`,
      [process.env.MYSQL_DATABASE || 'kober_shifts']
    );
    if (Array.isArray(colsProfRows) && colsProfRows.length > 0) {
      await connection.query('ALTER TABLE professional_profiles DROP COLUMN specialtyId');
      console.log('  - Columna professional_profiles.specialtyId eliminada');
    }

    // 6. Drop table specialties
    await connection.query('DROP TABLE IF EXISTS specialties');
    console.log('  - Tabla specialties eliminada');

    console.log('✅ Migración ejecutada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
