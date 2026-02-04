-- Los turnos en estado PENDING_DEPOSIT (pendiente de seña) deben tener el servicio con costo y seña,
-- no el gratuito. Corrige los que quedaron con el servicio sin costo.
-- Ejecutar: docker exec -i kober-shifts-mysql-1 mysql -u root -proot_password kober_shifts < docker/mysql/migration_appointments_pending_deposit_service.sql
USE kober_shifts;

UPDATE appointments a
INNER JOIN services s_current ON s_current.id = a.serviceId AND s_current.tenantId = a.tenantId AND s_current.price = 0
SET a.serviceId = (
  SELECT id FROM (
    SELECT s2.id FROM services s2
    WHERE s2.tenantId = a.tenantId AND s2.price > 0
    ORDER BY s2.seniaPercent DESC, s2.id
    LIMIT 1
  ) sub
)
WHERE a.status = 'PENDING_DEPOSIT';
