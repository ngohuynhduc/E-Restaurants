import cron from 'node-cron';
import pool from '../config/db';
import { releaseExpiredHolds } from '../models/reservationsModel';

cron.schedule('* * * * *', async () => {
  // 1minute interval
  const conn = await pool.getConnection();
  try {
    console.log('[CRON] Running: releaseExpiredHolds...');
    const result = await releaseExpiredHolds(conn);
    console.log(`[CRON] Released ${result.released} expired holds`);
  } catch (err) {
    console.error('[CRON] Error in releaseExpiredHolds:', err);
  } finally {
    conn.release();
  }
});
