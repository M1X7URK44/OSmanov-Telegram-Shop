import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

export interface AdminAuthRequest extends Request {
  user?: {
    adminId: number;
    username: string;
    role: string;
    email?: string;
  };
}

export const authenticateAdmin = (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const jwt_secret = process.env.JWT_SECRET || 'your-secret-key';

  console.log('Auth middleware - Token exists:', !!token);
  
  if (!token) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Access token required' 
    });
  }

  try {
    // Декодируем токен
    const decoded = jwt.verify(token, jwt_secret) as any;
    
    console.log('Decoded token:', decoded);
    
    // Проверяем, что токен принадлежит админу
    // Ищем adminId в разных возможных полях
    const adminId = decoded.adminId || decoded.userId || decoded.id;
    
    if (!adminId) {
      console.log('No admin ID found in token:', decoded);
      return res.status(403).json({ 
        status: 'error', 
        message: 'Admin access required - invalid token structure' 
      });
    }

    // Добавляем данные админа в req.user (не req.admin!)
    req.user = {
      adminId: adminId,
      username: decoded.username || 'admin',
      role: decoded.role || 'admin',
      email: decoded.email
    };
    
    console.log('Admin authenticated and added to req.user:', req.user);
    
    next();
  } catch (error: any) {
    console.error('JWT verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Token expired' 
      });
    }
    
    return res.status(403).json({ 
      status: 'error', 
      message: 'Invalid or expired token' 
    });
  }
};