import { reservationType } from '../shares/type';
import pool from '../config/db';
import { PoolConnection } from 'mariadb';

// Helper để xác định time_slot
function determineTimeSlot(arrival_time: string) {
  const hour = Number(arrival_time.split(':')[0]);
  return hour < 15 ? 'LUNCH' : 'DINNER';
}

type Table = { id: number; type: number };

async function allocateTables(restaurant_id: number, guest_count: number, date: string, timeSlot: string, conn: PoolConnection) {
  if (guest_count <= 0) return null;

  const rows = await conn.query(
    `
    SELECT 
      t.id, 
      CAST(t.table_type AS UNSIGNED) AS table_type,
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

  const tables = rows as {
    id: number;
    table_type: number;
    quantity: number;
    reserved_count: number;
  }[];

  const availableTables: Table[] = [];

  for (const t of tables) {
    const availableCount = Math.min(Number(t.quantity) - Number(t.reserved_count), 10); // giới hạn để tránh treo server
    for (let i = 0; i < availableCount; i++) {
      availableTables.push({ id: t.id, type: t.table_type });
    }
  }

  availableTables.sort((a, b) => b.type - a.type); // Ưu tiên bàn lớn

  let bestCombo: Table[] = [];
  let bestRemaining = Infinity;
  let bestTableCount = Infinity;

  function backtrack(index: number, path: Table[], total: number) {
    if (path.length > 10) return; // tránh quá nhiều bàn

    if (total >= guest_count) {
      const remaining = total - guest_count;
      if (path.length < bestTableCount || (path.length === bestTableCount && remaining < bestRemaining)) {
        bestCombo = [...path];
        bestRemaining = remaining;
        bestTableCount = path.length;
      }
    }

    for (let i = index; i < availableTables.length; i++) {
      path.push(availableTables[i]);
      backtrack(i + 1, path, total + availableTables[i].type);
      path.pop();
    }
  }

  backtrack(0, [], 0);

  return bestCombo.length > 0 ? [...new Set(bestCombo.map((t) => t.id))] : null;
}

// async function allocateTables(restaurant_id: number, guest_count: number, date: string, timeSlot: string, conn: PoolConnection) {
//   const rows = await conn.query(
//     `
//       SELECT
//         t.id,
//         CAST(t.table_type AS UNSIGNED) AS table_type,
//         t.quantity,
//         COUNT(rt.id) AS reserved_count
//       FROM tables t
//       LEFT JOIN reservation_tables rt
//         ON rt.table_id = t.id
//         AND rt.status IN ('CONFIRMED', 'HOLDING')
//       LEFT JOIN reservations r
//         ON r.id = rt.reservation_id
//         AND r.date = ?
//         AND r.time_slot = ?
//       WHERE t.restaurant_id = ?
//       GROUP BY t.id
//       HAVING (t.quantity - reserved_count) > 0
//     `,
//     [date, timeSlot, restaurant_id],
//   );

//   const tables = rows as {
//     id: number;
//     table_type: number;
//     quantity: number;
//     reserved_count: number;
//   }[];

//   const available: { tableId: number; type: number; instanceId: number }[] = [];
//   let instanceIndex = 0;

//   for (const t of tables) {
//     const availableCount = Number(t.quantity) - Number(t.reserved_count);
//     for (let i = 0; i < availableCount; i++) {
//       available.push({
//         instanceId: instanceIndex++, // dùng để phân biệt mỗi "slot"
//         tableId: t.id,
//         type: t.table_type,
//       });
//     }
//   }

//   available.sort((a, b) => b.type - a.type);

//   let bestChoice: { ids: number[]; over: number } = { ids: [], over: Infinity };

//   function dfs(index: number, currentInstanceIds: number[], total: number) {
//     if (total >= guest_count) {
//       const over = total - guest_count;
//       const tableIds = [...new Set(currentInstanceIds.map((i) => available[i].tableId))];

//       if (
//         total >= guest_count &&
//         (total < guest_count + bestChoice.over || // ít dư hơn
//           (total === guest_count + bestChoice.over && tableIds.length < bestChoice.ids.length)) // hoặc dư bằng nhau nhưng ít bàn hơn
//       ) {
//         bestChoice = { ids: tableIds, over: total - guest_count };
//       }
//       return;
//     }

//     if (index >= available.length) return;

//     // Chọn instance này
//     currentInstanceIds.push(index);
//     dfs(index + 1, currentInstanceIds, total + available[index].type);

//     // Bỏ instance này
//     currentInstanceIds.pop();
//     dfs(index + 1, currentInstanceIds, total);
//   }
//   dfs(0, [], 0);

//   console.log('🚀 ~ allocateTables ~ bestChoice:', bestChoice);
//   return bestChoice.ids.length ? [...new Set(bestChoice.ids)] : null;
// }

async function allocateTables2(restaurant_id: number, guest_count: number, date: string, timeSlot: string, conn: PoolConnection) {
  // Lấy danh sách bàn có sẵn từ database
  const rows = await conn.query(
    `
      SELECT 
        t.id, 
        CAST(t.table_type AS UNSIGNED) AS table_type,
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

  const tables = rows as {
    id: number;
    table_type: number;
    quantity: number;
    reserved_count: number;
  }[];

  // Tạo danh sách các bàn có sẵn
  const availableTables: Array<{
    tableId: number;
    type: number;
    count: number;
  }> = tables.map((t) => ({
    tableId: t.id,
    type: t.table_type,
    count: Number(t.quantity) - Number(t.reserved_count),
  }));

  // Sắp xếp bàn từ lớn đến nhỏ theo kích thước
  availableTables.sort((a, b) => b.type - a.type);

  // Phân bổ bàn theo thuật toán tham lam cải tiến
  const result = allocateTablesByImprovedGreedy(availableTables, guest_count);

  // Ghi log kết quả
  console.log('🚀 ~ allocateTables ~ result:', result);

  // Đảm bảo trả về danh sách ID bàn duy nhất
  return result.tableIds.length ? [...new Set(result.tableIds)] : null;
}

/**
 * Hàm phân bổ bàn theo thuật toán tham lam cải tiến
 */
function allocateTablesByImprovedGreedy(
  availableTables: Array<{ tableId: number; type: number; count: number }>,
  guestCount: number,
): { tableIds: number[]; totalSeats: number; overCapacity: number } {
  // Nếu không có bàn nào khả dụng
  if (availableTables.length === 0) {
    return { tableIds: [], totalSeats: 0, overCapacity: Infinity };
  }

  // Tạo danh sách tất cả các tổ hợp bàn có thể
  let bestAllocation: {
    tableIds: number[];
    usedTables: Record<number, number>;
    totalSeats: number;
    remainingGuests: number;
    overCapacity: number;
  } = {
    tableIds: [],
    usedTables: {},
    totalSeats: 0,
    remainingGuests: guestCount,
    overCapacity: Infinity,
  };

  // Thử phân bổ từ bàn lớn đến bàn nhỏ
  function tryLargeToSmall() {
    const tablesClone = availableTables.map((t) => ({ ...t }));
    const usedTables: Record<number, number> = {};
    let totalSeats = 0;
    let remainingGuests = guestCount;

    // Ưu tiên dùng bàn lớn nhất có thể
    for (let i = 0; i < tablesClone.length; i++) {
      const table = tablesClone[i];

      while (table.count > 0) {
        // Nếu bàn này có kích thước vừa đủ hoặc lớn hơn số khách còn lại
        if (table.type >= remainingGuests) {
          table.count--;
          usedTables[table.tableId] = (usedTables[table.tableId] || 0) + 1;
          totalSeats += table.type;
          remainingGuests = 0;
          break; // Đã phân bổ đủ chỗ
        }
        // Nếu vẫn còn nhiều khách, sử dụng bàn này
        else if (remainingGuests > table.type) {
          table.count--;
          usedTables[table.tableId] = (usedTables[table.tableId] || 0) + 1;
          totalSeats += table.type;
          remainingGuests -= table.type;
        }
        // Nếu bàn quá lớn cho số khách còn lại, thử bàn tiếp theo
        else {
          break;
        }
      }

      if (remainingGuests === 0) break;
    }

    return {
      tableIds: Object.keys(usedTables).map(Number),
      usedTables,
      totalSeats,
      remainingGuests,
      overCapacity: totalSeats - guestCount,
    };
  }

  // Thử tất cả các cách phân bổ có thể
  function tryAllCombinations() {
    const bestSolutions: Array<{
      tableIds: number[];
      usedTables: Record<number, number>;
      totalSeats: number;
      remainingGuests: number;
      overCapacity: number;
    }> = [];

    // Hàm đệ quy để thử các tổ hợp
    function backtrack(index: number, currentTables: Record<number, number>, totalSeats: number, remainingGuests: number) {
      // Nếu đã đủ chỗ cho khách
      if (remainingGuests <= 0) {
        bestSolutions.push({
          tableIds: Object.keys(currentTables).map(Number),
          usedTables: { ...currentTables },
          totalSeats,
          remainingGuests,
          overCapacity: totalSeats - guestCount,
        });
        return;
      }

      // Nếu đã xem xét hết các loại bàn
      if (index >= availableTables.length) return;

      const table = availableTables[index];
      const originalCount = currentTables[table.tableId] || 0;

      // Thử không sử dụng bàn này
      backtrack(index + 1, currentTables, totalSeats, remainingGuests);

      // Thử sử dụng bàn này với số lượng khác nhau
      for (let i = 1; i <= table.count; i++) {
        currentTables[table.tableId] = originalCount + i;
        const newTotalSeats = totalSeats + table.type * i;
        const newRemainingGuests = remainingGuests - table.type * i;

        // Chỉ tiếp tục nếu có tiến triển
        if (newRemainingGuests < remainingGuests) {
          backtrack(index + 1, currentTables, newTotalSeats, newRemainingGuests);

          // Nếu đã đủ chỗ, không cần thêm bàn cùng loại
          if (newRemainingGuests <= 0) break;
        }
      }

      // Khôi phục trạng thái
      currentTables[table.tableId] = originalCount;
    }

    // Bắt đầu với bàn đầu tiên
    backtrack(0, {}, 0, guestCount);

    // Để tránh tràn bộ nhớ, giới hạn số lượng giải pháp xem xét
    const MAX_SOLUTIONS = 10;
    if (bestSolutions.length > MAX_SOLUTIONS) {
      bestSolutions.length = MAX_SOLUTIONS;
    }

    return bestSolutions;
  }

  // Thử phương pháp tham lam trước
  const greedyResult = tryLargeToSmall();

  // Nếu phương pháp tham lam đã giải quyết vấn đề, sử dụng kết quả đó
  if (greedyResult.remainingGuests === 0) {
    return {
      tableIds: greedyResult.tableIds,
      totalSeats: greedyResult.totalSeats,
      overCapacity: greedyResult.overCapacity,
    };
  }

  // Nếu phương pháp tham lam không hoàn hảo, thử các tổ hợp khác
  // Giới hạn số lượng bàn xem xét để tránh tràn bộ nhớ
  const limitedTables = availableTables.length > 5 ? availableTables.slice(0, 5) : availableTables;

  const combinations = tryAllCombinations();

  // Tìm giải pháp tốt nhất từ các tổ hợp
  let bestSolution = greedyResult;
  for (const solution of combinations) {
    if (solution.remainingGuests <= 0) {
      if (
        solution.overCapacity < bestSolution.overCapacity ||
        (solution.overCapacity === bestSolution.overCapacity && solution.tableIds.length < bestSolution.tableIds.length)
      ) {
        bestSolution = solution;
      }
    }
  }

  // Nếu không tìm được giải pháp, thử chọn bổ sung thêm bàn nhỏ nhất cho số khách còn lại
  if (bestSolution.remainingGuests > 0 && availableTables.length > 0) {
    const smallestTable = availableTables[availableTables.length - 1];
    if (smallestTable.count > 0) {
      bestSolution.usedTables[smallestTable.tableId] = (bestSolution.usedTables[smallestTable.tableId] || 0) + 1;
      bestSolution.totalSeats += smallestTable.type;
      bestSolution.remainingGuests -= smallestTable.type;
      bestSolution.overCapacity = bestSolution.totalSeats - guestCount;
      bestSolution.tableIds = Object.keys(bestSolution.usedTables).map(Number);
    }
  }

  return {
    tableIds: bestSolution.tableIds,
    totalSeats: bestSolution.totalSeats,
    overCapacity: bestSolution.overCapacity,
  };
}

export const reservationHoldService = async (params: reservationType) => {
  const { restaurant_id, user_id, guest_count, date, arrival_time, phone, note } = params;

  const conn = await pool.getConnection();
  try {
    // await conn.beginTransaction();

    // const timeSlot = determineTimeSlot(arrival_time);
    // const allocatedTableIds = await allocateTables(restaurant_id, guest_count, date, timeSlot, conn);

    // if (!allocatedTableIds) {
    //   await conn.rollback();
    //   return {
    //     status: 400,
    //     message: 'Không đủ bàn để phục vụ số lượng khách này.',
    //   };
    // }

    // const holdExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5m

    // const reservationResult = await conn.execute(
    //   `INSERT INTO reservations (restaurant_id, user_id, phone, guest_count, date, arrival_time, time_slot, note)
    //        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    //   [restaurant_id, user_id, phone, guest_count, date, arrival_time, timeSlot, note || null],
    // );
    // console.log('🚀 ~ reservationHoldService ~ reservationResult:', reservationResult);

    // const reservationId = typeof reservationResult.insertId === 'bigint' ? Number(reservationResult.insertId) : reservationResult.insertId;

    // const insertTablePromises = allocatedTableIds.map((tableId) =>
    //   conn.execute(
    //     `INSERT INTO reservation_tables (reservation_id, table_id, status, hold_expiration)
    //          VALUES (?, ?, 'HOLDING', ?)`,
    //     [reservationId, tableId, holdExpiration],
    //   ),
    // );
    // await Promise.all(insertTablePromises);

    // await conn.commit();

    // return { hold_id: reservationId, expired_at: holdExpiration.toISOString() };
    const test = await allocateTables(15, 2, '2025-07-22', 'LUNCH', conn);
    console.log('🚀 ~ allocateTables ~ allocateTables:', test);
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

    // Check hold có còn hiệu lực không
    const [rows] = await conn.query(`SELECT * FROM reservation_tables WHERE reservation_id = ? AND status = 'HOLDING' AND hold_expiration > NOW()`, [
      reservation_id,
    ]);

    if (!rows.length) {
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

export const getReservationByIdService = async (reservationId: number) => {
  const conn = await pool.getConnection();
  try {
    const reservationRows = await conn.query(
      `
          SELECT r.id AS reservation_id, r.restaurant_id, r.guest_count, r.phone, r.note,
                 r.date, r.arrival_time, r.time_slot,
                 MIN(rt.hold_expiration) AS expired_at
          FROM reservations r
          JOIN reservation_tables rt ON rt.reservation_id = r.id
          WHERE r.id = ?
            AND rt.status = 'HOLDING'
            AND rt.hold_expiration > NOW()
          GROUP BY r.id
        `,
      [reservationId],
    );
    console.log('🚀 ~ getReservationByIdService ~ reservationRows:', reservationRows);

    const reservation = (reservationRows as any[])[0];

    if (!reservation) {
      return {
        status: 404,
        message: 'Reservation not found or expired',
      };
    }

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
      },
    };
  } catch (error) {
    console.error('Error getReservationById:', error);
    return { message: 'Server error', status: 500 };
  } finally {
    conn.release();
  }
};

// export async function releaseExpiredHolds(conn: PoolConnection) {
//     const [expiredHolds] = await conn.query(
//       `SELECT DISTINCT reservation_id FROM reservation_tables WHERE status = 'HOLDING' AND hold_expiration < NOW()`
//     );

//     const reservationIds = (expiredHolds as any[]).map(r => r.reservation_id);

//     if (reservationIds.length > 0) {
//       await conn.query(
//         `DELETE FROM reservation_tables WHERE reservation_id IN (?) AND status = 'HOLDING'`,
//         [reservationIds]
//       );

//       // Set reservation to CANCELLED nếu không còn bàn nào giữ
//       for (const resId of reservationIds) {
//         const [remaining] = await conn.query(
//           `SELECT COUNT(*) AS cnt FROM reservation_tables WHERE reservation_id = ?`,
//           [resId]
//         );

//         if ((remaining as any)[0].cnt === 0) {
//           await conn.query(`UPDATE reservations SET status = 'CANCELLED' WHERE id = ?`, [resId]);
//         }
//       }
//     }

//     return { released: reservationIds.length };
//   }
