import type { Express } from "express";

import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { databaseManager } from "@/components/database/index.js";
import { runSeeder } from "@/components/database/seeder.js";
import {
  errorHandler,
  notFoundHandler,
} from "@/global/middlewares/errorhandlers/index.js";
import { HTTPLogger, Logger } from "@/logger/index.js";
import routes from "@/routes/index.js";
import { toList } from "@/utils/common.js";
import { customResponseInjector } from "@/utils/customresponse.js";
import { env } from "@/utils/env.js";
import { globalAppContextAndHeadersInjector } from "@/utils/globalappcontextandheadersinjector.js";
import { globalAppRateLimiter } from "@/utils/globalappratelimiter.js";
import { hostnameValidator } from "@/utils/hostnamevalidator.js";

const buildApplication = (): Express => {
  const application = express();

  // Behind a load balancer the client IP arrives in X-Forwarded-For; without
  // this the rate limiter would bucket every request under the proxy's IP.
  application.set("trust proxy", 1);
  application.disable("etag");
  application.disable("x-powered-by");

  if (env.ENABLE_HTTP_LOGGING) application.use(HTTPLogger);

  application.use(helmet({ contentSecurityPolicy: false }));
  application.use(globalAppContextAndHeadersInjector);
  application.use(customResponseInjector);
  application.use(hostnameValidator);
  application.use(globalAppRateLimiter);
  application.use(
    cors({
      origin: toList(env.ALLOWED_ORIGINS),
      credentials: true,
      exposedHeaders: ["Content-Disposition", "x-request-id"],
    }),
  );
  application.use(compression());
  application.use(express.json({ limit: "5mb" }));
  application.use(express.urlencoded({ extended: true, limit: "5mb" }));

  application.use(env.SERVICE_BASE_PATH, routes);

  application.use(notFoundHandler);
  application.use(errorHandler);

  return application;
};

export const application = buildApplication();

/**
 * Idempotent database bootstrap.
 *
 * A long-running server calls this once at startup. A serverless deployment
 * calls it on every invocation, where all but the first cold start resolve
 * the already-settled promise. Seeding is deliberately excluded - it belongs
 * to a deliberate startup, not to request handling.
 */
let bootstrapPromise: Promise<void> | null = null;

export const ensureBootstrapped = async (): Promise<void> => {
  bootstrapPromise ??= databaseManager.bootstrap();

  try {
    await bootstrapPromise;
  } catch (error) {
    // Let the next invocation retry rather than caching the failure forever.
    bootstrapPromise = null;
    throw error;
  }
};

const start = async (): Promise<void> => {
  try {
    await ensureBootstrapped();
    if (env.DB_SEED) await runSeeder();

    const server = application.listen(env.PORT, () => {
      Logger.info(
        `Sanjeevani Patient Service listening on http://localhost:${env.PORT}${env.SERVICE_BASE_PATH}`,
      );
    });

    const shutdown = (signal: string): void => {
      Logger.info(`${signal} received - shutting down gracefully.`);
      server.close(() => {
        void databaseManager.close().finally(() => process.exit(0));
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    Logger.error({ error }, "Failed to start the service.");
    process.exit(1);
  }
};

// Vitest and the Vercel function both import `application` directly; only a
// direct run should bind a port.
if (!process.env.VITEST && !process.env.VERCEL) await start();
