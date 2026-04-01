-- =============================================================================
-- Kober Shifts — mercadopago_payments: charset/collation utf8mb4_unicode_ci
-- Mismo archivo para: local, Docker, Railway (u otro MySQL 8).
--
-- Ejecutá SOLO sobre la base de datos del proyecto (no incluye USE).
-- Local (CLI):  mysql -h HOST -P PUERTO -u USUARIO -p NOMBRE_BASE < este_archivo.sql
-- DBeaver / Railway: conectá a la base y ejecutá el archivo completo.
--
-- Evita: Illegal mix of collations (utf8mb4_0900_ai_ci vs utf8mb4_unicode_ci) en JOINs.
-- Idempotente: CREATE IF NOT EXISTS + CONVERT en tablas ya existentes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS mercadopago_payments (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(255) NOT NULL,
  appointmentId VARCHAR(36) NOT NULL,
  mpPaymentId VARCHAR(255) NULL,
  mpPreferenceId VARCHAR(255) NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mp_payments_tenant (tenantId),
  INDEX idx_mp_payments_appointment (appointmentId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE mercadopago_payments CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
