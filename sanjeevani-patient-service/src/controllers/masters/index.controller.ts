import type { NextFunction, Request, Response } from "express";

import { databaseManager } from "@/components/database/index.js";
import { Repositories } from "@/components/repositories/index.js";
import { USER_STATUS_TYPES } from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";

/**
 * Reference data for form dropdowns and dashboard filters. Read-only and
 * available to any authenticated user — none of it is patient data.
 */
export const listFacilities = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await Repositories.FacilitiesRepository.findAll({
      where: { is_active: true } as never,
      order: [["name", "ASC"]],
    });

    response.customResponse(
      200,
      { data: rows, count: rows.length },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const listDiagnosisCategories = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await Repositories.DiagnosisCategoriesRepository.findAll({
      order: [["name", "ASC"]],
    });

    response.customResponse(
      200,
      { data: rows, count: rows.length },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const listClinicians = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await Repositories.UsersRepository.findAll({
      where: { status: USER_STATUS_TYPES.ACTIVE } as never,
      attributes: ["id", "first_name", "last_name", "employee_id"],
      include: [
        {
          model: databaseManager.models.roles,
          as: "role_details",
          attributes: ["name"],
        },
      ],
      order: [["first_name", "ASC"]],
    });

    response.customResponse(
      200,
      { data: rows, count: rows.length },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};
