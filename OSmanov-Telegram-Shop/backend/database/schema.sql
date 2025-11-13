-- Удаляем существующие таблицы (осторожно - удалит данные!)
DROP TABLE IF EXISTS purchases CASCADE;

DROP TABLE IF EXISTS transactions CASCADE;

DROP TABLE IF EXISTS users CASCADE;

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

-- Индексы
CREATE INDEX idx_users_telegram_id ON users (telegram_id);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_transactions_user_id ON transactions (user_id);

CREATE INDEX idx_purchases_user_id ON purchases (user_id);

CREATE INDEX idx_purchases_custom_id ON purchases (custom_id);

-- Тестовые данные (БЕЗ фиксированного ID)
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