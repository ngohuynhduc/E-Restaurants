import pool from '../config/db';
import bcrypt from 'bcryptjs';
import { PoolConnection } from 'mariadb';
import { RegisterRestaurant, TablesRegisterRequest } from '../shares/type';

export const authLoginService = async (email: string) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    conn.release();
    return rows;
  } catch (err: any) {
    throw new Error(err);
  }
};

export const authRegisterService = async (full_name: string, email: string, password: string, phone: string, role: string, conn: PoolConnection) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const rows = await conn.query('INSERT INTO users (full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)', [
      full_name,
      email,
      hashedPassword,
      phone,
      role,
    ]);

    console.log('🚀 ~ authRegisterService ~ insertId:', rows);
    const insertId = typeof rows.insertId === 'bigint' ? Number(rows.insertId) : rows.insertId;

    const [user] = await conn.query('SELECT id, full_name, email, phone, role FROM users WHERE id = ?', insertId);
    console.log('🚀 ~ authRegisterService ~ user:', user);

    return user;
  } catch (err: any) {
    console.log('🚀 ~ authRegisterService ~ err:', err);
    throw new Error(err);
  }
};

export const getExistingUserByEmailService = async (email: string, conn: PoolConnection) => {
  try {
    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows;
  } catch (err: any) {
    throw new Error(err);
  }
};

export const authRegisterRestaurantService = async (params: RegisterRestaurant) => {
  try {
    const { userId, address, coordinate, hotline, menu_image, name, restaurant_image, description, price_min, price_max, categories, open_time, conn } = params;

    const coords = coordinate.split(',');
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);
    const pointConventions = `POINT(${lng} ${lat})`;

    const restaurantResult = await conn.query(
      'INSERT INTO restaurants (owner_id, name, address, hotline, description, menu_image, restaurant_image, coordinate, price_min, price_max) VALUES (?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(?), ?, ?)',
      [userId, name, address, hotline, description, JSON.stringify(menu_image), JSON.stringify(restaurant_image), pointConventions, price_min, price_max],
    );

    const restaurantId = Number(restaurantResult.insertId);

    if (Array.isArray(categories)) {
      for (const categoryId of categories) {
        await conn.query('INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES (?, ?)', [restaurantId, categoryId]);
      }
    }

    if (open_time?.days?.length) {
      const lunchFrom = open_time.lunchHours?.from || null;
      const lunchTo = open_time.lunchHours?.to || null;
      const dinnerFrom = open_time.dinnerHours?.from || null;
      const dinnerTo = open_time.dinnerHours?.to || null;

      for (const day of open_time.days) {
        await conn.query(
          `INSERT INTO restaurant_open_times (
            restaurant_id, day_of_week, lunch_from, lunch_to, dinner_from, dinner_to
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [restaurantId, day, lunchFrom, lunchTo, dinnerFrom, dinnerTo],
        );
      }
    }

    return restaurantId;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const registerTablesService = async (restaurantId: number, tables: TablesRegisterRequest, conn: PoolConnection) => {
  const tableEntries = Object.entries(tables);
  for (const [tableType, quantity] of tableEntries) {
    if (quantity > 0) {
      const tableTypeNumber = tableType.replace(/\D/g, '').toString();

      await conn.query('INSERT INTO tables (restaurant_id, table_type, quantity) VALUES (?, ?, ?)', [restaurantId, tableTypeNumber, quantity]);
    }
  }
};
