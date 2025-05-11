import pool from '../config/db';
import bcrypt from 'bcryptjs';

export const getAllUsersService = async () => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users');
    conn.release();
    return rows;
  } catch (err: any) {
    throw new Error(err);
  }
};

export const createUserService = async (name: string, email: string) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);

    const insertId = typeof rows.insertId === 'bigint' ? Number(rows.insertId) : rows.insertId;

    const [user] = await conn.query('SELECT id, name, email FROM users WHERE id = ?', [insertId]);

    console.log('🚀 ~ createUserService ~ rows:', rows);
    conn.release();
    return user;
  } catch (err: any) {
    throw new Error(err);
  }
};

export const getUserByIdService = async (id: string) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id, full_name, email, phone, role FROM users WHERE id = ?', [id]);
    conn.release();
    return rows;
  } catch (err: any) {
    throw new Error(err);
  }
};

export const updateUserInfoService = async (fields: string[], values: any[]) => {
  console.log('🚀 ~ updateUserInfoService ~ values:', values);
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    console.log('🚀 ~ updateUserInfoService ~ result:', result.insertId);
    return result;
  } catch (error: any) {
    throw new Error(error);
  } finally {
    conn.release();
  }
};

export const updateUserPasswordService = async (oldPassword: any, newPassword: any, userId: any) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      return { message: 'Không tìm thấy thông tin tài khoản!', status: 400 };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return { message: 'Mật khẩu không chính xác', status: 401 };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    return { message: 'Đã thay đổi mật khẩu', status: 200 };
  } catch (error: any) {
    throw new Error(error);
  } finally {
    conn.release();
  }
};

export const getReservationByUserIdService = async (userId: any, limit: number, offset: number, pageInt: number) => {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query(
      `
      SELECT 
        r.id AS reservation_id,
        r.restaurant_id,
        rs.name AS restaurant_name,
        rs.address AS restaurant_address,
        r.guest_count,
        r.phone,
        r.note,
        r.date,
        r.arrival_time,
        r.time_slot,
        r.status,
        r.created_at
      FROM reservations r
      JOIN restaurants rs ON rs.id = r.restaurant_id
      WHERE r.user_id = ?
      ORDER BY r.date DESC, r.arrival_time DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset],
    );

    const [{ total }] = await conn.query(`SELECT COUNT(*) as total FROM reservations WHERE user_id = ?`, [userId]);

    console.log('🚀 ~ getReservationByUserIdService ~ total:', total);
    return {
      reservations: rows,
      pagination: {
        total: Number(total),
        limit,
        pageInt,
      },
    };
  } catch (error: any) {
    throw new Error(error);
  } finally {
    conn.release();
  }
};

export const checkCanReviewService = async (userId: number, restaurantId: number) => {
  const conn = await pool.getConnection();
  try {
    // 1. Kiểm tra đã từng đặt bàn CONFIRMED và ngày <= hôm nay
    const eligibleRow = await conn.query(
      `SELECT COUNT(*) AS eligible
       FROM reservations
       WHERE user_id = ? AND restaurant_id = ?
         AND status = 'CONFIRMED'
         AND date <= CURRENT_DATE()`,
      [userId, restaurantId],
    );
    console.log('🚀 ~ checkCanReviewService ~ eligibleRow:', eligibleRow);

    // 2. Kiểm tra đã review chưa
    const [reviewedRow] = await conn.query(
      `SELECT COUNT(*) AS reviewed
       FROM reviews
       WHERE user_id = ? AND restaurant_id = ?`,
      [userId, restaurantId],
    );

    const isEligible = (eligibleRow as any)[0]?.eligible > 0;
    console.log('🚀 ~ checkCanReviewService ~ isEligible:', isEligible);
    const hasReviewed = (reviewedRow as any)[0]?.reviewed > 0;

    return {
      status: 200,
      data: {
        canReview: isEligible && !hasReviewed,
        isEligible,
        hasReviewed,
      },
    };
  } catch (error) {
    console.error('Error in checkCanReviewService:', error);
    return { status: 500, message: 'Server error' };
  } finally {
    conn.release();
  }
};

export const createReviewService = async (
  userId: number,
  reviewData: {
    restaurantId: number;
    rating: '1' | '2' | '3' | '4' | '5';
    comment?: string;
    image?: string;
  },
) => {
  const conn = await pool.getConnection();
  try {
    // Check if eligible to review
    const check = await checkCanReviewService(userId, reviewData.restaurantId);
    if (!check?.data?.canReview) {
      return { status: 400, message: 'You are not allowed to review this restaurant' };
    }

    const { restaurantId, rating, comment, image } = reviewData;
    await conn.query(
      `INSERT INTO reviews (user_id, restaurant_id, rating, comment, image)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, restaurantId, rating, comment || null, image || null],
    );

    return { status: 201, message: 'Review created successfully' };
  } catch (error) {
    console.error('Error in createReviewService:', error);
    return { status: 500, message: 'Server error' };
  } finally {
    conn.release();
  }
};
