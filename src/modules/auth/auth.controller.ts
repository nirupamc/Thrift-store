import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as AuthService from './auth.service';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { UnauthorizedError } from '../../utils/AppError';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const result = await AuthService.register(input);

  sendSuccess(res, result, 'Account created successfully', StatusCodes.CREATED);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await AuthService.login(input);

  sendSuccess(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshInput;
  const result = await AuthService.refresh(refreshToken);

  sendSuccess(res, result, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  await AuthService.logout(req.user.sub);

  sendSuccess(res, null, 'Logged out successfully');
});
