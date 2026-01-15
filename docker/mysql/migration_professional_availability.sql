-- Migración: Agregar campos de disponibilidad (días y horarios) a professional_profiles
-- Esta migración permite que un profesional configure sus días y horarios disponibles

-- Verificar si la columna availableDays existe antes de agregarla
SET @exist_availableDays := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'professional_profiles' 
    AND COLUMN_NAME = 'availableDays'
);

SET @sql_availableDays := IF(
  @exist_availableDays = 0,
  'ALTER TABLE professional_profiles ADD COLUMN availableDays JSON DEFAULT NULL COMMENT ''Días de la semana disponibles (0=Domingo, 1=Lunes, ..., 6=Sábado)''',
  'SELECT ''Columna availableDays ya existe'' AS message'
);

PREPARE stmt_availableDays FROM @sql_availableDays;
EXECUTE stmt_availableDays;
DEALLOCATE PREPARE stmt_availableDays;

-- Verificar si la columna availableHours existe antes de agregarla
SET @exist_availableHours := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'professional_profiles' 
    AND COLUMN_NAME = 'availableHours'
);

SET @sql_availableHours := IF(
  @exist_availableHours = 0,
  'ALTER TABLE professional_profiles ADD COLUMN availableHours JSON DEFAULT NULL COMMENT ''Horarios disponibles en formato JSON: {"start": "09:00", "end": "18:00"}''',
  'SELECT ''Columna availableHours ya existe'' AS message'
);

PREPARE stmt_availableHours FROM @sql_availableHours;
EXECUTE stmt_availableHours;
DEALLOCATE PREPARE stmt_availableHours;
