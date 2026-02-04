-- Asigna el servicio sin costo a los turnos que aún no tienen serviceId.
-- Se asume: un servicio con price = 0 (sin costo) y otro con price > 0 y seña.
-- Ejecutar: docker exec -i kober-shifts-mysql-1 mysql -u root -proot_password kober_shifts < docker/mysql/migration_appointments_backfill_service.sql
USE kober_shifts;

UPDATE appointments a
SET a.serviceId = (
  SELECT id FROM (
    SELECT id FROM services s
    WHERE s.tenantId = a.tenantId AND s.price = 0
    ORDER BY s.id
    LIMIT 1
  ) sub
)
WHERE a.serviceId IS NULL;
