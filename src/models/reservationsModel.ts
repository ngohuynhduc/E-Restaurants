import { reservationType } from '../shares/type';
import pool from '../config/db';
import { PoolConnection } from 'mariadb';

function determineTimeSlot(arrival_time: string) {
  const hour = Number(arrival_time.split(':')[0]);
  return hour < 15 ? 'LUNCH' : 'DINNER';
}

type Table = { id: number; type: number };

async function allocateTables(restaurant_id: number, guest_count: number, date: string, timeSlot: string, conn: PoolConnection) {
  if (guest_count <= 0 || guest_count > 20) return null;

  if (guest_count >= 10 && guest_count % 2 !== 0) {
    guest_count += 1;
  }

  const rows = await conn.query(
    `
    SELECT 
      t.id, 
      t.table_type,
      t.quantity,
      COUNT(rt.id) AS reserved_count
    FROM tables t
    LEFT JOIN reservation_tables rt 
      ON rt.table_id = t.id
      AND rt.status IN ('CONFIRMED', 'HOLDING')
    LEFT JOIN reservations r 
      ON r.id = rt.reservation_id
      AND r.date = ?
      AND r.time_slot = ?
    WHERE t.restaurant_id = ?
    GROUP BY t.id
    HAVING (t.quantity - reserved_count) > 0
    `,
    [date, timeSlot, restaurant_id],
  );

  const tablesRaw = rows as {
    id: number;
    table_type: string;
    quantity: number;
    reserved_count: number;
  }[];

  const availableTables = new Map<number, { id: number; available: number }>();

  for (const table of tablesRaw) {
    const type = parseInt(table.table_type);
    const available = Number(table.quantity) - Number(table.reserved_count);
    if (available > 0) {
      availableTables.set(type, { id: table.id, available });
    }
  }

  const hasTable2 = availableTables.has(2) && availableTables.get(2)!.available > 0;
  const hasTable4 = availableTables.has(4) && availableTables.get(4)!.available > 0;
  const hasTable6 = availableTables.has(6) && availableTables.get(6)!.available > 0;

  const optimalAllocations = new Map<number, number[]>();
  optimalAllocations.set(1, [2, 1]);
  optimalAllocations.set(2, [2, 1]);
  optimalAllocations.set(3, [4, 1]);
  optimalAllocations.set(4, [4, 1]);
  optimalAllocations.set(5, [6, 1]);
  optimalAllocations.set(6, [6, 1]);
  optimalAllocations.set(7, [6, 1, 2, 1]);
  optimalAllocations.set(8, [6, 1, 2, 1]);
  optimalAllocations.set(9, [6, 1, 4, 1]);
  optimalAllocations.set(10, [6, 1, 4, 1]);
  optimalAllocations.set(12, [6, 2]);
  optimalAllocations.set(14, [6, 2, 2, 1]);
  optimalAllocations.set(16, [6, 2, 4, 1]);
  optimalAllocations.set(18, [6, 3]);
  optimalAllocations.set(20, [6, 3, 2, 1]);

  const optimalAllocation = optimalAllocations.get(guest_count);
  if (!optimalAllocation) return null;

  const result: number[] = [];

  for (let i = 0; i < optimalAllocation.length; i += 2) {
    const tableType = optimalAllocation[i];
    const requiredCount = optimalAllocation[i + 1];

    let used = 0;

    if (availableTables.has(tableType)) {
      const tableInfo = availableTables.get(tableType)!;
      const canUse = Math.min(tableInfo.available, requiredCount);
      for (let j = 0; j < canUse; j++) {
        result.push(tableInfo.id);
      }
      tableInfo.available -= canUse;
      used += canUse;
    }

    let remaining = requiredCount - used;

    while (remaining > 0) {
      let fallbackDone = false;

      if (tableType === 2) {
        if (hasTable4 && availableTables.get(4)!.available > 0) {
          result.push(availableTables.get(4)!.id);
          availableTables.get(4)!.available -= 1;
          fallbackDone = true;
        } else if (hasTable6 && availableTables.get(6)!.available > 0) {
          result.push(availableTables.get(6)!.id);
          availableTables.get(6)!.available -= 1;
          fallbackDone = true;
        }
      } else if (tableType === 4) {
        if (hasTable6 && availableTables.get(6)!.available > 0) {
          result.push(availableTables.get(6)!.id);
          availableTables.get(6)!.available -= 1;
          fallbackDone = true;
        }
      }

      if (fallbackDone) {
        remaining--;
      } else {
        break;
      }
    }

    if (remaining > 0) {
      break;
    }
  }

  if (result.length > 0 && guest_count <= result.length * 6) {
    return result;
  }

  let totalSeatsAvailable = 0;
  const tempResult: number[] = [];

  const tableTypesDesc = [6, 4, 2];
  for (const type of tableTypesDesc) {
    const info = availableTables.get(type);
    if (!info) continue;

    for (let i = 0; i < info.available; i++) {
      tempResult.push(info.id);
      totalSeatsAvailable += type;
      if (totalSeatsAvailable >= guest_count) {
        return tempResult;
      }
    }
  }

  return null;
}

