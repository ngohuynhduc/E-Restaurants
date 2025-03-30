import express from 'express';
import { getNewestRestaurant } from '../controllers/restaurantController';

const router = express.Router();

router.get('/newest', getNewestRestaurant as any);

export default router;
