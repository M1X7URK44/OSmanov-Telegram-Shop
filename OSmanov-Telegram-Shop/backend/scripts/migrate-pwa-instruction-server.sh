#!/bin/bash
# Скрипт для выполнения миграции PWA инструкции на сервере
# Использование: ./migrate-pwa-instruction-server.sh

set -e  # Остановить выполнение при ошибке

echo "🚀 Начало миграции PWA инструкции..."

# Определяем имя контейнера PostgreSQL
# Если используется docker-compose, имя может быть другим
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-osmanov-telegram-shop-postgres-1}"

# Проверяем, существует ли контейнер и запущен ли он
if ! docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}"; then
    echo "⚠️  Контейнер ${POSTGRES_CONTAINER} не запущен!"
    echo "Доступные запущенные контейнеры:"
    docker ps --format '{{.Names}}'
    echo ""
    echo "Попытка найти контейнер среди остановленных..."
    if docker ps -a --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}"; then
        echo "✅ Контейнер найден, но остановлен. Запускаем..."
        docker start "${POSTGRES_CONTAINER}"
        echo "⏳ Ожидание готовности PostgreSQL..."
        sleep 5
    else
        echo "❌ Контейнер ${POSTGRES_CONTAINER} не найден!"
        echo "Доступные контейнеры:"
        docker ps -a --format '{{.Names}}'
        exit 1
    fi
fi

# Путь к файлу миграции
MIGRATION_FILE="$(dirname "$0")/../database/migration_add_pwa_instruction.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

# Получаем имя БД из переменных окружения или используем значение по умолчанию
DB_NAME="${DB_NAME:-gifts_app}"

echo "📋 Копирование файла миграции в контейнер..."
docker cp "$MIGRATION_FILE" "${POSTGRES_CONTAINER}:/tmp/migration_pwa_instruction.sql"

echo "🔄 Выполнение миграции в базе данных ${DB_NAME}..."
docker exec "${POSTGRES_CONTAINER}" psql -U postgres -d "${DB_NAME}" -f /tmp/migration_pwa_instruction.sql

echo "✅ Миграция завершена успешно!"

# Очистка
docker exec "${POSTGRES_CONTAINER}" rm -f /tmp/migration_pwa_instruction.sql

echo "✨ Готово!"
