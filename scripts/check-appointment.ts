import mysql from "../lib/mysql";

async function checkAppointment() {
  const appointmentId = "3e2a32c9-ffcc-459a-bfef-e60dd5e5dcab";
  
  try {
    const [rows] = await mysql.execute(
      "SELECT id, startAt, endAt, status, patientId, professionalId, locationId, specialtyId FROM appointments WHERE id = ?",
      [appointmentId]
    );
    
    const result = rows as any[];
    
    if (result.length === 0) {
      console.log("❌ Turno no encontrado con ID:", appointmentId);
      await mysql.end();
      process.exit(0);
      return;
    }
    
    const appointment = result[0];
    
    console.log("✅ Turno encontrado:");
    console.log("ID:", appointment.id);
    console.log("Estado:", appointment.status);
    console.log("\n📅 Fechas almacenadas en la base de datos:");
    console.log("Fecha y hora de inicio (startAt):", appointment.startAt);
    console.log("Fecha y hora de fin (endAt):", appointment.endAt);
    
    // Convertir a Date objects para mostrar en diferentes formatos
    const startAt = new Date(appointment.startAt);
    const endAt = new Date(appointment.endAt);
    
    console.log("\n📅 Fechas formateadas:");
    console.log("Inicio (ISO):", startAt.toISOString());
    console.log("Fin (ISO):", endAt.toISOString());
    console.log("Inicio (Buenos Aires):", startAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }));
    console.log("Fin (Buenos Aires):", endAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }));
    
    console.log("\n📋 Información adicional:");
    console.log("Paciente ID:", appointment.patientId);
    console.log("Profesional ID:", appointment.professionalId);
    console.log("Ubicación ID:", appointment.locationId);
    console.log("Especialidad ID:", appointment.specialtyId);
    
  } catch (error) {
    console.error("❌ Error al consultar el turno:", error);
  } finally {
    await mysql.end();
    process.exit(0);
  }
}

checkAppointment();

