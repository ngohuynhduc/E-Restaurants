import pool from '../config/db';

export const createCategoryService = async (name: string) => {
  try {
    const conn = await pool.getConnection();
    const result = await conn.query('INSERT INTO categories (name) VALUES (?)', [name]);
    conn.release();
    return { id: Number(result.insertId), name };
  } catch (err: any) {
    throw new Error(err);
  }
};

export const updateCategoryService = async (id: number, name: string) => {
  const [result] = await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
  return result.affectedRows > 0;
};

export const deleteCategoryService = async (id: number) => {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const getListRestaurantAdminService = async (offset: number, limit: number, filters?: any) => {
  console.log('🚀 ~ getListRestaurantService ~ limit:', limit);
  try {
    const conn = await pool.getConnection();

    const { baseQuery, params } = buildRestaurantQuery(filters);

    const selectFields = `
        r.id, r.name, r.address, r.description,
        r.status, r.hotline
      `;

    const query = `
        SELECT ${selectFields}
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

const buildRestaurantQuery = (filters: any = {}) => {
  let baseQuery = `
      FROM restaurants r
      LEFT JOIN restaurant_categories rc ON rc.restaurant_id = r.id
      LEFT JOIN restaurant_open_times rot ON rot.restaurant_id = r.id
    `;
  const params: any[] = [];

  if (filters.status) {
    baseQuery += `WHERE r.status = ?`;
    params.push(filters.status);
  }

  if (filters.keyword) {
    baseQuery += filters.status ? ` AND r.name LIKE ?` : `WHERE r.name LIKE ?`;
    params.push(`%${filters.keyword}%`);
  }

  return { baseQuery, params };
};

export const updateRestaurantStatusService = async (id: number, status: string) => {
  await pool.query('UPDATE restaurants SET status = ? WHERE id = ?', [status, id]);
};

export const updateRestaurantService = async (restaurantId: number, params: any) => {
  const { address, coordinate, hotline, menu_image, name, restaurant_image, description, price_min, price_max, categories, open_time, tables, status, conn } =
    params;

  const coords = coordinate.split(',');
  const lng = parseFloat(coords[0]);
  const lat = parseFloat(coords[1]);
  const pointConventions = `POINT(${lng} ${lat})`;

  await conn.query(
    `UPDATE restaurants SET name = ?, address = ?, hotline = ?, description = ?, menu_image = ?, restaurant_image = ?, coordinate = ST_GeomFromText(?), price_min = ?, price_max = ?, status = ? WHERE id = ?`,
    [
      name,
      address,
      hotline,
      description,
      JSON.stringify(menu_image),
      JSON.stringify(restaurant_image),
      pointConventions,
      price_min,
      price_max,
      status,
      restaurantId,
    ],
  );

  // 2. Update categories
  await conn.query(`DELETE FROM restaurant_categories WHERE restaurant_id = ?`, [restaurantId]);

  if (Array.isArray(categories)) {
    for (const categoryId of categories) {
      await conn.query(`INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES (?, ?)`, [restaurantId, categoryId]);
    }
  }

  // 3. Update open times
  await conn.query(`DELETE FROM restaurant_open_times WHERE restaurant_id = ?`, [restaurantId]);

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

  // 4. Update tables
  await conn.query(`DELETE FROM tables WHERE restaurant_id = ?`, [restaurantId]);

  const tableEntries = Object.entries(tables || {});
  for (const [tableType, quantity] of tableEntries) {
    if ((quantity as any) > 0) {
      const tableTypeNumber = tableType.replace(/\D/g, '');
      await conn.query(`INSERT INTO tables (restaurant_id, table_type, quantity) VALUES (?, ?, ?)`, [restaurantId, tableTypeNumber, quantity]);
    }
  }

  return true;
};

type FilterParams = {
  restaurantId: number;
  date?: string;
  time_slot?: string; // "LUNCH" | "DINNER"
  status?: string;
  limit: number;
  offset: number;
};

export const getReservationsByRestaurantService = async (params: FilterParams) => {
  const { restaurantId, date, time_slot, status, limit, offset } = params;

  let query = `
    SELECT 
      r.*, 
      u.full_name, 
      u.email
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.restaurant_id = ?
  `;
  const values: any[] = [restaurantId];

  if (date) {
    query += ` AND date = ?`;
    values.push(date);
  }

  if (time_slot) {
    query += ` AND time_slot = ?`;
    values.push(time_slot);
  }

  if (status) {
    query += ` AND status = ?`;
    values.push(status);
  }

  query += ` ORDER BY date DESC, arrival_time DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);
  console.log('🚀 ~ getReservationsByRestaurantService ~ query:', query);

  const rows = await pool.query(query, values);
  console.log('🚀 ~ getReservationsByRestaurantService ~ rows:', rows);
  return rows;
};

export const getRestaurantsByOwnerService = async (ownerId: number) => {
  const rows = await pool.query('SELECT id, name, address, status, description, hotline FROM restaurants WHERE owner_id = ?', [ownerId]);
  return rows;
};

export const updateReservationStatusService = async (id: number, status: string) => {
  await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
};
