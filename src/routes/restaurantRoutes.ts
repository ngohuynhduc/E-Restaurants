import express from 'express';
import { getCategories, getNewestRestaurant } from '../controllers/restaurantController';

const router = express.Router();

router.get('/categories', getCategories as any);
router.get('/newest', getNewestRestaurant as any);

export default router;
