import { Router } from 'express';

import { AuthController } from './auth.controller.js';

const authController = new AuthController();

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

export default authRouter;