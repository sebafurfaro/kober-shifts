import mysql from "mysql2/promise";

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
    });

    try {
        const [tables] = await connection.query("SHOW TABLES");
        console.log("Tables:", tables);

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [columns] = await connection.query(`DESCRIBE ${tableName}`);
            console.log(`Columns for ${tableName}:`, columns);
        }
    } catch (error) {
        console.error("Error inspecting database:", error);
    } finally {
        await connection.end();
    }
}

main();
