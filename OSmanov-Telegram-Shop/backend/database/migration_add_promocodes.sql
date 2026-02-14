-- Миграция: Добавление таблиц промокодов
-- Этот скрипт добавляет таблицы promocodes и promocode_usage в существующую базу данных

-- Проверяем, существует ли таблица promocodes, и создаем её, если нет
CREATE TABLE IF NOT EXISTS promocodes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('balance', 'discount')) NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    -- Для balance: сумма начисления в USD
    -- Для discount: процент скидки (0-100)
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES admin_users (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Проверяем, существует ли таблица promocode_usage, и создаем её, если нет
CREATE TABLE IF NOT EXISTS promocode_usage (
    id SERIAL PRIMARY KEY,
    promocode_id INTEGER REFERENCES promocodes (id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(promocode_id, user_id)
);

-- Создаем индексы, если их еще нет
CREATE INDEX IF NOT EXISTS idx_promocodes_code ON promocodes (code);
CREATE INDEX IF NOT EXISTS idx_promocodes_type ON promocodes (type);
CREATE INDEX IF NOT EXISTS idx_promocodes_is_active ON promocodes (is_active);
CREATE INDEX IF NOT EXISTS idx_promocode_usage_promocode_id ON promocode_usage (promocode_id);
CREATE INDEX IF NOT EXISTS idx_promocode_usage_user_id ON promocode_usage (user_id);
