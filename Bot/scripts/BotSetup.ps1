# Создание структуры папок
New-Item -Path . -Name "bot_folder" -ItemType Directory
New-Item -Path .\bot_folder -Name "restart_module" -ItemType Directory
New-Item -Path .\bot_folder -Name "logger_system" -ItemType Directory
New-Item -Path .\bot_folder -Name "keyboard_module" -ItemType Directory
New-Item -Path .\bot_folder -Name "functions_module" -ItemType Directory
New-Item -Path .\bot_folder -Name "db_module" -ItemType Directory
New-Item -Path .\bot_folder -Name "config_module" -ItemType Directory

# 1) restart_module
Set-Content -Path .\bot_folder\restart_module\restart_bot.py -Value @"
import os
import sys
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BOT_SCRIPT = 'bot_folder/bot.py'
bot_process = None

class BotRestartHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global bot_process

        if '__pycache__' in event.src_path:
            return
        
        if event.src_path.endswith('.py'):
            print(f"Detected changes in {event.src_path}. Restarting bot...")
            if bot_process:
                try:
                    bot_process.terminate()
                    bot_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    bot_process.kill()
                except Exception as e:
                    print(f"Error terminating bot process: {e}")
            
            bot_process = subprocess.Popen([sys.executable, BOT_SCRIPT])


def run():
    global bot_process
    bot_process = subprocess.Popen([sys.executable, BOT_SCRIPT])

    event_handler = BotRestartHandler()
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

    if bot_process:
        try:
            bot_process.terminate()
            bot_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            bot_process.kill()
        except Exception as e:
            print(f"Error terminating bot process: {e}")


if __name__ == "__main__":
    run()
"@

# 2) logger_system
Set-Content -Path .\bot_folder\logger_system\__init__.py -Value @"
import logging, sys

# Logging settings
logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
"@

# 3) keyboard_module
Set-Content -Path .\bot_folder\keyboard_module\keyboard.py -Value @"
from telebot import types

def none():
    return types.ReplyKeyboardRemove()


def create_keyboard(btn_lines):
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    for line in btn_lines:
        btn_arr = []
        for name in line:
            btn_arr.append(types.KeyboardButton(text=name))
        keyboard.add(*btn_arr)
    return keyboard


def create_inline_keyboard(btn_lines):
    keyboard = types.InlineKeyboardMarkup(row_width=7)
    for line in btn_lines:
        btn_arr = []
        for name, data in line:
            btn_arr.append(types.InlineKeyboardButton(text=name, callback_data=data))
        keyboard.add(*btn_arr)
    return keyboard


def back():
    return create_keyboard([
        ['<< Назад']
    ])
"@

# 4) functions_module
Set-Content -Path .\bot_folder\functions_module\config.py -Value @"
TEXTS_ROOT = './texts'
MEDIA_ROOT = './images'
"@

Set-Content -Path .\bot_folder\functions_module\functions.py -Value @"
import functions_module.config as config
import os
import html


def get_text(filename: str, **kwargs) -> str:
    """
    Get text from the 'filename' file.\n
    If you have  in the file's text,\n
    you can add value by adding **kwags with  name:
    "variable = ..."

    :param filename:
    :type :obj:`str`

    :return: text from the file
    :rtype: :obj:`str`
    """

    filepath = os.path.join(config.TEXTS_ROOT, filename)
    if not os.path.exists:
        raise BaseException('No such file or directory')
    
    # Get text from 'filename' file
    with open(filepath, 'r', encoding='utf-8') as file:
        text = file.read()
    
    # Replace all 'kwarks' in the file's text
    for kwarg, value in kwargs.items():
        if value == None:
            value = ''
        text = text.replace(f'${kwarg.upper()}', str(value), 1)

    return text


def get_media(filename: str, **kwargs) -> bytes:
    """
    Get media-file (photo, video, etc.) from the 'filename' file.

    :param filename:
    :type :obj:`str`

    :return: Bytes of the file
    :rtype: :obj:`str`
    """

    filepath = os.path.join(config.MEDIA_ROOT, filename)
    if not os.path.exists:
        raise BaseException('No such file or directory')
    
    # Get bytes of the 'filename' file
    with open(filepath, 'rb') as file:
        file_bytes = file.read()

    return file_bytes


