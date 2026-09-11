import type { NextFunction, Request, Response } from "express";

import { databaseManager } from "@/components/database/index.js";
import { CustomError } from "@/utils/customerror.js";

export const getHealthCheck = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isDatabaseHealthy = await databaseManager.isHealthy();

    response.customResponse(
      isDatabaseHealthy ? 200 : 503,
      {
        service: "sanjeevani-patient-service",
        status: isDatabaseHealthy ? "HEALTHY" : "DEGRADED",
        dependencies: {
          database: isDatabaseHealthy ? "UP" : "DOWN",
        },
        uptime_in_seconds: Math.floor(process.uptime()),
      },
      isDatabaseHealthy,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};
