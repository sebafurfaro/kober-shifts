import mysql from "./lib/mysql";

async function run() {
  const [rows] = await mysql.execute("SELECT a.id, a.patientId, a.serviceId, s.price, a.createdAt FROM appointments a LEFT JOIN services s ON a.serviceId = s.id ORDER BY a.createdAt DESC LIMIT 5");
  console.log(rows);
  process.exit(0);
}
run();
