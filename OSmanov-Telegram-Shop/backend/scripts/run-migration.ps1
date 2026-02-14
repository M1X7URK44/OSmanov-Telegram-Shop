# PowerShell скрипт для выполнения миграции промокодов

Write-Host "Выполнение миграции для добавления таблиц промокодов..." -ForegroundColor Green

# Читаем SQL файл и выполняем через docker exec
Get-Content backend/database/migration_add_promocodes.sql | docker exec -i postgres psql -U postgres -d gifts_app

Write-Host "Миграция завершена!" -ForegroundColor Green
