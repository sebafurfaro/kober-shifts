-- Permite que un profesional no tenga especialidad asignada (opcional)
ALTER TABLE professional_profiles MODIFY COLUMN specialtyId VARCHAR(255) NULL;
