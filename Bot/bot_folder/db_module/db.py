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
