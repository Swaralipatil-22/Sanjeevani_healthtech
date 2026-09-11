import type { NextFunction, Request, Response } from "express";

import { Logger } from "@/logger/index.js";
import { CustomError } from "@/utils/customerror.js";
import { env } from "@/utils/env.js";

export const notFoundHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  next(
    new CustomError(404, `Route ${request.method} ${request.path} not found.`),
  );
};

export const errorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const customError = CustomError.from(error);

  const log = {
    request_id: request.request_id,
    method: request.method,
    path: request.originalUrl,
    status_code: customError.status_code,
    detail: customError.message,
    ...(env.isProduction ? {} : { stack: customError.stack }),
  };

  if (customError.status_code >= 500) Logger.error(log, "Unhandled error");
  else Logger.warn(log, "Request rejected");

  response.customResponse(
    customError.status_code,
    customError.toDetails(),
    false,
    request.request_id,
    request.request_timestamp,
  );
};
