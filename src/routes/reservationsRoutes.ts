import express from 'express';
import { optionalAuthentication } from '../middlewares/authenticate';
import { checkAvailablility, getReservationById, reservation, reservationCancel, reservationHold } from '../controllers/reservationsController';

const router = express.Router();

router.post('/confirm', optionalAuthentication, reservation as any);
router.post('/hold', optionalAuthentication, reservationHold as any);
router.get('/check-availability', optionalAuthentication, checkAvailablility as any);
router.get('/get-reservation/:reservationId', optionalAuthentication, getReservationById as any);
router.put('/cancel/:reservationId', optionalAuthentication, reservationCancel as any);
export default router;
