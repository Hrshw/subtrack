import { Request } from 'express';

// Extend Express Request to include Clerk auth
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId?: string;
                sessionId?: string;
                [key: string]: any;
            };
        }
    }
}

export { };
