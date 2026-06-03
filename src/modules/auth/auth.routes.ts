import { Router } from 'express';

import { validateRequest } from '../../middleware/validate.middleware.js';
import { AuthController } from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
} from './auth.validation.js';

const authController = new AuthController();

export const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), authController.register);
authRouter.post('/login', validateRequest(loginSchema), authController.login);

export default authRouter;;