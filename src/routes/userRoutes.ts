import express from 'express';
import { createUser, getAllUser, getUserById } from '../controllers/userController';
import { optionalAuthentication } from '../middlewares/authenticate';

const router = express.Router();

router.get('/users', getAllUser as any);
router.post('/users', createUser as any);
router.get('/user-info', optionalAuthentication, getUserById as any);
// router.put('/update-users/:id', updateUser);
// router.delete('/delete-users/:id', deleteUser);

export default router;
