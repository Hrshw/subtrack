// Type declarations for backend compiled modules
// These files exist at build time in backend/dist/

declare module '../backend/dist/config/db' {
    export function connectDB(): Promise<void>;
}

declare module '../backend/dist/routes/userRoutes' {
    import { Router } from 'express';
    const router: Router;
    export default router;
}

declare module '../backend/dist/routes/connectionRoutes' {
    import { Router } from 'express';
    const router: Router;
    export default router;
}

declare module '../backend/dist/routes/scanRoutes' {
    import { Router } from 'express';
    const router: Router;
    export default router;
}

declare module '../backend/dist/routes/stripeRoutes' {
    import { Router } from 'express';
    const router: Router;
    export default router;
}

declare module '../backend/dist/routes/waitlistRoutes' {
    import { Router } from 'express';
    const router: Router;
    export default router;
}

declare module '../backend/dist/routes/notificationRoutes' {
    import { Router } from 'express';
    const router: Router;
    export default router;
}

