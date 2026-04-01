import mysql from "./lib/mysql";

async function run() {
  const [rows] = await mysql.execute("SELECT u.id, u.tenantId, a.tenantId as aTenantId FROM users u JOIN appointments a ON u.id = a.patientId WHERE a.id = 'd7598415-2891-47e2-81a8-2f9d9e3aaf15'");
  console.log('Match based on patientId only:', rows);

  const [exactRows] = await mysql.execute("SELECT u.id as uId FROM users u JOIN appointments a ON u.id = a.patientId AND u.tenantId = a.tenantId WHERE a.id = 'd7598415-2891-47e2-81a8-2f9d9e3aaf15'");
  console.log('Match with tenantId join:', exactRows);

  const [aRows] = await mysql.execute("SELECT tenantId, patientId FROM appointments WHERE id = 'd7598415-2891-47e2-81a8-2f9d9e3aaf15'");
  console.log('Appointment tenantId:', aRows);

  const [uRows] = await mysql.execute("SELECT id, tenantId FROM users WHERE id = '17b70b10-dac8-4f23-947f-7a6e588a7539'");
  console.log('User tenantId:', uRows);

  const [sRows] = await mysql.execute("SELECT id, tenantId FROM services WHERE id = 'f685b7fd-3265-4a3e-bda7-099872e2fe11'");
  console.log('Service tenantId:', sRows);

  process.exit(0);
}
run();