export const reservationHoldService = async (params: reservationType) => {
  const { restaurant_id, user_id, guest_count, date, arrival_time, phone, note } = params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const timeSlot = determineTimeSlot(arrival_time);
    const allocatedTableIds = await allocateTables(restaurant_id, guest_count, date, timeSlot, conn);

    if (!allocatedTableIds) {
      await conn.rollback();
      return {
        status: 400,
        message: 'Không đủ bàn để phục vụ số lượng khách này.',
      };
    }

    const holdExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5m

    const reservationResult = await conn.execute(
      `INSERT INTO reservations (restaurant_id, user_id, phone, guest_count, date, arrival_time, time_slot, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant_id, user_id, phone, guest_count, date, arrival_time, timeSlot, note || null],
    );
    console.log('🚀 ~ reservationHoldService ~ reservationResult:', reservationResult);

    const reservationId = typeof reservationResult.insertId === 'bigint' ? Number(reservationResult.insertId) : reservationResult.insertId;

    const insertTablePromises = allocatedTableIds.map((tableId) =>
      conn.execute(
        `INSERT INTO reservation_tables (reservation_id, table_id, status, hold_expiration)
             VALUES (?, ?, 'HOLDING', ?)`,
        [reservationId, tableId, holdExpiration],
      ),
    );
    await Promise.all(insertTablePromises);

    await conn.commit();

    return { hold_id: reservationId, expired_at: holdExpiration.toISOString() };
    // const test1 = await allocateTables(15, 4, '2025-07-22', 'LUNCH', conn);
    // const test2 = await allocateTables(15, 8, '2025-07-22', 'LUNCH', conn);
    // const test3 = await allocateTables(15, 9, '2025-07-22', 'LUNCH', conn);
    // const test4 = await allocateTables(15, 12, '2025-07-22', 'LUNCH', conn);
    // console.log('✅ Result:', test1, test2, test3, test4);
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return { message: 'Server error', status: 500 };
  } finally {
    conn.release();
  }
};

export const reservationService = async (reservation_id: number, phone: string, note: string) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const rows = await conn.query(`SELECT * FROM reservation_tables WHERE reservation_id = ? AND status = 'HOLDING' AND hold_expiration > NOW()`, [
      reservation_id,
    ]);
    console.log('🚀 ~ reservationService ~ rows:', rows);

    if (!rows?.length) {
      await conn.rollback();
      return { message: 'Hold đã hết hạn hoặc không hợp lệ.', status: 400 };
    }

    await conn.query(`UPDATE reservation_tables SET status = 'CONFIRMED', hold_expiration = NULL WHERE reservation_id = ?`, [reservation_id]);

    await conn.query(`UPDATE reservations SET status = 'CONFIRMED', phone = ?, note = ? WHERE id = ?`, [phone, note || null, reservation_id]);

    await conn.commit();
    return { message: 'Đặt bàn thành công!', status: 200 };
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return { message: 'Server error', status: 500 };
  } finally {
    conn.release();
  }
};

export const checkAvailabilityService = async (restaurant_id: number, date: string, arrival_time: string, guest_count: number) => {
  const conn = await pool.getConnection();
  try {
    const timeSlot = determineTimeSlot(String(arrival_time));
    console.log('🚀 ~ checkAvailabilityService ~ timeSlot:', timeSlot);
    const allocatedTables = await allocateTables(Number(restaurant_id), Number(guest_count), String(date), timeSlot, conn);

    if (!allocatedTables) {
      return { available: false };
    }
    return { available: true };
  } catch (error) {
    console.error(error);
    return { message: 'Server error', status: 500 };
  } finally {
    conn.release();
  }
};

export const getReservationByIdService = async (reservationId: number, holding = false) => {
  const conn = await pool.getConnection();
  try {
    const query = holding
      ? `
          SELECT r.id AS reservation_id, r.restaurant_id, r.guest_count, r.phone, r.note,
                 r.date, r.arrival_time, r.time_slot,
                 MIN(rt.hold_expiration) AS expired_at
          FROM reservations r
          JOIN reservation_tables rt ON rt.reservation_id = r.id
          WHERE r.id = ?
            AND rt.status = 'HOLDING'
          GROUP BY r.id
        `
      : `
          SELECT r.id AS reservation_id, r.restaurant_id, r.guest_count, r.phone, r.note,
                 r.date, r.arrival_time, r.time_slot, rt.status as table_status, r.status,
                 MIN(rt.hold_expiration) AS expired_at
          FROM reservations r
          JOIN reservation_tables rt ON rt.reservation_id = r.id
          GROUP BY r.id
        `;
    const reservationRows = await conn.query(query, [reservationId]);
    console.log('🚀 ~ getReservationByIdService ~ reservationRows:', reservationRows);

    const reservation = (reservationRows as any[])[0];

    if (!reservation) {
      return {
        status: 404,
        message: 'Reservation not found or expired',
      };
    }

    const [restaurant] = await conn.query(`SELECT name, address FROM restaurants WHERE id = ?`, [reservation.restaurant_id]);

    const tableRows = await conn.query(
      `
          SELECT t.id AS table_id, t.table_type
          FROM reservation_tables rt
          JOIN tables t ON t.id = rt.table_id
          WHERE rt.reservation_id = ?
        `,
      [reservationId],
    );

    return {
      status: 200,
      data: {
        ...reservation,
        tables: tableRows,
        restaurant,
      },
    };
  } catch (error) {
    console.error('Error getReservationById:', error);
    return { message: 'Server error', status: 500 };
  } finally {
    conn.release();
  }
};

export async function releaseExpiredHolds(conn: PoolConnection) {
  const expiredHolds = await conn.query(`SELECT DISTINCT reservation_id FROM reservation_tables WHERE status = 'HOLDING' AND hold_expiration < NOW()`);

  console.log('🚀 ~ releaseExpiredHolds ~ expiredHolds:', expiredHolds);
  const reservationIds = (expiredHolds as any[]).map((r) => r.reservation_id);

  if (reservationIds.length > 0) {
    await conn.query(`DELETE FROM reservation_tables WHERE reservation_id IN (?) AND status = 'HOLDING'`, [reservationIds]);

    for (const resId of reservationIds) {
      const remaining = await conn.query(`SELECT COUNT(*) AS cnt FROM reservation_tables WHERE reservation_id = ?`, [resId]);

      console.log('🚀 ~ releaseExpiredHolds ~ remaining:', (remaining as any)[0].cnt, remaining);
      if (Number((remaining as any)[0].cnt) === 0) {
        await conn.query(`UPDATE reservations SET status = 'CANCELLED' WHERE id = ?`, [resId]);
      }
    }
  }

  return { released: reservationIds.length };
}
