import express from 'express';
import {
  checkCanReviewController,
  createReviewController,
  createUser,
  getAllUser,
  getReservationsByUserId,
  getUserById,
  updateUserInfo,
  updateUserPassword,
} from '../controllers/userController';
import { optionalAuthentication } from '../middlewares/authenticate';

const router = express.Router();

router.get('/users', getAllUser as any);
router.post('/users', createUser as any);
router.get('/user-info', optionalAuthentication, getUserById as any);
router.put('/user-info', optionalAuthentication, updateUserInfo as any);
router.put('/user/update-password', optionalAuthentication, updateUserPassword as any);
router.get('/user/reservations', optionalAuthentication, getReservationsByUserId as any);
router.get('/can-review', optionalAuthentication, checkCanReviewController as any);
router.post('/review', optionalAuthentication, createReviewController as any);

export default router;
