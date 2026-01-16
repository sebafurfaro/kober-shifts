import mysql from "mysql2/promise";

const emailToDelete = "seba.furfaro@gmail.com";

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
        // 1. Find user
        const [users] = await pool.execute('SELECT id, role FROM users WHERE email = ?', [emailToDelete]);

        if (users.length === 0) {
            console.log(`User ${emailToDelete} not found.`);
            return;
        }

        const user = users[0];
        const userId = user.id;
        console.log(`Found user ${emailToDelete} (ID: ${userId}, Role: ${user.role})`);

        // 2. Delete/Nullify dependent records

        // Appointments (as patient or professional)
        // Note: If ON DELETE RESTRICT is set, we must delete these first.
        console.log("Deleting appointments...");
        const [resultApt] = await pool.execute('DELETE FROM appointments WHERE patientId = ? OR professionalId = ?', [userId, userId]);
        console.log(`Deleted ${resultApt.affectedRows} appointments.`);

        // If there were other restricted tables, handle them here.
        // Professional Profiles and Google Tokens typically cascade or are 1:1, but manual deletion is safe.
        // The CASCADE settings in init.sql suggest professional_profiles and google_oauth_tokens might auto-delete, 
        // but appointments have RESTRICT.

        // 3. Delete user
        console.log("Deleting user...");
        const [resultUser] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        console.log(`Deleted user. Affected rows: ${resultUser.affectedRows}`);

        console.log("Cleanup complete.");

    } catch (error) {
        console.error("Error deleting user:", error);
    } finally {
        await pool.end();
    }
}

main();
