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
import {
  resolvePagination,
  resolveSorting,
} from "@/utils/paginationsorting.js";

const SORTABLE_FIELDS = [
  "encounter_date",
  "severity",
  "status",
  "visit_type",
  "created_at",
  "updated_at",
];

const ENCOUNTER_INCLUDES = [
  {
    model: databaseManager.models.patients,
    as: "patient_details",
    attributes: ["id", "patient_code", "age", "gender", "district"],
  },
  {
    model: databaseManager.models.users,
    as: "clinician_details",
    attributes: ["id", "first_name", "last_name", "employee_id"],
  },
  {
    model: databaseManager.models.facilities,
    as: "facility_details",
    attributes: ["id", "code", "name", "district"],
  },
  {
    model: databaseManager.models.diagnosiscategories,
    as: "diagnosis_category_details",
    attributes: ["id", "code", "name", "is_notifiable"],
  },
];

interface EncounterFilter {
  search?: string;
  patient_id?: string;
  clinician_id?: string[];
  facility_id?: string[];
  diagnosis_category_id?: string[];
  severity?: string[];
  status?: string[];
  visit_type?: string[];
  from?: string;
  to?: string;
}

/** Shared by list and export so the two can never diverge. */
const buildEncounterWhere = (
  request: Request,
  filter: EncounterFilter,
): WhereOptions => {
  const where: Record<string, unknown> = {};

  if (filter.search) {
    where[Op.or as unknown as string] = [
      { diagnosis: { [Op.iLike]: `%${filter.search}%` } },
      { chief_complaint: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }

  if (filter.patient_id) where.patient_id = filter.patient_id;
  if (!_.isEmpty(filter.clinician_id)) {
    where.clinician_id = { [Op.in]: filter.clinician_id };
  }
  if (!_.isEmpty(filter.facility_id)) {
    where.facility_id = { [Op.in]: filter.facility_id };
  }
  if (!_.isEmpty(filter.diagnosis_category_id)) {
    where.diagnosis_category_id = { [Op.in]: filter.diagnosis_category_id };
  }
  if (!_.isEmpty(filter.severity)) where.severity = { [Op.in]: filter.severity };
  if (!_.isEmpty(filter.status)) where.status = { [Op.in]: filter.status };
  if (!_.isEmpty(filter.visit_type)) {
    where.visit_type = { [Op.in]: filter.visit_type };
  }

  if (filter.from || filter.to) {
    where.encounter_date = {
      ...(filter.from ? { [Op.gte]: dayjs(filter.from).startOf("day").toDate() } : {}),
      ...(filter.to ? { [Op.lte]: dayjs(filter.to).endOf("day").toDate() } : {}),
    };
  }

  // A nurse holding only READ_OWNED sees exclusively their own encounters.
  if (!hasFullAccess(request, PERMISSIONS.READ_ALL)) {
    where.clinician_id = request.decoded_user!.id;
  }

  return where as WhereOptions;
};

const buildEncounterQuery = (
  request: Request,
  payload: GlobalFilters<EncounterFilter>,
): FindOptions => ({
  where: buildEncounterWhere(request, payload.filter ?? {}),
  include: ENCOUNTER_INCLUDES,
  order: resolveSorting(payload.sort, SORTABLE_FIELDS, [
    ["encounter_date", "DESC"],
  ]),
});

export const listEncounters = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as GlobalFilters<EncounterFilter>;
    const { limit, offset } = resolvePagination(payload.page, payload.limit);

    const { rows, count } =
      await Repositories.EncountersRepository.findAndCountAll({
        ...buildEncounterQuery(request, payload),
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

export const exportEncounters = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as GlobalFilters<EncounterFilter>;

    const rows = await Repositories.EncountersRepository.findAll(
      buildEncounterQuery(request, payload),
    );

    const records = rows.map((row) => {
      const record = row.toJSON() as Record<string, unknown>;
      return {
        "Encounter ID": _.get(record, "id", "-") as string,
        "Encounter Date": dayjs(
          _.get(record, "encounter_date") as string,
        ).format("DD MMM YYYY, HH:mm"),
        "Patient Code": _.get(record, "patient_details.patient_code", "-") as string,
        Age: _.get(record, "patient_details.age", "-") as number,
        Gender: _.get(record, "patient_details.gender", "-") as string,
        Facility: _.get(record, "facility_details.name", "-") as string,
        District: _.get(record, "facility_details.district", "-") as string,
        Clinician: `${_.get(record, "clinician_details.first_name", "")} ${_.get(record, "clinician_details.last_name", "")}`.trim() || "-",
        "Visit Type": _.get(record, "visit_type", "-") as string,
        "Chief Complaint": _.get(record, "chief_complaint", "-") as string,
        Symptoms: _.isEmpty(_.get(record, "symptoms"))
          ? "-"
          : (_.get(record, "symptoms") as string[]).join(", "),
        Diagnosis: _.get(record, "diagnosis", "-") as string,
        "Diagnosis Category": _.get(
          record,
          "diagnosis_category_details.name",
          "-",
        ) as string,
        Severity: _.get(record, "severity", "-") as string,
        Status: _.get(record, "status", "-") as string,
        Treatment: _.get(record, "treatment", "-") as string,
        // JSONB columns must be serialised explicitly or they export as
        // "[object Object]".
        Vitals: _.isEmpty(_.get(record, "vitals"))
          ? "-"
          : JSON.stringify(_.get(record, "vitals")),
        "Follow Up": _.get(record, "follow_up_date")
          ? dayjs(_.get(record, "follow_up_date") as string).format("DD MMM YYYY")
          : "-",
      };
    });

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.EXPORT_DATA,
      entity_type: "ENCOUNTER",
      status: AUDIT_STATUS.SUCCESS,
      metadata: { record_count: records.length, format: payload.export_format },
    });

    const fileName = `encounters-${dayjs().format("YYYYMMDD-HHmmss")}`;

    if (payload.export_format === EXPORT_FORMATS.JSON) {
      toJSON(response, records, fileName);
      return;
    }

    if (payload.export_format === EXPORT_FORMATS.XLS) {
      await toXLS(response, records, fileName, "Encounters");
      return;
    }

    toCSV(response, records, fileName);
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const getEncounterById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };

    const encounter = await Repositories.EncountersRepository.findOne({
      where: { ...(buildEncounterWhere(request, {}) as object), id } as never,
      include: ENCOUNTER_INCLUDES,
    } as never);

    if (!encounter) throw new CustomError(404, "Encounter not found.");

    response.customResponse(
      200,
      encounter,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const createEncounter = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const patient = await Repositories.PatientsRepository.findByPK(
      _.get(request.body, "patient_id") as string,
    );
    if (!patient) throw new CustomError(422, "The selected patient does not exist.");

    const category = await Repositories.DiagnosisCategoriesRepository.findByPK(
      _.get(request.body, "diagnosis_category_id") as string,
    );
    if (!category) {
      throw new CustomError(422, "The selected diagnosis category does not exist.");
    }

    // The clinician is always taken from the token, never from the payload —
    // a nurse cannot file an encounter under a doctor's name.
    const encounter = await Repositories.EncountersRepository.create({
      ...request.body,
      clinician_id: request.decoded_user!.id,
      created_by: request.decoded_user!.id,
      updated_by: request.decoded_user!.id,
    } as never);

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.CREATE_ENCOUNTER,
      entity_type: "ENCOUNTER",
      entity_id: encounter.get("id") as string,
      status: AUDIT_STATUS.SUCCESS,
      metadata: {
        patient_id: encounter.get("patient_id"),
        severity: encounter.get("severity"),
        diagnosis_category_id: encounter.get("diagnosis_category_id"),
      },
    });

    const created = await Repositories.EncountersRepository.findByPK(
      encounter.get("id") as string,
      { include: ENCOUNTER_INCLUDES },
    );

    response.customResponse(
      201,
      created,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const updateEncounterById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };

    const where: Record<string, unknown> = { id };
    if (!hasFullAccess(request, PERMISSIONS.WRITE_ALL)) {
      where.clinician_id = request.decoded_user!.id;
    }

    const existing = await Repositories.EncountersRepository.findOne({
      where: where as never,
    });

    if (!existing) {
      throw new CustomError(
        404,
        "Encounter not found, or you do not have access to it.",
      );
    }

    await Repositories.EncountersRepository.update(
      {
        ..._.omit(request.body, ["clinician_id"]),
        updated_by: request.decoded_user!.id,
      } as never,
      { where: { id } as never },
    );

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.UPDATE_ENCOUNTER,
      entity_type: "ENCOUNTER",
      entity_id: id,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { fields: _.keys(request.body) },
    });

    const encounter = await Repositories.EncountersRepository.findByPK(id, {
      include: ENCOUNTER_INCLUDES,
    });

    response.customResponse(
      200,
      encounter,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const deleteEncounterById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };

    const where: Record<string, unknown> = { id };
    if (!hasFullAccess(request, PERMISSIONS.WRITE_ALL)) {
      where.clinician_id = request.decoded_user!.id;
    }

    const existing = await Repositories.EncountersRepository.findOne({
      where: where as never,
    });

    if (!existing) {
      throw new CustomError(
        404,
        "Encounter not found, or you do not have access to it.",
      );
    }

    await Repositories.EncountersRepository.update(
      { deleted_by: request.decoded_user!.id } as never,
      { where: { id } as never },
    );

    await Repositories.EncountersRepository.destroy({
      where: { id } as never,
    });

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.DELETE_ENCOUNTER,
      entity_type: "ENCOUNTER",
      entity_id: id,
      status: AUDIT_STATUS.SUCCESS,
    });

    response.customResponse(
      200,
      { detail: "Encounter removed successfully." },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};
