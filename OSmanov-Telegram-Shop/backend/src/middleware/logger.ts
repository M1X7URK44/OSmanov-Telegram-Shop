import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`📨 [${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Логируем тело запроса для POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Логируем query параметры
  if (Object.keys(req.query).length > 0) {
    console.log('🔍 Query Params:', req.query);
  }
  
  // Сохраняем оригинальный метод send
  const originalSend = res.send;
  
  // Перехватываем ответ
  res.send = function(body) {
    const contentLength = res.get('Content-Length') || Buffer.byteLength(body as string || '');
    console.log(`📤 [${timestamp}] ${method} ${url} - Status: ${res.statusCode} - Length: ${contentLength}`);
    
    return originalSend.call(this, body);
  };
  
  next();
};