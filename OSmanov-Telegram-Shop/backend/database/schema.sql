-- Таблица пользователей
CREATE TABLE
    users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        photo_url TEXT,
        password_hash VARCHAR(255),
        balance DECIMAL(15, 2) DEFAULT 0.00,
        total_spent DECIMAL(15, 2) DEFAULT 0.00,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблица администраторов
CREATE TABLE
    admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin', 'superadmin')) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблица настроек администратора
CREATE TABLE
    admin_settings (
        id SERIAL PRIMARY KEY,
        usd_to_rub_rate DECIMAL(10, 2) NOT NULL DEFAULT 90.00,
        min_deposit_amount DECIMAL(15, 2) DEFAULT 100.00,
        max_deposit_amount DECIMAL(15, 2) DEFAULT 100000.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES admin_users (id) ON DELETE SET NULL
    );

-- Таблица транзакций
CREATE TABLE
    transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        type VARCHAR(20) CHECK (type IN ('deposit', 'withdrawal', 'purchase')),
        status VARCHAR(20) CHECK (
            status IN ('pending', 'completed', 'failed', 'cancelled')
        ),
        payment_method VARCHAR(50),
        payment_details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблица покупок
CREATE TABLE
    purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        custom_id VARCHAR(100),
        service_id INTEGER,
        service_name VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 1,
        amount DECIMAL(15, 2) NOT NULL,
        total_price DECIMAL(15, 2),
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(20) CHECK (status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
        pins JSONB,
        data TEXT,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Создаем начальные настройки
INSERT INTO
    admin_settings (
        usd_to_rub_rate,
        min_deposit_amount,
        max_deposit_amount,
        updated_by
    )
VALUES
    (90.00, 100.00, 100000.00, 1) ON CONFLICT (id) DO NOTHING;

-- Тестовые данные пользователя (БЕЗ фиксированного ID)
INSERT INTO
    users (
        telegram_id,
        username,
        email,
        first_name,
        last_name,
        balance,
        total_spent
    )
VALUES
    (
        123456789,
        'djosmanov',
        'djosmanov@example.com',
        'Daniil',
        'Osmanov',
        100000.00,
        0.00
    ) ON CONFLICT (telegram_id) DO
UPDATE
SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    balance = EXCLUDED.balance,
    total_spent = EXCLUDED.total_spent,
    updated_at = CURRENT_TIMESTAMP;

-- Индексы для users
CREATE INDEX idx_users_telegram_id ON users (telegram_id);

CREATE INDEX idx_users_email ON users (email);

-- Индексы для admin_users
CREATE INDEX idx_admin_users_username ON admin_users (username);

CREATE INDEX idx_admin_users_email ON admin_users (email);

CREATE INDEX idx_admin_users_role ON admin_users (role);

CREATE INDEX idx_admin_users_is_active ON admin_users (is_active);

-- Индексы для admin_settings
CREATE INDEX idx_admin_settings_updated_at ON admin_settings (updated_at);

-- Индексы для транзакций и покупок
CREATE INDEX idx_transactions_user_id ON transactions (user_id);

CREATE INDEX idx_purchases_user_id ON purchases (user_id);

CREATE INDEX idx_purchases_custom_id ON purchases (custom_id);

-- Таблица промокодов
CREATE TABLE
    promocodes (
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

-- Таблица использования промокодов
CREATE TABLE
    promocode_usage (
        id SERIAL PRIMARY KEY,
        promocode_id INTEGER REFERENCES promocodes (id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(promocode_id, user_id)
    );

-- Индексы для промокодов
CREATE INDEX idx_promocodes_code ON promocodes (code);
CREATE INDEX idx_promocodes_type ON promocodes (type);
CREATE INDEX idx_promocodes_is_active ON promocodes (is_active);
CREATE INDEX idx_promocode_usage_promocode_id ON promocode_usage (promocode_id);
CREATE INDEX idx_promocode_usage_user_id ON promocode_usage (user_id);

-- Проверяем создание таблиц
SELECT
    table_name,
    table_type
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
ORDER BY
    table_name;