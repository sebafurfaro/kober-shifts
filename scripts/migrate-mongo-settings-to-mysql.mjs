#!/usr/bin/env node
/**
 * Migración única: copia tenant_settings, tenant_payments y tenant_features
 * desde MongoDB a MySQL. Ejecutar con MongoDB y MySQL accesibles antes de retirar Mongo.
 *
 * Uso: node scripts/migrate-mongo-settings-to-mysql.mjs
 * Requiere: MONGODB_URI y variables MySQL (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE)
 */

import { MongoClient } from "mongodb";
import mysql from "mysql2/promise";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27020/kober_shifts";
const MYSQL_HOST = process.env.MYSQL_HOST || "localhost";
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || "3309", 10);
const MYSQL_USER = process.env.MYSQL_USER || "kober_user";
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "kober_password";
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || "kober_shifts";

async function main() {
  let mongoClient;
  let mysqlConn;

  try {
    console.log("Conectando a MongoDB...");
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db();

    console.log("Conectando a MySQL...");
    mysqlConn = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
    });

    await mysqlConn.query(`
      CREATE TABLE IF NOT EXISTS tenant_settings (
        tenantId VARCHAR(255) PRIMARY KEY,
        settings JSON,
        permissions JSON,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await mysqlConn.query(`
      CREATE TABLE IF NOT EXISTS tenant_payments (
        tenantId VARCHAR(255) PRIMARY KEY,
        settings JSON,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await mysqlConn.query(`
      CREATE TABLE IF NOT EXISTS tenant_features (
        tenantId VARCHAR(255) PRIMARY KEY,
        features JSON,
        limits JSON,
        \`usage\` JSON,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const tsCollection = db.collection("tenant_settings");
    const tpCollection = db.collection("tenant_payments");
    const tfCollection = db.collection("tenant_features");

    const tsDocs = await tsCollection.find({}).toArray();
    let tsCount = 0;
    for (const doc of tsDocs) {
      const tenantId = doc.tenantId;
      if (!tenantId) continue;
      const settings = doc.settings != null ? JSON.stringify(doc.settings) : null;
      const permissions = doc.permissions != null ? JSON.stringify(doc.permissions) : null;
      await mysqlConn.execute(
        `INSERT INTO tenant_settings (tenantId, settings, permissions, updatedAt) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE settings = VALUES(settings), permissions = VALUES(permissions), updatedAt = VALUES(updatedAt)`,
        [tenantId, settings, permissions, doc.updatedAt || new Date()]
      );
      tsCount++;
    }
    console.log(`tenant_settings: ${tsCount} documentos migrados.`);

    const tpDocs = await tpCollection.find({}).toArray();
    let tpCount = 0;
    for (const doc of tpDocs) {
      const tenantId = doc.tenantId;
      if (!tenantId) continue;
      const settings = doc.settings != null ? JSON.stringify(doc.settings) : null;
      await mysqlConn.execute(
        `INSERT INTO tenant_payments (tenantId, settings, updatedAt) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE settings = VALUES(settings), updatedAt = VALUES(updatedAt)`,
        [tenantId, settings, doc.updatedAt || new Date()]
      );
      tpCount++;
    }
    console.log(`tenant_payments: ${tpCount} documentos migrados.`);

    const tfDocs = await tfCollection.find({}).toArray();
    let tfCount = 0;
    for (const doc of tfDocs) {
      const tenantId = doc.tenantId;
      if (!tenantId) continue;
      const features = doc.features != null ? JSON.stringify(doc.features) : null;
      const limits = doc.limits != null ? JSON.stringify(doc.limits) : null;
      const usage = doc.usage != null ? JSON.stringify(doc.usage) : null;
      await mysqlConn.execute(
        `INSERT INTO tenant_features (tenantId, features, limits, \`usage\`, updatedAt) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE features = VALUES(features), limits = VALUES(limits), \`usage\` = VALUES(\`usage\`), updatedAt = VALUES(updatedAt)`,
        [tenantId, features, limits, usage, doc.updatedAt || new Date()]
      );
      tfCount++;
    }
    console.log(`tenant_features: ${tfCount} documentos migrados.`);

    console.log("Migración completada.");
  } catch (err) {
    console.error("Error en migración:", err);
    process.exit(1);
  } finally {
    if (mongoClient) await mongoClient.close();
    if (mysqlConn) await mysqlConn.end();
  }
}

main();
