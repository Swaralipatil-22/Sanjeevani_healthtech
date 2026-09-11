import type { Request } from "express";

import rateLimit from "express-rate-limit";
import _ from "lodash";

import { env } from "@/utils/env.js";

export const globalAppRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_IN_SECONDS * 1000,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Authenticated users are bucketed by token so a busy clinic on one NAT'd
  // connection cannot rate-limit its own staff.
  keyGenerator: (request: Request): string =>
    _.get(request, "headers.authorization", "") ||
    `${request.ip}:${request.path}`,
  skip: (request: Request): boolean => request.path.includes("/health-check"),
  message: {
    success: false,
    data: { detail: "Too many requests. Please retry in a moment." },
  },
});
