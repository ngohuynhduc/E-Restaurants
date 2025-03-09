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

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);
    return handleResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    next(error);
    return;
  }
};
