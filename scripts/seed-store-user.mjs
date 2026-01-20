import crypto from "node:crypto";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

const email = "seba.furfaro@gmail.com";
const password = "admin1234"; // Cambia esta contraseña si lo deseas
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
    // First, check if default tenant exists, if not create it
    const [tenantCheck] = await pool.execute('SELECT id FROM tenants WHERE id = ?', ['default']);
    if (tenantCheck.length === 0) {
      await pool.execute(
        'INSERT INTO tenants (id, name, isActive) VALUES (?, ?, ?)',
        ['default', 'Default Tenant', true]
      );
      console.log('Created default tenant');
    }

    // Check if user exists in any tenant
    const [existing] = await pool.execute('SELECT id, tenantId FROM users WHERE email = ?', [email]);

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      const tenantId = existing[0].tenantId || 'default';
      // Update existing user
      await pool.execute(
        'UPDATE users SET name = ?, role = ?, passwordHash = ? WHERE id = ?',
        [name, 'ADMIN', hashPassword(password), userId]
      );
      console.log(`Updated STORE user: ${email} (id=${userId}, tenantId=${tenantId})`);
      console.log(`Password: ${password}`);
    } else {
      // Create new user in default tenant
      userId = randomUUID();
      await pool.execute(
        'INSERT INTO users (id, tenantId, email, name, role, passwordHash) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'default', email, name, 'ADMIN', hashPassword(password)]
      );
      console.log(`Created STORE user: ${email} (id=${userId}, tenantId=default)`);
      console.log(`Password: ${password}`);
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
