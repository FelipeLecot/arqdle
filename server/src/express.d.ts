import type { SessionRow, UserRow } from './db-types';

declare global {
  namespace Express {
    interface Request {
      user?: UserRow;
      sessionRow?: SessionRow;
      sessionToken?: string;
    }
  }
}

export {};
