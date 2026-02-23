import { Pool } from 'pg';
// dotenv.config() уже вызывается в index.ts, переменные окружения доступны через process.env

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gifts_app',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000, // Увеличиваем таймаут для Docker
});

// Тестовое подключение с ретраями
const testConnection = async () => {
  let retries = 5;
  while (retries) {
    try {
      const client = await pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();
      break;
    } catch (err) {
      console.log(`❌ PostgreSQL connection failed, retries left: ${retries}`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

testConnection();

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = () => {
  return pool.connect();
};

export default pool;