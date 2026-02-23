-- Добавляем цены для Telegram Stars и Telegram Premium в таблицу admin_settings

ALTER TABLE admin_settings
    ADD COLUMN IF NOT EXISTS telegram_star_price_rub DECIMAL(10, 2) DEFAULT 1.00,
    ADD COLUMN IF NOT EXISTS telegram_premium_price_rub DECIMAL(10, 2) DEFAULT 399.00;

-- Обновляем существующую запись настроек, если она есть, заполняем значения по умолчанию
UPDATE admin_settings
SET
    telegram_star_price_rub = COALESCE(telegram_star_price_rub, 1.00),
    telegram_premium_price_rub = COALESCE(telegram_premium_price_rub, 399.00)
WHERE TRUE;

