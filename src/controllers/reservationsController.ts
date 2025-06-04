import { NextFunction, Response, Request } from 'express';
import {
  checkAvailabilityService,
  getReservationByIdService,
  reservationCancelService,
  reservationHoldService,
  reservationService,
} from '../models/reservationsModel';

const handleResponse = (res: Response, status: number, message: string, data: any) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
};

export const reservationHold = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { restaurant_id, user_id, phone, guest_count, date, arrival_time, note } = req.body;

    if (!restaurant_id || !guest_count || !date || !arrival_time) {
      return handleResponse(res, 400, 'Vui lòng nhập đầy đủ thông tin', null);
    }

    // if (!userId) {
    //   return handleResponse(res, 401, 'Vui lòng đăng nhập để đặt bàn', null);
    // }
    const result = (await reservationHoldService(req.body)) as any;
    console.log('🚀 ~ reservationHold ~ result:', result);
    return handleResponse(res, 200, 'Success', result);
  } catch (error) {
    next(error);
  }
};

export const reservation = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { reservation_id, phone, note, email, full_name, promotion_id } = req.body;
    console.log('🚀 ~ reservation ~ promotion_id:', promotion_id);

    if (!reservation_id || !phone || !email || !full_name) {
      return handleResponse(res, 400, 'Vui lòng nhập đầy đủ thông tin', null);
    }

    // const userId = req.user?.id;
    // if (!userId) {
    //   return handleResponse(res, 401, 'Vui lòng đăng nhập để đặt bàn', null);
    // }
    const result = await reservationService(reservation_id, phone, note, email, full_name, promotion_id);
    console.log('🚀 ~ reservation ~ result:', result);
    if (result?.status !== 200) {
      return handleResponse(res, result.status, result.message, null);
    }
    return handleResponse(res, 200, 'Đặt bàn thành công', result);
  } catch (error) {
    next(error);
  }
};

export const checkAvailablility = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { restaurant_id, date, arrival_time, guest_count } = req.query;
    console.log('🚀 ~ checkAvailablility ~ req.query:', req.query);

    if (!restaurant_id || !date || !arrival_time || !guest_count) {
      return handleResponse(res, 400, 'Vui lòng nhập đầy đủ thông tin', null);
    }

    const userId = req.user?.id;
    if (!userId) {
      return handleResponse(res, 401, 'Vui lòng đăng nhập để đặt bàn', null);
    }

    const result = (await checkAvailabilityService(restaurant_id, date, arrival_time, guest_count)) as any;
    console.log('🚀 ~ checkAvailablility ~ result:', result);
    return handleResponse(res, 200, 'Success', result);
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const reservation_id = parseInt(req.params.reservationId);
    const { isHolding } = req.query;

    if (!reservation_id) {
      return handleResponse(res, 400, 'Vui lòng nhập đầy đủ thông tin', null);
    }

    // const userId = req.user?.id;
    // if (!userId) {
    //   return handleResponse(res, 401, 'Vui lòng đăng nhập để đặt bàn', null);
    // }

    const result = (await getReservationByIdService(reservation_id, isHolding === 'true')) as any;
    if (result?.status !== 200) {
      return handleResponse(res, result.status, result.message, null);
    }
    return handleResponse(res, 200, 'Success', result);
  } catch (error) {
    next(error);
  }
};

export const reservationCancel = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const reservation_id = parseInt(req.params.reservationId);
    if (!reservation_id) {
      return handleResponse(res, 400, 'Vui lòng nhập đầy đủ thông tin', null);
    }

    const userId = req.user?.id;
    if (!userId) {
      return handleResponse(res, 401, 'Vui lòng đăng nhập để đặt bàn', null);
    }

    const result = await reservationCancelService({ reservation_id, user_id: userId });
    console.log('🚀 ~ reservationCancel ~ result:', result);
    if (result?.status !== 200) {
      return handleResponse(res, result.status, result.message, null);
    }
    return handleResponse(res, 200, 'Hủy đặt bàn thành công', result);
  } catch (error) {
    next(error);
  }
};
