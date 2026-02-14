#!/bin/bash
# Скрипт для выполнения миграции промокодов на сервере
# Использование: ./migrate-promocodes-server.sh

set -e  # Остановить выполнение при ошибке

echo "🚀 Начало миграции промокодов..."

# Определяем имя контейнера PostgreSQL
# Если используется docker-compose, имя может быть другим
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-postgres}"

# Проверяем, существует ли контейнер
if ! docker ps -a --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}"; then
    echo "❌ Контейнер ${POSTGRES_CONTAINER} не найден!"
    echo "Доступные контейнеры:"
    docker ps -a --format '{{.Names}}'
    exit 1
fi

# Путь к файлу миграции
MIGRATION_FILE="$(dirname "$0")/../database/migration_add_promocodes.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Копирование файла миграции в контейнер..."
docker cp "$MIGRATION_FILE" "${POSTGRES_CONTAINER}:/tmp/migration_promocodes.sql"

echo "🔄 Выполнение миграции..."
docker exec "${POSTGRES_CONTAINER}" psql -U postgres -d gifts_app -f /tmp/migration_promocodes.sql

echo "✅ Миграция завершена успешно!"

# Очистка
docker exec "${POSTGRES_CONTAINER}" rm -f /tmp/migration_promocodes.sql

echo "✨ Готово!"
