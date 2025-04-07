import { NextFunction, Response, Request } from 'express';
import dotenv from 'dotenv';
import { getCategoriesService, getNewestRestaurantService } from '../models/restaurantModel';

dotenv.config();

const handleResponse = (res: Response, status: number, message: string, data: any) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
};

export const getNewestRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const newestRestaurant = await getNewestRestaurantService();
    if (!newestRestaurant) {
      return handleResponse(res, 404, 'Không tìm thấy nhà hàng!', null);
    }
    const data = newestRestaurant?.map((restaurant: any) => {
      const imageUrl = JSON.parse(restaurant.image);
      return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        description: restaurant.description,
        image: imageUrl,
      };
    });
    return handleResponse(res, 200, 'Successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const categories = await getCategoriesService();
    return handleResponse(res, 200, 'Successfully', categories);
  } catch (error) {
    next(error);
  }
};