def escape_text_html(text: str) -> str:
    """
    Replace special characters "&", "<" and ">" to HTML-safe sequences.

    :param text:
    :type :obj:`str`

    :return: Escaped text
    :rtype: :obj:`str`
    """
    if text is None:
        return ''
    return html.escape(text)


def is_num(x):
    try:
        x = float(x)
        return True
    except:
        return False
    

def is_int(x):
    try:
        return float(x) == int(x)
    except:
        return False


def create_file(filename: str, 
                text: str) -> bytes:
    """
    Generate file with name = 'filename' and file-date = 'text'

    Args:
        filename (str): Name of the file
        text (str): File's text data

    Returns:
        bytes: Text file
    """

    # Write to file
    with open(filename, 'w', encoding='utf-8') as file:
        file.write(text)
    
    # Get bytes from file
    res_bytes = bytes()
    with open(filename, 'rb') as file:
        res_bytes = file.read()

    os.remove(filename)
    return res_bytes
"@

# 5) db_module
Set-Content -Path .\bot_folder\db_module\config.py -Value @"
DB_NAME = 'sql_db'
DB_TABLE_NAME = 'main_table'
"@

Set-Content -Path .\bot_folder\db_module\db.py -Value @"
import sqlite3
import json
from contextlib import closing
from db_module.config import DB_NAME, DB_TABLE_NAME
import os

class Database:
    def __init__(self, db_name=DB_NAME):
        self.db_name = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            db_name
        )

    def _execute(self, query, params=None):
        """Helper method for executing SQL queries."""
        with closing(sqlite3.connect(self.db_name)) as conn:
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            conn.commit()
            return cursor

    def create_table(self, table_name=DB_TABLE_NAME):
        """Creates a table with the specified name."""
        query = f"""CREATE TABLE {table_name} (
                    data TEXT NOT NULL
                );"""
        self._execute(query)

    def delete_table(self, table_name=DB_TABLE_NAME):
        """Deletes the table with the specified name if it exists."""
        query = f"DROP TABLE IF EXISTS {table_name};"
        self._execute(query)

    def is_exists(self, table_name=DB_TABLE_NAME):
        """Checks if a table with the specified name exists."""
        query = f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';"
        with closing(sqlite3.connect(self.db_name)) as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            return cursor.fetchone() is not None

    def put_to_base(self, data, table_name=DB_TABLE_NAME):
        """Saves data to the table. If the table exists, it is cleared, and new data is inserted."""
        if not self.is_exists(table_name=table_name):
            self.create_table(table_name=table_name)
        data = json.dumps(data, ensure_ascii=False).replace("'", '`')
        self._execute(f"DELETE FROM {table_name};")
        query = f"INSERT INTO {table_name} (data) VALUES (?);"
        self._execute(query, (data,))

    def get_from_base(self, table_name=DB_TABLE_NAME):
        """Retrieves data from the table. If the table is empty or does not exist, returns None."""
        try:
            query = f"SELECT * FROM {table_name};"
            with closing(sqlite3.connect(self.db_name)) as conn:
                cursor = conn.cursor()
                cursor.execute(query)
                data = cursor.fetchall()
            if len(data) == 0:
                return data
            else:
                return json.loads(data[0][0])
        except sqlite3.OperationalError:
            return None
"@

# 6) config_module
New-Item -Path .\bot_folder\config_module -Name ".env" -ItemType File
Set-Content -Path .\bot_folder\config_module\.env -Value "ACCESS_TOKEN ="

Set-Content -Path .\bot_folder\config_module\config.py -Value @"
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
"@

# Создаем основной файл бота
Set-Content -Path .\bot_folder\bot.py -Value @"
import config_module.config as config
from telebot import TeleBot


class Bot:
    def __init__(self):
        self.bot = TeleBot(token=config.ACCESS_TOKEN)
    
    def run(self):

        @self.bot.message_handler(commands=['start'])
        def start_cmd(message):
            self.bot.send_message(chat_id=message.chat.id,
                                  text='Hello World!')

        self.bot.infinity_polling()
    

def main():
    bot = Bot()
    bot.run()


if __name__ == '__main__':
    main()
"@

Write-Host "Структура проекта успешно создана!"