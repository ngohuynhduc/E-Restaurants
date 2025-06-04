import express from 'express';
import {
  createPromotion,
  getCategories,
  getListRestaurant,
  getNewestRestaurant,
  getRestaurantById,
  getReviewsByRestaurantController,
} from '../controllers/restaurantController';
import { optionalAuthentication } from '../middlewares/authenticate';

const router = express.Router();

router.get('/categories', getCategories as any);
router.get('/newest', getNewestRestaurant as any);
router.get('/restaurants', getListRestaurant as any);
router.get('/:id', getRestaurantById as any);
router.get('/reviews/:restaurantId', getReviewsByRestaurantController as any);
router.post('/promotions', optionalAuthentication, createPromotion as any);

export default router;
