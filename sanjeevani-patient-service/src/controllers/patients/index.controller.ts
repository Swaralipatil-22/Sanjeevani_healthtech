import type { NextFunction, Request, Response } from "express";
import type { FindOptions, WhereOptions } from "sequelize";

import dayjs from "dayjs";
import _ from "lodash";
import { Op } from "sequelize";

import type { GlobalFilters } from "@/types/index.js";

import { databaseManager } from "@/components/database/index.js";
import { Repositories } from "@/components/repositories/index.js";
import { hasFullAccess } from "@/global/middlewares/routeguards/index.js";
import { AuditService } from "@/services/audit/index.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_STATUS,
  EXPORT_FORMATS,
  PERMISSIONS,
} from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";
import { toCSV, toJSON, toXLS } from "@/utils/file.js";
import { KeyGenerators } from "@/utils/keygenerators.js";
import {
  resolvePagination,
  resolveSorting,
} from "@/utils/paginationsorting.js";

const SORTABLE_FIELDS = [
  "patient_code",
  "age",
  "gender",
  "district",
  "created_at",
  "updated_at",
];

const PATIENT_INCLUDES = [
  {
    model: databaseManager.models.facilities,
    as: "facility_details",
    attributes: ["id", "code", "name", "type", "district", "state"],
  },
];

interface PatientFilter {
  search?: string;
  gender?: string[];
  district?: string[];
  facility_id?: string[];
  min_age?: number;
  max_age?: number;
  is_pregnant?: boolean;
}

/**
 * Single source of truth for patient filtering. List and export both call it,
 * so a filter fix can never land in one and miss the other.
 */
const buildPatientWhere = (
  request: Request,
  filter: PatientFilter,
): WhereOptions => {
  const where: Record<string, unknown> = {};

  if (filter.search) {
    where[Op.or as unknown as string] = [
      { patient_code: { [Op.iLike]: `%${filter.search}%` } },
      { district: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }

  if (!_.isEmpty(filter.gender)) where.gender = { [Op.in]: filter.gender };
  if (!_.isEmpty(filter.district)) where.district = { [Op.in]: filter.district };
  if (!_.isEmpty(filter.facility_id)) {
    where.facility_id = { [Op.in]: filter.facility_id };
  }
  if (!_.isNil(filter.is_pregnant)) where.is_pregnant = filter.is_pregnant;

  if (!_.isNil(filter.min_age) || !_.isNil(filter.max_age)) {
    where.age = {
      ...(!_.isNil(filter.min_age) ? { [Op.gte]: filter.min_age } : {}),
      ...(!_.isNil(filter.max_age) ? { [Op.lte]: filter.max_age } : {}),
    };
  }

  // Ownership scoping: a caller holding only READ_OWNED sees just the records
  // they registered themselves.
  if (!hasFullAccess(request, PERMISSIONS.READ_ALL)) {
    where.created_by = request.decoded_user!.id;
  }

  return where as WhereOptions;
};

const buildPatientQuery = (
  request: Request,
  payload: GlobalFilters<PatientFilter>,
): FindOptions => ({
  where: buildPatientWhere(request, payload.filter ?? {}),
  include: PATIENT_INCLUDES,
  order: resolveSorting(payload.sort, SORTABLE_FIELDS),
});

/**
 * Codes are sequential and human-readable. Generation retries on collision
 * rather than locking, which is adequate at outreach-clinic write volumes.
 */
const generatePatientCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const total = await Repositories.PatientsRepository.count({
      paranoid: false,
    });
    const candidate = KeyGenerators.patientCode(total + 1 + attempt);

    const existing = await Repositories.PatientsRepository.findOne({
      where: { patient_code: candidate },
      paranoid: false,
      attributes: ["id"],
    });

    if (!existing) return candidate;
  }

  throw new CustomError(
    500,
    "Could not allocate a patient code. Please retry.",
  );
};

