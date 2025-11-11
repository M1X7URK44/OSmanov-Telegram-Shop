import axios from 'axios';

// Базовый URL для API
const BASE_URL = 'http://localhost:5000/api';

// Создаем экземпляр axios с настройками
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Опционально: добавляем интерцепторы для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);