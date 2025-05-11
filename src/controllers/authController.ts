import { NextFunction, Response, Request } from 'express';
import { authLoginService, authRegisterRestaurantService, authRegisterService, getExistingUserByEmailService, registerTablesService } from '../models/auth';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { RegisterRestaurant, RestaurantRegisterRequest, SignupRequest, UserTypes } from '../shares/type';
import pool from '../config/db';
import { PoolConnection } from 'mariadb';

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
      return handleResponse(res, 400, 'Nhập email/password', null);
    }

    const user: UserTypes = await authLoginService(email);

    if (!user) {
      return handleResponse(res, 401, 'Sai tài khoản hoặc mật khẩu', null);
    }

    const validPasswrod = await bcrypt.compare(password, user.password);
    if (!validPasswrod) {
      return handleResponse(res, 401, 'Sai tài khoản hoặc mật khẩu', null);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'none',
    });

    return handleResponse(res, 200, 'Đăng nhập thành công!', {
      accessToken,
      user: { id: user.id, full_name: user.full_name, role: user.role, email: user.email },
    });
  } catch (err) {
    next(err);
    return;
  }
};

export const authSignup = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    const { full_name, email, password, phone, role }: SignupRequest = req.body;
    if (!full_name || !email || !password || !phone) {
      return handleResponse(res, 400, 'Mời bạn nhập đủ thông tin', null);
    }

    const existingUser = await getExistingUserByEmailService(email, conn);
    if (existingUser) {
      return handleResponse(res, 400, 'Email đã được đăng ký', null);
    }

    const user: UserTypes = await authRegisterService(full_name, email, password, phone, role, conn);

    return handleResponse(res, 201, 'Đăng ký thành công', user);
  } catch (err) {
    next(err);
    return;
  } finally {
    if (conn) conn.release();
  }
};

export const authBusinessRegister = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  let conn: PoolConnection | null = null;
  try {
    const {
      full_name,
      email,
      password,
      phone,
      role,
      name,
      address,
      coordinate,
      hotline,
      description,
      menu_image,
      restaurant_image,
      tables,
      price_min,
      price_max,
      categories,
      open_time,
    }: SignupRequest & RestaurantRegisterRequest = req.body;

    let userId = req.user?.id;
    console.log('🚀 ~ authBusinessRegister ~ req.body:', req.body, userId);

    if (!name || !address || !coordinate || !hotline || !menu_image || !restaurant_image || !tables) {
      return handleResponse(res, 400, 'Mời bạn nhập đủ thông tin', null);
    }

    conn = await pool.getConnection();
    if (!userId) {
      if (!full_name || !email || !password || !phone) {
        return handleResponse(res, 400, 'Mời bạn nhập đủ thông tin', null);
      }

      const existingUser = await getExistingUserByEmailService(email, conn);
      if (existingUser) {
        return handleResponse(res, 400, 'Email đã được đăng ký', null);
      }

      const user: UserTypes = await authRegisterService(full_name, email, password, phone, role, conn);

      userId = user.id;
    }

    const restaurantResultId = await authRegisterRestaurantService({
      userId,
      address,
      coordinate,
      hotline,
      menu_image,
      name,
      restaurant_image,
      description,
      price_min,
      price_max,
      categories,
      open_time,
      conn,
    } as RegisterRestaurant);

    await registerTablesService(restaurantResultId, tables, conn);
    await conn.commit();

    return handleResponse(res, 201, 'Đăng ký nhà hàng thành công', restaurantResultId);
  } catch (err) {
    console.log('🚀 ~ authBusinessRegister ~ err:', err);
    if (conn) await conn.rollback();
    next(err);
    return;
  } finally {
    if (conn) conn.release();
  }
};
