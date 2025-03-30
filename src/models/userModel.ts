import pool from '../config/db';

// const serializeBigInt = (rows: any[]) => {
//   return rows.map((row) => {
//     for (const key in row) {
//       if (typeof row[key] === 'bigint') {
//         row[key] = row[key].toString();
//       }
//     }
//     return row;
//   });
// };

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