export const listPatients = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as GlobalFilters<PatientFilter>;
    const { limit, offset } = resolvePagination(payload.page, payload.limit);

    const { rows, count } =
      await Repositories.PatientsRepository.findAndCountAll({
        ...buildPatientQuery(request, payload),
        limit,
        offset,
        distinct: true,
      });

    response.customResponse(
      200,
      { data: rows, count },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const exportPatients = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as GlobalFilters<PatientFilter>;

    const rows = await Repositories.PatientsRepository.findAll(
      buildPatientQuery(request, payload),
    );

    const records = rows.map((row) => {
      const record = row.toJSON() as Record<string, unknown>;
      return {
        "Patient Code": _.get(record, "patient_code", "-") as string,
        Age: _.get(record, "age", "-") as number,
        Gender: _.get(record, "gender", "-") as string,
        District: _.get(record, "district", "-") as string,
        State: _.get(record, "state", "-") as string,
        Facility: _.get(record, "facility_details.name", "-") as string,
        "Chronic Conditions": _.isEmpty(_.get(record, "chronic_conditions"))
          ? "-"
          : (_.get(record, "chronic_conditions") as string[]).join(", "),
        Pregnant: _.get(record, "is_pregnant") ? "Yes" : "No",
        "Registered On": dayjs(_.get(record, "created_at") as string).format(
          "DD MMM YYYY",
        ),
      };
    });

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.EXPORT_DATA,
      entity_type: "PATIENT",
      status: AUDIT_STATUS.SUCCESS,
      metadata: { record_count: records.length, format: payload.export_format },
    });

    const fileName = `patients-${dayjs().format("YYYYMMDD-HHmmss")}`;

    if (payload.export_format === EXPORT_FORMATS.JSON) {
      toJSON(response, records, fileName);
      return;
    }

    if (payload.export_format === EXPORT_FORMATS.XLS) {
      await toXLS(response, records, fileName, "Patients");
      return;
    }

    toCSV(response, records, fileName);
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const getPatientById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };

    // The ownership predicate is applied inside the lookup so an unauthorised
    // caller gets an indistinguishable 404 rather than a revealing 403.
    const patient = await Repositories.PatientsRepository.findOne({
      where: { ...(buildPatientWhere(request, {}) as object), id } as never,
      include: [
        ...PATIENT_INCLUDES,
        {
          model: databaseManager.models.encounters,
          as: "encounters",
          separate: true,
          limit: 20,
          order: [["encounter_date", "DESC"]],
          include: [
            {
              model: databaseManager.models.diagnosiscategories,
              as: "diagnosis_category_details",
              attributes: ["id", "code", "name", "is_notifiable"],
            },
            {
              model: databaseManager.models.users,
              as: "clinician_details",
              attributes: ["id", "first_name", "last_name", "employee_id"],
            },
          ],
        },
      ],
    } as never);

    if (!patient) throw new CustomError(404, "Patient not found.");

    response.customResponse(
      200,
      patient,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const createPatient = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const facility = await Repositories.FacilitiesRepository.findByPK(
      _.get(request.body, "facility_id") as string,
    );

    if (!facility) throw new CustomError(422, "The selected facility does not exist.");

    const patient = await Repositories.PatientsRepository.create({
      ...request.body,
      patient_code: await generatePatientCode(),
      created_by: request.decoded_user!.id,
      updated_by: request.decoded_user!.id,
    } as never);

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.CREATE_PATIENT,
      entity_type: "PATIENT",
      entity_id: patient.get("id") as string,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { patient_code: patient.get("patient_code") },
    });

    response.customResponse(
      201,
      patient,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const updatePatientById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };

    const where: Record<string, unknown> = { id };
    if (!hasFullAccess(request, PERMISSIONS.WRITE_ALL)) {
      where.created_by = request.decoded_user!.id;
    }

    const affected = await Repositories.PatientsRepository.update(
      { ...request.body, updated_by: request.decoded_user!.id } as never,
      { where: where as never },
    );

    if (affected === 0) {
      throw new CustomError(
        404,
        "Patient not found, or you do not have access to it.",
      );
    }

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.UPDATE_PATIENT,
      entity_type: "PATIENT",
      entity_id: id,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { fields: _.keys(request.body) },
    });

    const patient = await Repositories.PatientsRepository.findByPK(id, {
      include: PATIENT_INCLUDES,
    });

    response.customResponse(
      200,
      patient,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const deletePatientById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };

    const encounterCount = await Repositories.EncountersRepository.count({
      where: { patient_id: id } as never,
    });

    if (encounterCount > 0) {
      throw new CustomError(
        409,
        `This patient has ${encounterCount} recorded encounter(s) and cannot be removed.`,
      );
    }

    await Repositories.PatientsRepository.update(
      { deleted_by: request.decoded_user!.id } as never,
      { where: { id } as never },
    );

    const affected = await Repositories.PatientsRepository.destroy({
      where: { id } as never,
    });

    if (affected === 0) throw new CustomError(404, "Patient not found.");

    response.customResponse(
      200,
      { detail: "Patient removed successfully." },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};
