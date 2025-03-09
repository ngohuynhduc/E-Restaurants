import express from 'express';
import { createUser, getAllUser, getUserById } from '../controllers/userController';

const router = express.Router();

router.get('/users', getAllUser as any);
router.post('/users', createUser as any);
router.get('/users/:id', getUserById as any);
// router.put('/update-users/:id', updateUser);
// router.delete('/delete-users/:id', deleteUser);

export default router;
