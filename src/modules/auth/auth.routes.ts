import { Router } from 'express';
import * as AuthController from './auth.controller';
import { validate } from '../../middleware/validate';
import { protect } from '../../middleware/protect';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login',    authRateLimiter, validate(loginSchema),    AuthController.login);
router.post('/refresh',  validate(refreshSchema),                   AuthController.refresh);
router.post('/logout',   protect,                                   AuthController.logout);

export { router as authRouter };
