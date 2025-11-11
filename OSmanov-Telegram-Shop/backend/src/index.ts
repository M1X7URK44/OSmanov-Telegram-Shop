// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requestLogger } from './middleware/logger';
import { giftsRoutes } from './routes/gifts.routes';
import { userRoutes } from './routes/user.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Логирование запросов
app.use(requestLogger);

app.use(cors({
  origin: 'http://localhost',
  credentials: true,
}));

app.use(express.json());

// Routes
app.get('/api/hello', (req, res) => {
  console.log('✅ GET /api/hello - Handled successfully');
  res.json({ message: 'Hello from Node.js + TypeScript!' });
});

app.get('/api/items', (req, res) => {
  console.log('✅ GET /api/items - Handled successfully');
  res.json({ 
    data: [
      {id: 1, name: 'Steam'},
      {id: 2, name: 'PlayMarket'},
      {id: 3, name: 'Xbox Gift'},
    ] 
  });
});

// Новые роуты для Gifts API
app.use('/api/gifts', giftsRoutes);

// Новые роуты для пользователей
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});