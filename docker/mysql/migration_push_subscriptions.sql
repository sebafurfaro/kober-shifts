-- Web Push: una suscripción por usuario y tenant (último dispositivo / navegador que se suscribe).
-- Ejecutar en producción antes o junto al deploy que usa /api/.../push/subscribe

USE kober_shifts;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(36) NOT NULL,
  tenantId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  expirationTime BIGINT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_push_tenant_user (tenantId, userId),
  KEY idx_push_tenant (tenantId),
  KEY idx_push_user (userId),
  CONSTRAINT fk_push_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_push_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
