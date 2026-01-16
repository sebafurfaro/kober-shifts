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
        const [columns] = await pool.execute('DESCRIBE professional_profiles');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('licenseNumber')) {
            console.log("Adding licenseNumber...");
            await pool.execute('ALTER TABLE professional_profiles ADD COLUMN licenseNumber VARCHAR(100) AFTER color');
        }
        if (!columnNames.includes('medicalCoverages')) {
            console.log("Adding medicalCoverages...");
            await pool.execute('ALTER TABLE professional_profiles ADD COLUMN medicalCoverages JSON AFTER licenseNumber');
        }
        if (!columnNames.includes('availabilityConfig')) {
            console.log("Adding availabilityConfig...");
            await pool.execute('ALTER TABLE professional_profiles ADD COLUMN availabilityConfig JSON AFTER medicalCoverages');
        }
        console.log("Successfully updated database schema.");
    } catch (error) {
        console.error("Error updating database schema:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
