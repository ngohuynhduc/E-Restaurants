import express from 'express';
import { optionalAuthentication } from '../middlewares/authenticate';
import {
  createCategory,
  deleteCategory,
  getListRestaurantAdmin,
  updateCategory,
  updateRestaurantStatus,
  updateRestaurantController,
  getReservationsByRestaurant,
  getRestaurantsByOwner,
  updateReservationStatus,
  getPromotionsByRestaurantId,
  deletePromotionById,
} from '../controllers/adminController';

const router = express.Router();

router.post('/categories', optionalAuthentication, createCategory as any);
router.put('/categories/:id', optionalAuthentication, updateCategory as any);
router.delete('/categories/:id', optionalAuthentication, deleteCategory as any);
router.get('/restaurants', optionalAuthentication, getListRestaurantAdmin as any);
router.patch('/restaurants/:id', optionalAuthentication, updateRestaurantStatus as any);
router.put('/restaurants/:id', optionalAuthentication, updateRestaurantController as any);
router.get('/restaurant/reservations/:restaurantId', optionalAuthentication, getReservationsByRestaurant as any);
router.get('/restaurant/owner/:ownerId', optionalAuthentication, getRestaurantsByOwner as any);
router.patch('/reservation/:id', optionalAuthentication, updateReservationStatus as any);
router.get('/promotions/:restaurantId', optionalAuthentication, getPromotionsByRestaurantId as any);
router.delete('/promotions/:id', optionalAuthentication, deletePromotionById as any);

// router.post('/hold', optionalAuthentication, reservationHold as any);
// router.get('/check-availability', optionalAuthentication, checkAvailablility as any);
// router.get('/get-reservation/:reservationId', optionalAuthentication, getReservationById as any);
export default router;
