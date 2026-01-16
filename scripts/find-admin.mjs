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
        const [rows] = await pool.execute("SELECT id, name, email, role FROM users WHERE role = 'ADMIN'");
        const users = rows;

        if (users.length === 0) {
            console.log("No admin users found.");
        } else {
            console.log("Admin Users:");
            users.forEach((user) => {
                console.log(`- ${user.name} (${user.email})`);
            });
        }
    } catch (error) {
        console.error("Error finding admin:", error);
    } finally {
        await pool.end();
    }
}

main();
