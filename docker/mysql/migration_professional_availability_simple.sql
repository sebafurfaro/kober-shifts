-- Migración: Agregar campos de disponibilidad (días y horarios) a professional_profiles
-- Esta migración permite que un profesional configure sus días y horarios disponibles
-- Versión simplificada para ejecutar directamente en MySQL

-- Agregar columna availableDays si no existe
ALTER TABLE professional_profiles 
ADD COLUMN availableDays JSON DEFAULT NULL COMMENT 'Días de la semana disponibles (0=Domingo, 1=Lunes, ..., 6=Sábado)';

-- Agregar columna availableHours si no existe  
ALTER TABLE professional_profiles 
ADD COLUMN availableHours JSON DEFAULT NULL COMMENT 'Horarios disponibles en formato JSON: {"start": "09:00", "end": "18:00"}';
