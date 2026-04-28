import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "../../config/env";

function getConnectSrc(): string[] {
  if (config.corsOrigin === "*") {
    return ["'self'", "*"];
  }

  return ["'self'", ...config.corsOrigin];
}

export function applySecurity(app: express.Express): void {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: getConnectSrc()
      }
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true }
  }));

  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: false
    })
  );

  app.use(express.json({ limit: "1mb" }));
}
