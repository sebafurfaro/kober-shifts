import mysql from "./lib/mysql";

async function run() {
  const baseWhere = "a.tenantId = 'demo' AND s.price > 0";
  const listQuery = `
      SELECT 
          a.id as appointmentId,
          a.startAt as appointmentDate,
          a.status as appointmentStatus,
          s.name as serviceName,
          s.price as servicePrice,
          s.seniaPercent as seniaPercent,
          p.name as patientName,
          p.phone as patientPhone,
          p.email as patientEmail,
          mp.id as paymentRecordId,
          mp.amount as mpAmount,
          mp.status as mpStatus,
          mp.updatedAt as mpUpdatedAt,
          a.tenantId
      FROM appointments a
      INNER JOIN services s ON a.serviceId = s.id AND a.tenantId = s.tenantId
      INNER JOIN users p ON a.patientId = p.id AND a.tenantId = p.tenantId
      LEFT JOIN mercadopago_payments mp ON mp.appointmentId = a.id AND mp.tenantId = a.tenantId
      WHERE ${baseWhere}
      ORDER BY a.startAt DESC
      LIMIT 10 OFFSET 0
    `;
    
  const [rows] = await mysql.execute(listQuery);
  console.log(rows);

  process.exit(0);
}
run();
