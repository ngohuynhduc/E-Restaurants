import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import reservationRoutes from './routes/reservationsRoutes';
import errorHandling from './middlewares/errorHandler';
import { createDataTable } from './data/createDataTable';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());
// app.use(express.urlencoded({ extended: true }));

// Routes

app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);

// Error handling

app.use(errorHandling);

// Create Database

createDataTable();

// Test connection to database
app.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users');
    console.log('🚀 ~ app.get ~ rows:', rows);
    conn.release();
    res.send(rows);
  } catch (err) {
    res.status(500).send('Failed to connect to database');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
