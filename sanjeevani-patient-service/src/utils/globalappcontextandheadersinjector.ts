import type { NextFunction, Request, Response } from "express";

import { v7 as uuidv7 } from "uuid";

/**
 * Stamps every request with a correlation id and timestamp that flow through
 * the logger, the response envelope and the audit trail.
 */
export const globalAppContextAndHeadersInjector = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  request.request_id =
    (request.headers["x-request-id"] as string | undefined) ?? uuidv7();
  request.request_timestamp = new Date().toISOString();

  response.setHeader("x-request-id", request.request_id);
  response.setHeader("x-request-timestamp", request.request_timestamp);
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");

  next();
};
