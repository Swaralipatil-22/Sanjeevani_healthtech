import type { IncomingMessage, ServerResponse } from "node:http";

import { pino } from "pino";
import { pinoHttp } from "pino-http";

import { env } from "@/utils/env.js";

const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.current_password",
  "req.body.new_password",
  "res.headers['set-cookie']",
];

export const Logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: REDACTED_PATHS, censor: "[REDACTED]" },
  base: { service: "sanjeevani-patient-service" },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l" },
        },
      }
    : {}),
});

export const HTTPLogger = pinoHttp({
  logger: Logger,
  customLogLevel: (
    _request: IncomingMessage,
    response: ServerResponse,
    error?: Error,
  ): "error" | "info" | "warn" => {
    if (error || response.statusCode >= 500) return "error";
    if (response.statusCode >= 400) return "warn";
    return "info";
  },
  customProps: (request: IncomingMessage) => ({
    request_id: (request as IncomingMessage & { request_id?: string })
      .request_id,
  }),
  serializers: {
    req: (request) => ({
      method: request.method,
      url: request.url,
      remote_address: request.remoteAddress,
    }),
    res: (response) => ({ status_code: response.statusCode }),
  },
});
