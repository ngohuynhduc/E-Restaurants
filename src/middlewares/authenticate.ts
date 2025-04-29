import { NextFunction, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  dotenv.config();

  const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'scret-key';
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const optionalAuthentication = (req: any, res: Response, next: NextFunction) => {
  dotenv.config();
  const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'scret-key';
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    (req as any).user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    (req as any).user = null;
    (req as any).authMessage = error;
    next();
  }
};
