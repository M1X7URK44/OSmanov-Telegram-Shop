-- Таблица пользователей
CREATE TABLE
    IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        total_spent DECIMAL(15, 2) DEFAULT 0.00,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблица транзакций
CREATE TABLE
    IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users (id),
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
    IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users (id),
        service_id INTEGER,
        service_name VARCHAR(255) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(20) CHECK (status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases (user_id);

-- Тестовые данные
INSERT INTO
    users (
        id,
        username,
        email,
        password_hash,
        balance,
        total_spent
    )
VALUES
    (
        1,
        'djosmanov',
        'djosmanov@example.com',
        'hashed_password',
        100000.00,
        0.00
    ) ON CONFLICT (id) DO
UPDATE
SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    balance = EXCLUDED.balance,
    total_spent = EXCLUDED.total_spent;

-- INSERT INTO
--     purchases (
--         user_id,
--         service_id,
--         service_name,
--         amount,
--         currency,
--         status,
--         purchase_date
--     )
-- VALUES
--     (
--         1,
--         1,
--         'Steam Gift Card $50',
--         4500.00,
--         'USD',
--         'completed',
--         '2024-03-15 14:30:00'
--     ),
--     (
--         1,
--         2,
--         'PlayStation Network $20',
--         1800.00,
--         'USD',
--         'completed',
--         '2024-03-10 10:15:00'
--     ),
--     (
--         1,
--         3,
--         'Xbox Live Gold 3 Months',
--         2500.00,
--         'USD',
--         'completed',
--         '2024-03-05 16:45:00'
--     ),
--     (
--         1,
--         4,
--         'Spotify Premium 1 Year',
--         12000.00,
--         'USD',
--         'completed',
--         '2024-02-28 09:20:00'
--     ),
--     (
--         1,
--         5,
--         'Netflix Gift Card $30',
--         2700.00,
--         'USD',
--         'completed',
--         '2024-02-20 11:30:00'
--     ) ON CONFLICT DO NOTHING;