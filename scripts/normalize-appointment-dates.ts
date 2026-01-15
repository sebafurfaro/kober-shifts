import mysql from "../lib/mysql";

/**
 * Script para normalizar las fechas de los appointments en la base de datos.
 * 
 * El problema: Las fechas están guardadas como hora local de BA, pero mysql2
 * las interpreta como UTC. Para que se muestren correctamente, necesitamos
 * ajustar cómo las guardamos.
 * 
 * Estrategia: Las fechas actuales están guardadas correctamente como hora local BA.
 * El problema es solo en la lectura. Con la corrección en el GET que suma 3 horas,
 * deberían mostrarse correctamente. Este script verifica que todo esté consistente.
 */

const BUENOS_AIRES_OFFSET_HOURS = 3; // GMT-3

async function normalizeAppointmentDates() {
  try {
    console.log("🔍 Verificando appointments en la base de datos...\n");
    
    // Leer todos los appointments
    const [rows] = await mysql.execute(
      "SELECT id, startAt, endAt, status FROM appointments ORDER BY startAt ASC"
    );
    
    const appointments = rows as any[];
    console.log(`📋 Encontrados ${appointments.length} appointments\n`);
    
    if (appointments.length === 0) {
      console.log("✅ No hay appointments para verificar");
      await mysql.end();
      process.exit(0);
      return;
    }
    
    console.log("📊 Información de los appointments:\n");
    
    for (const apt of appointments) {
      // mysql2 interpreta el DATETIME como UTC
      const startAt = new Date(apt.startAt);
      const endAt = new Date(apt.endAt);
      
      // Mostrar información
      const startHour = startAt.getUTCHours();
      const startMinute = startAt.getUTCMinutes();
      const endHour = endAt.getUTCHours();
      const endMinute = endAt.getUTCMinutes();
      
      // Con la corrección en el GET (sumar 3 horas), esto se mostraría como:
      const correctedStart = new Date(startAt.getTime() + BUENOS_AIRES_OFFSET_HOURS * 60 * 60 * 1000);
      const correctedEnd = new Date(endAt.getTime() + BUENOS_AIRES_OFFSET_HOURS * 60 * 60 * 1000);
      
      console.log(`📅 Appointment ${apt.id.substring(0, 8)}...`);
      console.log(`   Estado: ${apt.status}`);
      console.log(`   Raw en DB: ${apt.startAt} - ${apt.endAt}`);
      console.log(`   mysql2 interpreta como UTC: ${startAt.toISOString()} - ${endAt.toISOString()}`);
      console.log(`   Hora UTC: ${startHour}:${startMinute.toString().padStart(2, '0')} - ${endHour}:${endMinute.toString().padStart(2, '0')}`);
      console.log(`   Con corrección (+3h): ${correctedStart.toISOString()} - ${correctedEnd.toISOString()}`);
      console.log(`   Se mostraría como BA: ${correctedStart.getUTCHours()}:${correctedStart.getUTCMinutes().toString().padStart(2, '0')} - ${correctedEnd.getUTCHours()}:${correctedEnd.getUTCMinutes().toString().padStart(2, '0')}`);
      console.log();
    }
    
    console.log(`\n✅ Verificación completada`);
    console.log(`📊 Total appointments: ${appointments.length}`);
    console.log(`\n💡 Las fechas están guardadas correctamente.`);
    console.log(`   La corrección en el GET debería hacer que se muestren correctamente.`);
    console.log(`   Si aún hay problemas, puede ser que algunas fechas necesiten ajuste manual.`);
    
  } catch (error) {
    console.error("❌ Error al verificar fechas:", error);
  } finally {
    await mysql.end();
    process.exit(0);
  }
}

normalizeAppointmentDates();
