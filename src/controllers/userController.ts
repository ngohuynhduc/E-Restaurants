import { NextFunction, Response, Request } from 'express';
import {
  createUserService,
  getAllUsersService,
  getReservationByUserIdService,
  getUserByIdService,
  updateUserInfoService,
  updateUserPasswordService,
} from '../models/userModel';
import { paginate } from '../utils/paginate';

const handleResponse = (res: Response, status: number, message: string, data: any) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
};

export const createUser = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { name, email } = req.body;
    const newUser = await createUserService(name, email);
    console.log('🚀 ~ createUser ~ req.body', req.body);
    return handleResponse(res, 200, 'User created successfully', newUser);
  } catch (err) {
    next(err);
    return;
  }
};

export const getAllUser = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const users = await getAllUsersService();
    return handleResponse(res, 200, 'All users fetched successfully', users);
  } catch (error) {
    next(error);
    return;
  }
};

export const getUserById = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const userMessage = await req.authMessage?.toString();
    console.log('🚀 ~ getUserById ~ userMessage:', typeof userMessage);
    if (!userId) {
      if (userMessage.includes('jwt expired')) {
        return handleResponse(res, 401, 'Token expired', null);
      }
      return handleResponse(res, 400, 'User id is required', null);
    }
    const user = await getUserByIdService(userId);
    return handleResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateUserInfo = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const { name, phone } = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    if (!userId) {
      return handleResponse(res, 401, 'Login required', null);
    }

    if (!name && !phone) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }

    if (phone) {
      fields.push('phone = ?');
      values.push(phone);
    }

    values.push(userId);

    const updateResponse = updateUserInfoService(fields, values);
    return handleResponse(res, 200, 'User info updated successfully', updateResponse);
  } catch (error) {
    next(error);
  }
};

export const updateUserPassword = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword || !userId) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const response = await updateUserPasswordService(oldPassword, newPassword, userId);

    return handleResponse(res, response.status, response.message, null);
  } catch (error) {
    next(error);
  }
};

export const getReservationsByUserId = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user.id;

    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    if (!userId) {
      return handleResponse(res, 401, 'Chưa đăng nhập', null);
    }

    const { limit: pageLimit, offset, page: pageInt } = paginate({ page: +page, limit: +limit });

    const listReservationByUser = await getReservationByUserIdService(userId, pageLimit, offset, pageInt);

    return handleResponse(res, 200, 'Successfully', listReservationByUser);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
