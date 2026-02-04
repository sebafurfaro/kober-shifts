-- Guardar nombre del paciente en el turno al crearlo (para listado y visibilidad).
-- Ejecutar una vez: docker exec -i kober-shifts-mysql-1 mysql -u root -proot_password kober_shifts < docker/mysql/migration_appointments_patient_name.sql
USE kober_shifts;

ALTER TABLE appointments
  ADD COLUMN patientFirstName VARCHAR(255) NULL AFTER notes,
  ADD COLUMN patientLastName VARCHAR(255) NULL AFTER patientFirstName;
