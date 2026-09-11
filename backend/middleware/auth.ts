import { Request, Response, NextFunction } from 'express';
import { getUserByToken, StoredCitizenUser } from '../utils/storage.js';

export interface AuthenticatedRequest extends Request {
  user?: StoredCitizenUser;
  sessionToken?: string;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-session-token']) {
    token = String(req.headers['x-session-token']).trim();
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const user = getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session invalid or expired. Please log in again.' });
    return;
  }

  req.user = user;
  req.sessionToken = token;
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-session-token']) {
    token = String(req.headers['x-session-token']).trim();
  }

  if (token) {
    const user = getUserByToken(token);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }
  }

  next();
};
