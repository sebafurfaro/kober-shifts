-- Migration: Add DNI, coverage and plan fields to users table for patients
-- Date: 2026-01-23

USE kober_shifts;

-- Add new fields to users table
ALTER TABLE users 
  ADD COLUMN dni VARCHAR(50) NULL AFTER address,
  ADD COLUMN coverage VARCHAR(255) NULL AFTER dni,
  ADD COLUMN plan VARCHAR(255) NULL AFTER coverage;

-- All new fields are nullable to maintain backward compatibility with existing data
