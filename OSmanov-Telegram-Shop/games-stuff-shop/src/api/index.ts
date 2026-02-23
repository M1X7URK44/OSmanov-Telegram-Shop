import axios from 'axios';

// Базовый URL для API
// const BASE_URL = 'http://localhost:5000/api';
const BASE_URL = '/api';

// Создаем экземпляр axios с настройками
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу, если он есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок и автоматическая очистка истёкших токенов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если токен истёк (401) или невалиден (403), очищаем его
    if (error.response?.status === 401 || error.response?.status === 403) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Очищаем токен только если это не страница авторизации
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/auth') && !currentPath.startsWith('/admin/login')) {
          localStorage.removeItem('auth_token');
          delete api.defaults.headers.common['Authorization'];
          // Перенаправляем на страницу авторизации только для веб-пользователей
          // (не из Telegram)
          if (!window.Telegram?.WebApp) {
            window.location.href = '/auth';
          }
        }
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);