import os

from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')

if os.path.exists(dotenv_path):
    try:
        load_dotenv(dotenv_path)
        ACCESS_TOKEN = os.environ.get('ACCESS_TOKEN')
        # Загрузка списка админов из .env (формат: ADMIN_IDS=123456789,987654321)
        admin_ids_str = os.environ.get('ADMIN_IDS', '')
        if admin_ids_str:
            ADMIN_IDS = [int(admin_id.strip()) for admin_id in admin_ids_str.split(',') if admin_id.strip().isdigit()]
        else:
            ADMIN_IDS = []
        
        # Загрузка параметров PostgreSQL
        # Если бот запускается на хосте (вне Docker): DB_HOST=localhost или 127.0.0.1
        # Если бот запускается в Docker (в docker-compose): DB_HOST=postgres (имя сервиса из docker-compose.yml)
        DB_USER = os.environ.get('DB_USER', 'postgres')
        DB_HOST = os.environ.get('DB_HOST', 'localhost')
        DB_NAME = os.environ.get('DB_NAME', 'gifts_app')
        DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
        DB_PORT = os.environ.get('DB_PORT', '5432')
    except Exception as e:
        print(f'[ERROR] load .env file - {e}')
        ADMIN_IDS = []
        DB_USER = 'postgres'
        DB_HOST = 'localhost'
        DB_NAME = 'gifts_app'
        DB_PASSWORD = ''
        DB_PORT = '5432'
else:
    raise BaseException('.env file not found!')
