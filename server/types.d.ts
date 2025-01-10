declare namespace Express {
    interface Request {
      user?: {
        id: number;      // Add `id` to `user`
        username: string;
      };
    }
  }
  