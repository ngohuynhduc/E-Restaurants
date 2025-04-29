import { NextFunction, Response, Request } from 'express';
import { createUserService, getAllUsersService, getUserByIdService } from '../models/userModel';

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
    console.log('🚀 ~ getUserById ~ userId:', userId);
    const user = await getUserByIdService(userId);
    console.log('🚀 ~ getUserById ~ user:', user);
    return handleResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    next(error);
  }
};
