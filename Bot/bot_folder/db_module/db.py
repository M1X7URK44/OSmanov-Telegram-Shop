import sqlite3
import json
from contextlib import closing
from db_module.config import DB_NAME, DB_TABLE_NAME
import os
import psycopg2
from psycopg2 import OperationalError
import config_module.config as config

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
        data = json.dumps(data, ensure_ascii=False).replace("'", '')
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

    def create_users_table(self, table_name='users'):
        """Creates a table for storing user IDs."""
        query = f"""CREATE TABLE IF NOT EXISTS {table_name} (
                    user_id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );"""
        self._execute(query)

    def _get_postgres_connection(self):
        """Создает подключение к PostgreSQL."""
        try:
            conn = psycopg2.connect(
                host=config.DB_HOST,
                database=config.DB_NAME,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                port=config.DB_PORT,
                connect_timeout=10
            )
            return conn
        except OperationalError as e:
            print(f'[ERROR] PostgreSQL connection failed: {e}')
            print(f'[INFO] Connection params: host={config.DB_HOST}, port={config.DB_PORT}, db={config.DB_NAME}, user={config.DB_USER}')
            print(f'[INFO] Если бот запускается на хосте, используйте DB_HOST=localhost')
            print(f'[INFO] Если бот запускается в Docker, используйте DB_HOST=postgres (имя сервиса из docker-compose.yml)')
            raise
        except Exception as e:
            print(f'[ERROR] PostgreSQL connection failed: {e}')
            raise

    def add_user(self, user_id, username=None, first_name=None, table_name='users'):
        """Добавляет пользователя в PostgreSQL базу данных, если его там нет."""
        try:
            conn = self._get_postgres_connection()
            cursor = conn.cursor()
            
            # Проверяем, существует ли пользователь с таким telegram_id
            cursor.execute(
                "SELECT telegram_id FROM users WHERE telegram_id = %s;",
                (user_id,)
            )
            
            if cursor.fetchone() is None:
                # Пользователя нет, добавляем его
                # Генерируем уникальные username и email если их нет
                if not username:
                    username = f"user_{user_id}"
                
                # Проверяем уникальность username, если нужно добавляем суффикс
                base_username = username
                counter = 1
                while True:
                    cursor.execute("SELECT id FROM users WHERE username = %s;", (username,))
                    if cursor.fetchone() is None:
                        break
                    username = f"{base_username}_{counter}"
                    counter += 1
                
                # Генерируем уникальный email
                email = f"telegram_{user_id}@local"
                counter = 1
                while True:
                    cursor.execute("SELECT id FROM users WHERE email = %s;", (email,))
                    if cursor.fetchone() is None:
                        break
                    email = f"telegram_{user_id}_{counter}@local"
                    counter += 1
                
                cursor.execute(
                    """INSERT INTO users (telegram_id, username, email, first_name, join_date)
                       VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP);""",
                    (user_id, username, email, first_name)
                )
                conn.commit()
            else:
                # Пользователь существует, обновляем информацию если нужно
                update_fields = []
                update_values = []
                
                if first_name:
                    update_fields.append("first_name = %s")
                    update_values.append(first_name)
                
                if username:
                    # Проверяем, не занят ли username другим пользователем
                    cursor.execute(
                        "SELECT telegram_id FROM users WHERE username = %s AND telegram_id != %s;",
                        (username, user_id)
                    )
                    if cursor.fetchone() is None:
                        update_fields.append("username = %s")
                        update_values.append(username)
                
                if update_fields:
                    update_fields.append("updated_at = CURRENT_TIMESTAMP")
                    update_values.append(user_id)
                    
                    query = f"UPDATE users SET {', '.join(update_fields)} WHERE telegram_id = %s;"
                    cursor.execute(query, tuple(update_values))
                    conn.commit()
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f'[ERROR] Failed to add user to PostgreSQL: {e}')
            # Не прерываем выполнение, просто логируем ошибку

    def get_all_users(self, table_name='users'):
        """Возвращает список всех telegram_id из PostgreSQL таблицы users."""
        try:
            conn = self._get_postgres_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL;")
            user_ids = [row[0] for row in cursor.fetchall()]
            
            cursor.close()
            conn.close()
            
            return user_ids
        except Exception as e:
            print(f'[ERROR] Failed to get users from PostgreSQL: {e}')
            return []

    def get_users_statistics(self):
        """Возвращает статистику по пользователям из PostgreSQL."""
        try:
            conn = self._get_postgres_connection()
            cursor = conn.cursor()
            
            # Общее количество пользователей
            cursor.execute("SELECT COUNT(*) FROM users WHERE telegram_id IS NOT NULL;")
            total_users = cursor.fetchone()[0]
            
            # Пользователи за сегодня
            cursor.execute("""
                SELECT COUNT(*) FROM users 
                WHERE telegram_id IS NOT NULL 
                AND DATE(join_date) = CURRENT_DATE;
            """)
            users_today = cursor.fetchone()[0]
            
            # Пользователи за последние 7 дней
            cursor.execute("""
                SELECT COUNT(*) FROM users 
                WHERE telegram_id IS NOT NULL 
                AND join_date >= CURRENT_DATE - INTERVAL '7 days';
            """)
            users_week = cursor.fetchone()[0]
            
            # Пользователи за последние 30 дней
            cursor.execute("""
                SELECT COUNT(*) FROM users 
                WHERE telegram_id IS NOT NULL 
                AND join_date >= CURRENT_DATE - INTERVAL '30 days';
            """)
            users_month = cursor.fetchone()[0]
            
            # Общий баланс всех пользователей
            cursor.execute("SELECT COALESCE(SUM(balance), 0) FROM users WHERE telegram_id IS NOT NULL;")
            total_balance = cursor.fetchone()[0]
            
            # Общая сумма потраченных средств
            cursor.execute("SELECT COALESCE(SUM(total_spent), 0) FROM users WHERE telegram_id IS NOT NULL;")
            total_spent = cursor.fetchone()[0]
            
            # Дата регистрации первого пользователя
            cursor.execute("""
                SELECT MIN(join_date) FROM users 
                WHERE telegram_id IS NOT NULL;
            """)
            first_user_date = cursor.fetchone()[0]
            
            # Дата регистрации последнего пользователя
            cursor.execute("""
                SELECT MAX(join_date) FROM users 
                WHERE telegram_id IS NOT NULL;
            """)
            last_user_date = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            
            return {
                'total_users': total_users,
                'users_today': users_today,
                'users_week': users_week,
                'users_month': users_month,
                'total_balance': float(total_balance) if total_balance else 0.0,
                'total_spent': float(total_spent) if total_spent else 0.0,
                'first_user_date': first_user_date,
                'last_user_date': last_user_date
            }
        except Exception as e:
            print(f'[ERROR] Failed to get users statistics from PostgreSQL: {e}')
            return {
                'total_users': 0,
                'users_today': 0,
                'users_week': 0,
                'users_month': 0,
                'total_balance': 0.0,
                'total_spent': 0.0,
                'first_user_date': None,
                'last_user_date': None
            }