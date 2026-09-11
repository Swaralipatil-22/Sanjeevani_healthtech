import type { NextFunction, Request, Response } from "express";

import _ from "lodash";

import { CustomError } from "@/utils/customerror.js";
import { env } from "@/utils/env.js";

const ALWAYS_ALLOWED = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export const hostnameValidator = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  const hostname = _.split(request.hostname, ":")[0] ?? "";
  const configured = _.map(_.split(env.ALLOWED_HOSTNAMES, ","), (item) =>
    item.trim(),
  );

  if (
    _.includes(configured, "*") ||
    ALWAYS_ALLOWED.has(hostname) ||
    _.includes(configured, hostname)
  ) {
    next();
    return;
  }

  next(new CustomError(400, `Host "${hostname}" is not allowed.`));
};
