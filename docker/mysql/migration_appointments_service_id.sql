-- Servicio asociado al turno (para mostrar nombre, precio y seña en la sección Turnos).
-- Ejecutar: docker exec -i kober-shifts-mysql-1 mysql -u root -proot_password kober_shifts < docker/mysql/migration_appointments_service_id.sql
USE kober_shifts;

ALTER TABLE appointments
  ADD COLUMN serviceId VARCHAR(255) NULL AFTER specialtyId;
