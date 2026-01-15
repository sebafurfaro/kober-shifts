import crypto from "node:crypto";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

const email = "seba.furfaro@gmail.com";
const password = "Gaspar2023.3";
const name = "Sebastian Furfaro";

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
    // Check if user exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      // Update existing user
      await pool.execute(
        'UPDATE users SET name = ?, role = ?, passwordHash = ? WHERE id = ?',
        [name, 'ADMIN', hashPassword(password), userId]
      );
      console.log(`Updated ADMIN user: ${email} (id=${userId})`);
    } else {
      // Create new user
      userId = randomUUID();
      await pool.execute(
        'INSERT INTO users (id, email, name, role, passwordHash) VALUES (?, ?, ?, ?, ?)',
        [userId, email, name, 'ADMIN', hashPassword(password)]
      );
      console.log(`Seeded ADMIN user: ${email} (id=${userId})`);
    }
  } finally {
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });


