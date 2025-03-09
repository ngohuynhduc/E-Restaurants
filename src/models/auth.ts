import pool from '../config/db';
import bcrypt from 'bcryptjs';

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

export const authRegisterService = async (full_name: string, email: string, password: string, phone: string, role: string) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const conn = await pool.getConnection();
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

    conn.release();
    return user;
  } catch (err: any) {
    console.log('🚀 ~ authRegisterService ~ err:', err);
    throw new Error(err);
  }
};

export const getExistingUserByEmailService = async (email: string) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    conn.release();
    return rows;
  } catch (err: any) {
    throw new Error(err);
  }
};
