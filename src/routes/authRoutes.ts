import express from 'express';
import { authBusinessRegister, authLogin, authSignup } from '../controllers/authController';
import { optionalAuthentication } from '../middlewares/authenticate';

const router = express.Router();

router.post('/login', authLogin as any);
router.post('/signup', authSignup as any);
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.send('Logout success!');
});
router.post('/business-register', optionalAuthentication, authBusinessRegister as any);

export default router;
