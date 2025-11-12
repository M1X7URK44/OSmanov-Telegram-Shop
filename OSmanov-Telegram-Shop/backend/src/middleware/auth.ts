import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import jwt, { Secret } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const jwt_secret = process.env.JWT_SECRET as Secret;

  if (token) {
    try {
      const decoded = jwt.verify(token, jwt_secret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ status: 'error', message: 'Invalid token' });
    }
  } else {
    // Если нет токена, используем Telegram WebApp данные
    const telegramData = req.headers['telegram-data'] as string;
    
    if (telegramData) {
      try {
        const userData = JSON.parse(telegramData);
        req.user = userData;
        next();
      } catch (error) {
        return res.status(401).json({ status: 'error', message: 'Invalid Telegram data' });
      }
    } else {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
  }
};