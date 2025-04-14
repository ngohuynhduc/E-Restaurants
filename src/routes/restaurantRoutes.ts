import express from 'express';
import { getCategories, getListRestaurant, getNewestRestaurant, getRestaurantById } from '../controllers/restaurantController';

const router = express.Router();

router.get('/categories', getCategories as any);
router.get('/newest', getNewestRestaurant as any);
router.get('/restaurants', getListRestaurant as any);
router.get('/:id', getRestaurantById as any);
export default router;
