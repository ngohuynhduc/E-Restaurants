import { Response } from 'express';
import pool from '../config/db';
import { FilterQueryOptions } from '../shares/type';

export const getNewestRestaurantService = async () => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(
      `
      SELECT id, name, address, description, JSON_UNQUOTE(JSON_EXTRACT(restaurant_image, '$[0]')) as image
      FROM restaurants
      WHERE status = 'APPROVED'
      ORDER BY created_at DESC
      LIMIT 5
    `,
    );
    conn.release();
    return rows;
  } catch (err: any) {
    throw new Error(err);
  }
};

export const getCategoriesService = async () => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM categories
    `);
    console.log('🚀 ~ getCategories ~ rows:', rows);
    conn.release();

    return rows;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getListRestaurantService = async (offset: number, limit: number, filters?: FilterQueryOptions) => {
  try {
    const conn = await pool.getConnection();

    const { baseQuery, params } = buildRestaurantQuery(filters);
    const query = `
    SELECT r.id, r.name, r.address, r.description,
      JSON_UNQUOTE(JSON_EXTRACT(r.restaurant_image, '$[0]')) as image,
      r.price_min, r.price_max
      ${baseQuery}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const restaurants = await conn.query(query, [...params, limit, offset]);

    const countSql = `SELECT COUNT(DISTINCT r.id) as count ${baseQuery}`;
    const [{ count }] = await conn.query(countSql, params);
    conn.release();
    return {
      restaurants,
      total: Number(count),
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

const buildRestaurantQuery = (filters: FilterQueryOptions = {}) => {
  let baseQuery = `
    FROM restaurants r
    LEFT JOIN restaurant_categories rc ON rc.restaurant_id = r.id
    LEFT JOIN restaurant_open_times rot ON rot.restaurant_id = r.id
    WHERE r.status = 'APPROVED'
  `;
  const params: any[] = [];

  if (filters.categoryId) {
    baseQuery += ` AND rc.category_id = ?`;
    params.push(filters.categoryId);
  }

  if (filters.keyword) {
    baseQuery += ` AND r.name LIKE ?`;
    params.push(`%${filters.keyword}%`);
  }

  if (filters.priceMin != null) {
    baseQuery += ` AND r.price_min >= ?`;
    params.push(filters.priceMin);
  }

  if (filters.priceMax != null) {
    baseQuery += ` AND r.price_max <= ?`;
    params.push(filters.priceMax);
  }

  if (filters.dayOfWeek) {
    baseQuery += ` AND rot.day_of_week = ?`;
    params.push(filters.dayOfWeek);
  }

  return { baseQuery, params };
};

export const getRestaurantByIdService = async (restaurantId: string, res: Response) => {
  try {
    const conn = await pool.getConnection();
    const [restaurantRows] = await pool.execute(
      `SELECT r.*, u.full_name AS owner_name, ST_X(r.coordinate) AS lat, ST_Y(r.coordinate) AS lng
       FROM restaurants r
       JOIN users u ON r.owner_id = u.id
       WHERE r.id = ? AND r.status = 'APPROVED'`,
      [restaurantId],
    );

    if (restaurantRows.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const categories = await pool.execute(
      `SELECT c.id, c.name
       FROM restaurant_categories rc
       JOIN categories c ON rc.category_id = c.id
       WHERE rc.restaurant_id = ?`,
      [restaurantId],
    );

    const openTimes = await pool.execute(`SELECT * FROM restaurant_open_times WHERE restaurant_id = ?`, [restaurantId]);

    const tables = await pool.execute(`SELECT table_type, quantity FROM tables WHERE restaurant_id = ?`, [restaurantId]);
    console.log('🚀 ~ getRestaurantByIdService ~ categories:', tables);

    conn.release();
    return {
      ...restaurantRows,
      categories,
      openTimes,
      tables,
      lat: restaurantRows.lat,
      lng: restaurantRows.lng,
    };
  } catch (err: any) {
    throw new Error(err);
  }
};
