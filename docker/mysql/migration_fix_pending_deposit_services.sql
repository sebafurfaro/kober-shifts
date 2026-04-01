-- =============================================================================
-- Corrección: turnos PENDING_DEPOSIT sin servicio de costo válido
-- Ejecutar en DBeaver (u otro cliente SQL) contra la base productiva o local.
-- =============================================================================
-- Qué corrige:
--   - serviceId NULL
--   - serviceId huérfano (no existe en services para ese tenant)
--   - servicio asociado con price <= 0
--
-- Asigna un servicio de respaldo del mismo tenant: price > 0, prioridad por
-- mayor seniaPercent, luego id.
--
-- Solo actualiza si el tenant tiene al menos un servicio con price > 0.
-- =============================================================================
-- Pasos en DBeaver:
--   1) Conectá al esquema correcto (o descomentá USE abajo).
--   2) Ejecutá solo el bloque "VISTA PREVIA" y revisá las filas.
--   3) Ejecutá el bloque "UPDATE" (opcional: dentro de transacción).
-- =============================================================================

-- Descomentá si tu conexión no fija el esquema por defecto:
-- USE kober_shifts;

-- ---------------------------------------------------------------------------
-- VISTA PREVIA — ejecutar primero
-- ---------------------------------------------------------------------------
SELECT
  a.id AS appointment_id,
  a.tenantId,
  a.serviceId,
  a.status,
  s.id AS joined_service_id,
  s.price AS service_price,
  s.name AS service_name
FROM appointments a
LEFT JOIN services s ON s.id = a.serviceId AND s.tenantId = a.tenantId
WHERE a.status = 'PENDING_DEPOSIT'
  AND (
    a.serviceId IS NULL
    OR s.id IS NULL
    OR COALESCE(s.price, 0) <= 0
  );

-- ---------------------------------------------------------------------------
-- UPDATE — ejecutar después de revisar la vista previa
-- Opcional: seleccioná solo este bloque y usá Ctrl+Enter (transacción manual)
-- ---------------------------------------------------------------------------
START TRANSACTION;

UPDATE appointments a
LEFT JOIN services s ON s.id = a.serviceId AND s.tenantId = a.tenantId
SET a.serviceId = (
  SELECT id FROM (
    SELECT s2.id FROM services s2
    WHERE s2.tenantId = a.tenantId AND s2.price > 0
    ORDER BY s2.seniaPercent DESC, s2.id
    LIMIT 1
  ) sub
)
WHERE a.status = 'PENDING_DEPOSIT'
  AND (
    a.serviceId IS NULL
    OR s.id IS NULL
    OR COALESCE(s.price, 0) <= 0
  )
  AND EXISTS (
    SELECT 1 FROM services s3
    WHERE s3.tenantId = a.tenantId AND s3.price > 0
  );

-- Si los resultados son correctos:
COMMIT;
-- Si algo falló o no querés guardar:
-- ROLLBACK;
