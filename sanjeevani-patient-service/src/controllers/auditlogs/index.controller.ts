import type { NextFunction, Request, Response } from "express";
import type { FindOptions, WhereOptions } from "sequelize";

import dayjs from "dayjs";
import _ from "lodash";
import { Op } from "sequelize";

import type { GlobalFilters } from "@/types/index.js";

import { databaseManager } from "@/components/database/index.js";
import { Repositories } from "@/components/repositories/index.js";
import { EXPORT_FORMATS } from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";
import { toCSV, toJSON, toXLS } from "@/utils/file.js";
import {
  resolvePagination,
  resolveSorting,
} from "@/utils/paginationsorting.js";

const SORTABLE_FIELDS = ["created_at", "action", "status", "entity_type"];

const AUDIT_INCLUDES = [
  {
    model: databaseManager.models.users,
    as: "user_details",
    attributes: ["id", "first_name", "last_name", "employee_id", "email"],
  },
];

interface AuditLogFilter {
  search?: string;
  user_id?: string[];
  action?: string[];
  status?: string[];
  entity_type?: string[];
  from?: string;
  to?: string;
}

const buildAuditLogQuery = (
  payload: GlobalFilters<AuditLogFilter>,
): FindOptions => {
  const filter = payload.filter ?? {};
  const where: Record<string, unknown> = {};

  if (filter.search) {
    where[Op.or as unknown as string] = [
      { actor_email: { [Op.iLike]: `%${filter.search}%` } },
      { entity_id: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }

  if (!_.isEmpty(filter.user_id)) where.user_id = { [Op.in]: filter.user_id };
  if (!_.isEmpty(filter.action)) where.action = { [Op.in]: filter.action };
  if (!_.isEmpty(filter.status)) where.status = { [Op.in]: filter.status };
  if (!_.isEmpty(filter.entity_type)) {
    where.entity_type = { [Op.in]: filter.entity_type };
  }

  if (filter.from || filter.to) {
    where.created_at = {
      ...(filter.from
        ? { [Op.gte]: dayjs(filter.from).startOf("day").toDate() }
        : {}),
      ...(filter.to ? { [Op.lte]: dayjs(filter.to).endOf("day").toDate() } : {}),
    };
  }

  return {
    where: where as WhereOptions,
    include: AUDIT_INCLUDES,
    order: resolveSorting(payload.sort, SORTABLE_FIELDS),
  };
};

export const listAuditLogs = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as GlobalFilters<AuditLogFilter>;
    const { limit, offset } = resolvePagination(payload.page, payload.limit);

    const { rows, count } =
      await Repositories.AuditLogsRepository.findAndCountAll({
        ...buildAuditLogQuery(payload),
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

export const exportAuditLogs = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as GlobalFilters<AuditLogFilter>;

    const rows = await Repositories.AuditLogsRepository.findAll(
      buildAuditLogQuery(payload),
    );

    const records = rows.map((row) => {
      const record = row.toJSON() as Record<string, unknown>;
      return {
        Timestamp: dayjs(_.get(record, "created_at") as string).format(
          "DD MMM YYYY, HH:mm:ss",
        ),
        Action: _.get(record, "action", "-") as string,
        Status: _.get(record, "status", "-") as string,
        Actor: _.get(record, "actor_email", "-") as string,
        "Entity Type": _.get(record, "entity_type", "-") as string,
        "Entity ID": _.get(record, "entity_id", "-") as string,
        "IP Address": _.get(record, "ip_address", "-") as string,
        "Request ID": _.get(record, "request_id", "-") as string,
        Metadata: _.isEmpty(_.get(record, "metadata"))
          ? "-"
          : JSON.stringify(_.get(record, "metadata")),
      };
    });

    const fileName = `audit-logs-${dayjs().format("YYYYMMDD-HHmmss")}`;

    if (payload.export_format === EXPORT_FORMATS.JSON) {
      toJSON(response, records, fileName);
      return;
    }

    if (payload.export_format === EXPORT_FORMATS.XLS) {
      await toXLS(response, records, fileName, "Audit Logs");
      return;
    }

    toCSV(response, records, fileName);
  } catch (error) {
    next(CustomError.from(error));
  }
};
