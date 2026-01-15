-- Migración: agregar campo color a professional_profiles
USE kober_shifts;

ALTER TABLE professional_profiles
  ADD COLUMN color VARCHAR(7) NULL COMMENT 'Color en formato hexadecimal (ej: #FF5733)';

