import { NextFunction, Response, Request } from 'express';
import { authLoginService, authRegisterService, getExistingUserByEmailService } from '../models/auth';
import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserTypes } from '../shares/type';

dotenv.config();

const handleResponse = (res: Response, status: number, message: string, data: any) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
};

const generateAccessToken = (user: UserTypes) => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined');
  }
  const expiresIn = Number(process.env.ACCESS_TOKEN_EXPIRES) || 900;
  return jwt.sign(user, secret, { expiresIn });
};

const generateRefreshToken = (user: UserTypes) => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined');
  }
  const expiresIn = Number(process.env.REFRESH_TOKEN_EXPIRATION) || 86400;
  return jwt.sign(user, refreshSecret, { expiresIn });
};

export const authLogin = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return handleResponse(res, 400, 'Email and password are required', null);
    }

    const user: UserTypes = await authLoginService(email);

    if (!user) {
      return handleResponse(res, 401, 'Email and password are incorrect', null);
    }

    const validPasswrod = await bcrypt.compare(password, user.password);
    console.log('🚀 ~ authLogin ~ validPasswrod:', validPasswrod);
    if (!validPasswrod) {
      return handleResponse(res, 401, 'Email and password are incorrect', null);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'none',
    });

    return handleResponse(res, 200, 'User logged in successfully', { accessToken, user: { id: user.id, full_name: user.full_name, role: user.role } });
  } catch (err) {
    next(err);
    return;
  }
};

export const authSignup = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { full_name, email, password, phone, role }: UserTypes = req.body;
    if (!full_name || !email || !password || !phone) {
      return handleResponse(res, 400, 'Full name, phone, email and password are required', null);
    }

    const existingUser = await getExistingUserByEmailService(email);
    if (existingUser) {
      return handleResponse(res, 400, 'Email is already registered', null);
    }

    const user: UserTypes = await authRegisterService(full_name, email, password, phone, role);

    return handleResponse(res, 200, 'User registered successfully', user);
  } catch (err) {
    next(err);
    return;
  }
};
