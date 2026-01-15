-- Migración: Crear tabla de relación many-to-many entre profesionales y especialidades
-- Esta migración permite que un profesional tenga múltiples especialidades

CREATE TABLE IF NOT EXISTS professional_specialties (
  userId VARCHAR(255) NOT NULL,
  specialtyId VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userId, specialtyId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (specialtyId) REFERENCES specialties(id) ON DELETE CASCADE,
  INDEX idx_user (userId),
  INDEX idx_specialty (specialtyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar datos existentes de professional_profiles a professional_specialties
INSERT INTO professional_specialties (userId, specialtyId)
SELECT pp.userId, pp.specialtyId 
FROM professional_profiles pp
WHERE pp.specialtyId IS NOT NULL AND pp.specialtyId != ''
ON DUPLICATE KEY UPDATE professional_specialties.specialtyId = professional_specialties.specialtyId;
