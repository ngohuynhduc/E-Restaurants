import express from 'express';
import { authLogin, authSignup } from '../controllers/authController';

const router = express.Router();

router.post('/login', authLogin as any);
router.post('/signup', authSignup as any);
// router.get('/users/:id', getUserById as any);
// router.put('/update-users/:id', updateUser);
// router.delete('/delete-users/:id', deleteUser);

export default router;
