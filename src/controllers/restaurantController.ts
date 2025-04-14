import { NextFunction, Response, Request } from 'express';
import dotenv from 'dotenv';
import { getCategoriesService, getListRestaurantService, getNewestRestaurantService, getRestaurantByIdService } from '../models/restaurantModel';
import { paginate } from '../utils/paginate';
import { FilterQueryOptions } from '../shares/type';

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

export const getListRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const { limit: pageLimit, offset, page: pageInt } = paginate({ page: +page, limit: +limit });

    const filterOptions = {
      categoryId: Number(req.query.categoryId) || undefined,
      priceMin: Number(req.query.priceMin) || undefined,
      priceMax: Number(req.query.priceMax) || undefined,
      keyword: req.query.keyword || undefined,
      dayOfWeek: req.query.dayOfWeek || undefined,
    } as FilterQueryOptions;
    console.log('🚀 ~ getListRestaurant ~ filterOptions:', filterOptions);

    const { restaurants, total } = await getListRestaurantService(offset, pageLimit, filterOptions);
    const response = {
      data: restaurants,
      pagination: {
        currentPage: pageInt,
        perPage: pageLimit,
        total,
        totalPage: Math.ceil(total / pageLimit),
      },
    };
    return handleResponse(res, 200, 'Successfully', response);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await getRestaurantByIdService(restaurantId, res);
    console.log('🚀 ~ getRestaurantById ~ restaurant:', restaurant);
    if (!restaurant) {
      return handleResponse(res, 404, 'Không tìm thấy nhà hàng!', null);
    }
    return handleResponse(res, 200, 'Successfully', restaurant);
  } catch (error) {
    next(error);
  }
};
