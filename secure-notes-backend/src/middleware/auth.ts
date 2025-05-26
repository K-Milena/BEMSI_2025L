import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_string';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = user;  // tutaj ustawiamy user bez "?"
    next();           // next() będzie wywołane tylko gdy jest OK
  } catch (err) {
    res.sendStatus(403);
  }
};



