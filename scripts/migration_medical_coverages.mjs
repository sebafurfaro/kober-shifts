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
        console.log("Creating medical_coverages and medical_plans tables...");

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS medical_coverages (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS medical_plans (
                id VARCHAR(255) PRIMARY KEY,
                coverageId VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (coverageId) REFERENCES medical_coverages(id) ON DELETE CASCADE,
                INDEX idx_coverage (coverageId),
                INDEX idx_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log("Successfully created database tables.");
    } catch (error) {
        console.error("Error updating database schema:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
