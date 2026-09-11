import type { NextFunction, Request, Response } from "express";

/**
 * Standardised response envelope shared by every endpoint:
 *
 *   { success, status_code, request_id, request_timestamp, data }
 *
 * List endpoints put `{ data: [...], count: n }` in `data`, single-entity
 * endpoints put the record itself, and errors put `{ detail }`.
 */
export const customResponseInjector = (
  _request: Request,
  response: Response,
  next: NextFunction,
): void => {
  response.customResponse = (
    status_code: number,
    data: unknown,
    success: boolean,
    request_id: string,
    request_timestamp: string,
  ): Response =>
    response.status(status_code).json({
      success,
      status_code,
      request_id,
      request_timestamp,
      data,
    });

  next();
};
