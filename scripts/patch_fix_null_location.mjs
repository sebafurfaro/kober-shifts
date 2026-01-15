import mysql from "mysql2/promise";

const isDocker = process.env.MYSQL_HOST === 'mysql' || process.env.NODE_ENV === 'production';
const defaultHost = isDocker ? 'mysql' : 'localhost';
const defaultPort = isDocker ? 3306 : 3309;

async function main() {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST || defaultHost,
        port: parseInt(process.env.MYSQL_PORT || defaultPort.toString()),
        user: process.env.MYSQL_USER || 'kober_user',
        password: process.env.MYSQL_PASSWORD || 'kober_password',
        database: process.env.MYSQL_DATABASE || 'kober_shifts',
    });

    try {
        console.log("Modifying appointments table to allow NULL in locationId...");
        await pool.execute('ALTER TABLE appointments MODIFY COLUMN locationId VARCHAR(255) NULL');
        console.log("Modifying appointments table to allow NULL in specialtyId...");
        await pool.execute('ALTER TABLE appointments MODIFY COLUMN specialtyId VARCHAR(255) NULL');
        console.log("Successfully updated database schema.");
    } catch (error) {
        console.error("Error updating database schema:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
