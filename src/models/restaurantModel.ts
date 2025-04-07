import pool from '../config/db';

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
