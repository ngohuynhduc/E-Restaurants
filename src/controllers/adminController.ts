import { NextFunction, Request, Response } from 'express';
import {
  createCategoryService,
  deleteCategoryService,
  deletePromotionByIdService,
  getListRestaurantAdminService,
  getPromotionsByRestaurantIdService,
  getReservationsByRestaurantService,
  getRestaurantsByOwnerService,
  updateCategoryService,
  updateReservationStatusService,
  updateRestaurantService,
  updateRestaurantStatusService,
} from '../models/adminModel';
import { paginate } from '../utils/paginate';
import pool from '../config/db';

export const createCategory = async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền này' });
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });

    const result = await createCategoryService(name);
    console.log('🚀 ~ createCategory ~ result:', result);
    res.status(201).json({ message: 'Thêm danh mục thành công', data: result });
  } catch (err) {
    console.log('🚀 ~ createCategory ~ err:', err);
    res.status(500).json({ error: 'Lỗi tạo danh mục' });
  }
};

export const updateCategory = async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền này' });
    const { id } = req.params;
    const { name } = req.body;

    const updated = await updateCategoryService(id, name);
    if (!updated) return res.status(404).json({ error: 'Danh mục không tồn tại' });

    res.json({ message: 'Cập nhật danh mục thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật danh mục' });
  }
};

export const deleteCategory = async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền này' });
    const { id } = req.params;

    const deleted = await deleteCategoryService(id);
    if (!deleted) return res.status(404).json({ error: 'Danh mục không tồn tại' });

    res.json({ message: 'Xóa danh mục thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa danh mục' });
  }
};

export const getListRestaurantAdmin = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền này' });

    const { page = '1', limit = '10' } = req.query;
    const { limit: pageLimit, offset, page: pageInt } = paginate({ page: +page, limit: +limit });

    const filterOptions = {
      status: req.query.status === 'ALL' ? undefined : req.query.status || undefined,
      keyword: req.query.keyword || undefined,
    } as {
      status?: string;
      keyword?: string;
    };
    console.log('🚀 ~ getListRestaurant ~ filterOptions:', filterOptions);

    const { restaurants, total } = await getListRestaurantAdminService(offset, pageLimit, filterOptions);
    const response = {
      data: restaurants,
      pagination: {
        currentPage: pageInt,
        perPage: pageLimit,
        total,
        totalPage: Math.ceil(total / pageLimit),
      },
    };
    console.log('🚀 ~ getListRestaurantAdmin ~ response:', response);
    return res.status(200).json({ message: 'thành công', response });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const userRole = req.user?.role;
  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
  }
  if (userRole !== 'ADMIN') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền này' });
  try {
    await updateRestaurantStatusService(id, status);
    res.status(200).json({ message: 'Cập nhật trạng thái thành công.', status: 200 });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái.' });
  }
};

export const updateRestaurantController = async (req: any, res: Response) => {
  const restaurantId = Number(req.params.id);
  const userRole = req.user?.role;
  if (userRole === 'USER') return res.status(403).json({ error: 'Không đủ quyền hạn' });
  const { address, coordinate, hotline, menu_image, restaurant_image, name, description, price_min, price_max, categories, open_time, tables, status } =
    req.body;

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    await updateRestaurantService(restaurantId, {
      address,
      coordinate,
      hotline,
      menu_image,
      restaurant_image,
      name,
      description,
      price_min,
      price_max,
      categories,
      open_time,
      tables,
      status,
      conn,
    });

    await conn.commit();
    res.json({ message: 'Cập nhật nhà hàng thành công' });
  } catch (error) {
    await conn.rollback();
    console.error('Update error:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật nhà hàng' });
  } finally {
    conn.release();
  }
};

export const getReservationsByRestaurant = async (req: any, res: Response) => {
  try {
    const { restaurantId } = req.params;
    console.log('🚀 ~ getReservationsByRestaurant ~ restaurantId:', restaurantId);
    const { page = '1', date, time_slot, status } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limit = 10;
    const offset = (pageNum - 1) * limit;
    const userRole = req.user?.role;
    if (userRole === 'USER') return res.status(403).json({ error: 'Không đủ quyền hạn' });

    const results = await getReservationsByRestaurantService({
      restaurantId: Number(restaurantId),
      date: date as string,
      time_slot: time_slot as string,
      status: status as string,
      limit,
      offset,
    });
    console.log('🚀 ~ getReservationsByRestaurant ~ results:', results);

    res.json(results);
  } catch (error) {
    console.error('Error getReservationsByRestaurant:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getRestaurantsByOwner = async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole === 'USER') return res.status(403).json({ error: 'Không đủ quyền hạn' });
    const { ownerId } = req.params;
    const restaurants = await getRestaurantsByOwnerService(Number(ownerId));
    console.log('🚀 ~ getRestaurantsByOwner ~ restaurants:', restaurants);
    res.json(restaurants);
  } catch (error) {
    console.error('Error getRestaurantsByOwner:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateReservationStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const userRole = req.user?.role;
  if (!['COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
  }
  if (userRole === 'USER') return res.status(403).json({ error: 'Chỉ ADMIN mới có quyền này' });
  try {
    await updateReservationStatusService(id, status);
    res.status(200).json({ message: 'Cập nhật trạng thái thành công.', status: 200 });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái.' });
  }
};

export const getPromotionsByRestaurantId = async (req: Request, res: Response) => {
  const restaurantId = Number(req.params.restaurantId);
  if (isNaN(restaurantId)) {
    return res.status(400).json({ message: 'Invalid restaurant ID' });
  }

  const result = await getPromotionsByRestaurantIdService(restaurantId);
  return res.status(result.status).json(result.data ?? { message: result.message });
};

export const deletePromotionById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid promotion ID' });
  }

  const result = await deletePromotionByIdService(id);
  return res.status(result.status).json({ message: result.message });
};
