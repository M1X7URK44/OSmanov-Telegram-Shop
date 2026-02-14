# PowerShell скрипт для выполнения миграции промокодов на сервере
# Использование: .\migrate-promocodes-server.ps1

param(
    [string]$PostgresContainer = "postgres"
)

Write-Host "🚀 Начало миграции промокодов..." -ForegroundColor Green

# Проверяем, существует ли контейнер
$containerExists = docker ps -a --format '{{.Names}}' | Select-String -Pattern "^${PostgresContainer}$"

if (-not $containerExists) {
    Write-Host "❌ Контейнер ${PostgresContainer} не найден!" -ForegroundColor Red
    Write-Host "Доступные контейнеры:" -ForegroundColor Yellow
    docker ps -a --format '{{.Names}}'
    exit 1
}

# Путь к файлу миграции
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationFile = Join-Path $scriptPath "..\database\migration_add_promocodes.sql"
$migrationFile = Resolve-Path $migrationFile

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Файл миграции не найден: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Копирование файла миграции в контейнер..." -ForegroundColor Cyan
docker cp $migrationFile "${PostgresContainer}:/tmp/migration_promocodes.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при копировании файла" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Выполнение миграции..." -ForegroundColor Cyan
docker exec $PostgresContainer psql -U postgres -d gifts_app -f /tmp/migration_promocodes.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при выполнении миграции" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Миграция завершена успешно!" -ForegroundColor Green

# Очистка
docker exec $PostgresContainer rm -f /tmp/migration_promocodes.sql

Write-Host "✨ Готово!" -ForegroundColor Green
