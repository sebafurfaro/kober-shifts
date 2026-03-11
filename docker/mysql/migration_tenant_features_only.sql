-- Crear solo la tabla tenant_features si no existe (features, límites y uso por tenant).
USE kober_shifts;

CREATE TABLE IF NOT EXISTS tenant_features (
  tenantId VARCHAR(255) PRIMARY KEY,
  features JSON,
  limits JSON,
  `usage` JSON,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
