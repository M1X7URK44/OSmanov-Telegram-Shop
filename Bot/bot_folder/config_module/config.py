import os

from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')

if os.path.exists(dotenv_path):
    try:
        load_dotenv(dotenv_path)
        ACCESS_TOKEN = os.environ.get('ACCESS_TOKEN')
    except Exception as e:
        print(f'[ERROR] load .env file - {e}')
else:
    raise BaseException('.env file not found!')
