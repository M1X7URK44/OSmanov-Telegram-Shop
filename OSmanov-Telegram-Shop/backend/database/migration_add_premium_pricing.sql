-- Добавляем отдельные цены для Telegram Premium (3, 6, 12 месяцев)

ALTER TABLE admin_settings
    ADD COLUMN IF NOT EXISTS telegram_premium_3m_price_rub DECIMAL(10, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS telegram_premium_6m_price_rub DECIMAL(10, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS telegram_premium_12m_price_rub DECIMAL(10, 2) DEFAULT NULL;

-- Обновляем существующую запись настроек, если она есть, заполняем значения по умолчанию
-- Если telegram_premium_price_rub установлен, используем его для расчета
UPDATE admin_settings
SET
    telegram_premium_3m_price_rub = COALESCE(telegram_premium_3m_price_rub, telegram_premium_price_rub * 3),
    telegram_premium_6m_price_rub = COALESCE(telegram_premium_6m_price_rub, telegram_premium_price_rub * 6),
    telegram_premium_12m_price_rub = COALESCE(telegram_premium_12m_price_rub, telegram_premium_price_rub * 12)
WHERE telegram_premium_price_rub IS NOT NULL;
