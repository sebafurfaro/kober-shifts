import mysql from 'mysql2/promise';

async function checkAppointment() {
  const appointmentId = "3e2a32c9-ffcc-459a-bfef-e60dd5e5dcab";
  
  // Crear una conexión única para esta consulta
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3309'),
    user: process.env.MYSQL_USER || 'kober_user',
    password: process.env.MYSQL_PASSWORD || 'kober_password',
    database: process.env.MYSQL_DATABASE || 'kober_shifts',
  });
  
  try {
    const [rows] = await connection.execute(
      "SELECT id, startAt, endAt, status, patientId, professionalId, locationId, specialtyId, notes FROM appointments WHERE id = ?",
      [appointmentId]
    );
    
    const result = rows as any[];
    
    if (result.length === 0) {
      console.log("❌ Turno no encontrado con ID:", appointmentId);
      return;
    }
    
    const appointment = result[0];
    
    console.log("✅ Turno encontrado:");
    console.log("ID:", appointment.id);
    console.log("Estado:", appointment.status);
    console.log("\n📅 Fechas almacenadas en la base de datos (formato MySQL DATETIME):");
    console.log("Fecha y hora de inicio (startAt):", appointment.startAt);
    console.log("Fecha y hora de fin (endAt):", appointment.endAt);
    
    // Convertir a Date objects para mostrar en diferentes formatos
    const startAt = new Date(appointment.startAt);
    const endAt = new Date(appointment.endAt);
    
    console.log("\n📅 Fechas interpretadas como objetos Date:");
    console.log("Inicio (ISO UTC):", startAt.toISOString());
    console.log("Fin (ISO UTC):", endAt.toISOString());
    console.log("Inicio (Buenos Aires - GMT-3):", startAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }));
    console.log("Fin (Buenos Aires - GMT-3):", endAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }));
    
    console.log("\n📋 Información adicional:");
    console.log("Paciente ID:", appointment.patientId);
    console.log("Profesional ID:", appointment.professionalId);
    console.log("Ubicación ID:", appointment.locationId);
    console.log("Especialidad ID:", appointment.specialtyId);
    if (appointment.notes) {
      console.log("Notas:", appointment.notes);
    }
    
  } catch (error) {
    console.error("❌ Error al consultar el turno:", error);
  } finally {
    await connection.end();
  }
}

checkAppointment().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

