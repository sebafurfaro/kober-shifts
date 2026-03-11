-- Crear tablas tenant_settings y tenant_payments en MySQL si no existen.
-- Necesarias para que Admin > Ajustes / Detalles / WhatsApp persistan correctamente.
USE kober_shifts;

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenantId VARCHAR(255) PRIMARY KEY,
  settings JSON,
  permissions JSON,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_payments (
  tenantId VARCHAR(255) PRIMARY KEY,
  settings JSON,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
