-- Add googleId column to users table
ALTER TABLE users ADD COLUMN googleId VARCHAR(255) UNIQUE AFTER email;
