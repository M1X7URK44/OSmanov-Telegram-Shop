-- Миграция для добавления поля pwa_instruction_shown в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pwa_instruction_shown BOOLEAN DEFAULT FALSE;

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_pwa_instruction_shown ON users (pwa_instruction_shown);
