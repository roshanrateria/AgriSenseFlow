import { app } from "../server/app";
import { registerRoutes } from "../server/routes";
import type { Request, Response, NextFunction } from "express";

let routesRegistered = false;

export default async function handler(req: any, res: any) {
    if (!routesRegistered) {
        await registerRoutes(app);

        // Add error handler that matches the one in server/app.ts
        app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
            const status = err.status || err.statusCode || 500;
            const message = err.message || "Internal Server Error";
            res.status(status).json({ message });
        });

        routesRegistered = true;
    }

    app(req, res);
}
