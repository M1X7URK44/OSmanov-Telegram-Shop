// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requestLogger } from './middleware/logger';
import { giftsRoutes } from './routes/gifts.routes';
import { userRoutes } from './routes/user.routes';
import { cardLinkRoutes } from './routes/cardlink.routes'; // Добавляем импорт

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Динамическое определение origin
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Разрешаем запросы без origin (мобильные приложения, Postman и т.д.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://os-gift.store',
      'https://www.os-gift.store',
      'http://os-gift.store', 
      'http://www.os-gift.store',
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:5173',
      'https://localhost:5173',
      'http://frontend:3000',
      'http://frontend:80',
      'http://backend:5000',
      'http://localhost',
      'http://127.0.0.1:3000',    // ← добавьте это
      'https://127.0.0.1:3000',   // ← добавьте это
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length']
};

app.use(cors(corsOptions));


// Логирование запросов
app.use(requestLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Добавляем для webhook

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

// Новые роуты для CardLink
app.use('/api/cardlink', cardLinkRoutes); // Добавляем роуты

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});