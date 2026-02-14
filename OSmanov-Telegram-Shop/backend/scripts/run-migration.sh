#!/bin/bash
# Скрипт для выполнения миграции промокодов

echo "Выполнение миграции для добавления таблиц промокодов..."

# Выполняем миграцию через docker exec
docker exec -i postgres psql -U postgres -d gifts_app < backend/database/migration_add_promocodes.sql

echo "Миграция завершена!"
