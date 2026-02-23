#!/bin/bash
# Скрипт для выполнения миграции веб-авторизации на сервере
# Использование: ./migrate-web-auth-server.sh

set -e

echo "🚀 Начало миграции веб-авторизации..."

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-osmanov-telegram-shop-postgres-1}"
DB_NAME="${DB_NAME:-gifts_app}"
MIGRATION_FILE="$(dirname "$0")/../database/migration_add_web_auth.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}"; then
    echo "⚠️  Контейнер ${POSTGRES_CONTAINER} не запущен!"
    exit 1
fi

echo "📋 Выполнение миграции..."
docker cp "$MIGRATION_FILE" "${POSTGRES_CONTAINER}:/tmp/migration_web_auth.sql"
docker exec "${POSTGRES_CONTAINER}" psql -U postgres -d "${DB_NAME}" -f /tmp/migration_web_auth.sql
docker exec "${POSTGRES_CONTAINER}" rm -f /tmp/migration_web_auth.sql

echo "✅ Миграция веб-авторизации завершена!"
