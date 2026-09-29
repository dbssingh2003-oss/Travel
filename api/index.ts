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
  const origin = req.headers?.origin || "*";

  // 1. CORS Preflight fast-path
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Request-Id");
    if (origin !== "*") {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Access-Control-Max-Age", "86400");
    res.end();
    return;
  }

  // 2. Intercept WebSocket polling requests on serverless to prevent continuous 405s
  const rawUrl = req.url || "/";
  if (rawUrl.startsWith("/ws") || rawUrl.startsWith("/api/ws")) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.end(
      JSON.stringify({
        status: "serverless_notice",
        message: "Socket.io real-time server runs on dedicated host. Fallback REST active.",
      })
    );
    return;
  }

  try {
    const app = await getApp();

    // 3. Reconstruct client URL and preserve query parameters
    const queryIdx = rawUrl.indexOf("?");
    const queryString = queryIdx !== -1 ? rawUrl.slice(queryIdx) : "";
    let rawPath = queryIdx !== -1 ? rawUrl.slice(0, queryIdx) : rawUrl;

    const matchedPath = req.headers["x-matched-path"] as string | undefined;
    const routeParam = req.query?.__route as string | undefined;
    const pathParam = req.query?.path;

    if (routeParam) {
      const qIdx = routeParam.indexOf("?");
      rawPath = qIdx !== -1 ? routeParam.slice(0, qIdx) : routeParam;
    } else if (pathParam) {
      const subPath = Array.isArray(pathParam) ? pathParam.join("/") : pathParam;
      rawPath = subPath.startsWith("/") ? `/api${subPath}` : `/api/${subPath}`;
    } else if (matchedPath && matchedPath !== "/api" && matchedPath !== "/api/index") {
      const qIdx = matchedPath.indexOf("?");
      rawPath = qIdx !== -1 ? matchedPath.slice(0, qIdx) : matchedPath;
    }

    // Ensure path has /api prefix for Fastify router matching (except /health)
    if (!rawPath.startsWith("/api") && !rawPath.startsWith("/health")) {
      rawPath = `/api${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
    }

    req.url = `${rawPath}${queryString}`;

    // Add CORS headers to all responses
    if (origin !== "*") {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
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
