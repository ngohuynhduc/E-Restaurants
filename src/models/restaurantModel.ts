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

    const { baseQuery, params, hasLocation } = buildRestaurantQuery(filters);

    const selectFields = `
    r.id, r.name, r.address, r.description,
    JSON_UNQUOTE(JSON_EXTRACT(r.restaurant_image, '$[0]')) as image,
    r.price_min, r.price_max,
    AVG(rev.rating) AS avg_rating,
    (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', p.id,
        'title', p.title,
        'description', p.description,
        'discount', p.discount,
        'start_date', p.start_date,
        'end_date', p.end_date
      )
    )
    FROM promotions p
    WHERE p.restaurant_id = r.id
      AND CURDATE() BETWEEN p.start_date AND p.end_date
  ) AS promotions
  `;

    const distanceField = hasLocation ? `, ST_Distance_Sphere(r.coordinate, POINT(?, ?)) AS distance` : '';

    if (hasLocation) {
      params.push(filters?.lng, filters?.lat);
    }

    const query = `
    SELECT ${selectFields} ${distanceField}
    ${baseQuery}
    GROUP BY r.id
    ${filters?.sort === 'rating' ? 'ORDER BY avg_rating DESC' : hasLocation ? 'ORDER BY distance ASC' : 'ORDER BY r.created_at DESC'}
    LIMIT ? OFFSET ?
  `;

    const restaurants = await conn.query(query, [...params, limit, offset]);

    const countSql = `SELECT COUNT(DISTINCT r.id) as count ${baseQuery}`;
    const [{ count }] = await conn.query(countSql, params);

    // restaurants.forEach((r: any) => {
    //   try {
    //     r.promotions = JSON.parse(r.promotions)?.filter(Boolean) || [];
    //   } catch {
    //     r.promotions = [];
    //   }
    // });
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
    LEFT JOIN reviews rev ON rev.restaurant_id = r.id
    WHERE r.status = 'APPROVED'
  `;
  const params: any[] = [];
  let hasLocation = false;

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

  if (filters.lat != null && filters.lng != null) {
    hasLocation = true;
  }

  return { baseQuery, params, hasLocation };
};

export const getRestaurantByIdService = async (restaurantId: string, res: Response, isAdmin: boolean = false) => {
  try {
    const conn = await pool.getConnection();

    let query = `SELECT r.*, u.full_name AS owner_name, ST_X(r.coordinate) AS lat, ST_Y(r.coordinate) AS lng, AVG(rev.rating) AS avg_rating,
          (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', p.id,
              'title', p.title,
              'description', p.description,
              'discount', p.discount,
              'start_date', p.start_date,
              'end_date', p.end_date
            )
          )
          FROM promotions p
          WHERE p.restaurant_id = r.id
            AND CURDATE() BETWEEN p.start_date AND p.end_date
        ) AS promotions
       FROM restaurants r
       JOIN users u ON r.owner_id = u.id
       LEFT JOIN reviews rev ON rev.restaurant_id = r.id
       WHERE r.id = ?`;

    if (!isAdmin) {
      query += ` AND r.status = 'APPROVED'`;
    }

    const [restaurantRows] = await pool.execute(query, [restaurantId]);

    if (restaurantRows?.length === 0) {
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

    conn.release();
    return {
      ...restaurantRows,
      categories,
      openTimes,
      tables,
      lat: restaurantRows?.lat,
      lng: restaurantRows?.lng,
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

export const getReviewsByRestaurantService = async (restaurantId: number) => {
  const conn = await pool.getConnection();
  try {
    const reviews = await conn.query(
      `SELECT r.id, r.rating, r.comment, r.image, r.created_at,
              u.full_name AS user_name, u.id AS user_id
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.restaurant_id = ?
       ORDER BY r.created_at DESC`,
      [restaurantId],
    );

    return {
      status: 200,
      data: reviews,
    };
  } catch (error) {
    console.error('Error in getReviewsByRestaurantService:', error);
    return { status: 500, message: 'Server error' };
  } finally {
    conn.release();
  }
};

export const createPromotionService = async (promotionData: any) => {
  const conn = await pool.getConnection();
  try {
    const { restaurant_id, title, description, discount, start_date, end_date } = promotionData;

    const result = await conn.execute(
      `INSERT INTO promotions (restaurant_id, title, description, discount, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [restaurant_id, title, description, discount, start_date, end_date],
    );

    return {
      status: 201,
      message: 'Tạo khuyến mãi thành công',
      data: { id: Number(result.insertId), ...promotionData },
    };
  } catch (error) {
    console.error('Error in createPromotionService:', error);
    return { status: 500, message: 'Server error' };
  } finally {
    conn.release();
  }
};
