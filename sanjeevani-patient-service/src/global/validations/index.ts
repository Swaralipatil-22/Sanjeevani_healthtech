import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AnySchema } from "yup";

import { CustomError } from "@/utils/customerror.js";

type ValidationTarget = "body" | "params" | "query";

/**
 * Validates and — importantly — *replaces* the request segment with Yup's
 * cast output, so controllers receive coerced, stripped values rather than
 * raw strings from the wire.
 */
export const GlobalRequestValidator =
  (schema: AnySchema, target: ValidationTarget = "body"): RequestHandler =>
  async (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validated = await schema.validate(request[target], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (target === "body") request.body = validated;
      else Object.defineProperty(request, target, { value: validated });

      next();
    } catch (error) {
      next(CustomError.from(error));
    }
  };
