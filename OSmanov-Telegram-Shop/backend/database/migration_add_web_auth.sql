-- Миграция для веб-аутентификации (телефон/email)

-- Добавляем колонку phone для пользователей с авторизацией по телефону
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

-- Добавляем тип авторизации: telegram, phone, email
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) DEFAULT 'telegram';

-- Таблица кодов верификации для SMS и Email
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('phone', 'email')) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_verification_codes_identifier ON verification_codes (identifier);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes (expires_at);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_auth_type ON users (auth_type);
