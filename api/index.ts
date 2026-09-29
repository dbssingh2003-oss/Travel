import type { IncomingMessage, ServerResponse } from "http";
import { buildApp } from "../apps/api/src/app";
import type { FastifyInstance } from "fastify";

let appPromise: Promise<FastifyInstance> | null = null;

async function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  // CORS Preflight fast-path
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Request-Id");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.end();
    return;
  }

  try {
    const app = await getApp();

    // Reconstruct proper client URL if rewritten by Vercel
    const matchedPath = req.headers["x-matched-path"] as string | undefined;
    const routeParam = req.query?.__route as string | undefined;
    const pathParam = req.query?.path;

    if (routeParam) {
      req.url = routeParam;
    } else if (matchedPath) {
      req.url = matchedPath;
    } else if (pathParam) {
      const subPath = Array.isArray(pathParam) ? pathParam.join("/") : pathParam;
      req.url = subPath.startsWith("/") ? `/api${subPath}` : `/api/${subPath}`;
    }

    // Ensure URL has /api prefix for Fastify router matching
    if (!req.url.startsWith("/api") && !req.url.startsWith("/health")) {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }

    // Delegate to Fastify HTTP server
    app.server.emit("request", req, res);
  } catch (err: any) {
    console.error("[Vercel API Gateway Error]", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: err.message || "An unexpected error occurred in Vercel function.",
          },
        })
      );
    }
  }
}
