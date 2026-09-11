import type { NextFunction, Request, Response } from "express";

import dayjs from "dayjs";
import _ from "lodash";
import { QueryTypes } from "sequelize";

import { databaseManager } from "@/components/database/index.js";
import { AuditService } from "@/services/audit/index.service.js";
import { AUDIT_ACTIONS, AUDIT_STATUS } from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";

interface AnalyticsQuery {
  from?: string;
  to?: string;
  facility_id?: string;
  district?: string;
  granularity?: "day" | "month" | "week";
}

interface ResolvedRange {
  from: Date;
  to: Date;
  previous_from: Date;
  previous_to: Date;
  granularity: "day" | "month" | "week";
}

const DEFAULT_RANGE_IN_DAYS = 90;

/**
 * Resolves the requested window and the immediately preceding window of equal
 * length, so every headline figure can be shown with a period-on-period delta.
 */
const resolveRange = (query: AnalyticsQuery): ResolvedRange => {
  const to = query.to ? dayjs(query.to).endOf("day") : dayjs().endOf("day");
  const from = query.from
    ? dayjs(query.from).startOf("day")
    : to.subtract(DEFAULT_RANGE_IN_DAYS, "day").startOf("day");

  const spanInDays = Math.max(to.diff(from, "day"), 1);

  return {
    from: from.toDate(),
    to: to.toDate(),
    previous_from: from.subtract(spanInDays, "day").toDate(),
    previous_to: from.subtract(1, "millisecond").toDate(),
    granularity: query.granularity ?? "day",
  };
};

/**
 * Scope predicate shared by every aggregate. Values are always bound as
 * replacements — never interpolated — so the dashboard filters cannot be used
 * for SQL injection.
 */
const buildScope = (
  query: AnalyticsQuery,
): { clause: string; replacements: Record<string, unknown> } => {
  const conditions: string[] = ["e.deleted_at IS NULL"];
  const replacements: Record<string, unknown> = {};

  if (query.facility_id) {
    conditions.push("e.facility_id = :facility_id");
    replacements.facility_id = query.facility_id;
  }

  if (query.district) {
    conditions.push("f.district = :district");
    replacements.district = query.district;
  }

  return { clause: conditions.join(" AND "), replacements };
};

const FROM_CLAUSE = `
  FROM encounters e
  INNER JOIN facilities f ON f.id = e.facility_id
  INNER JOIN diagnosiscategories d ON d.id = e.diagnosis_category_id
  INNER JOIN patients p ON p.id = e.patient_id
`;

const countEncounters = async (
  query: AnalyticsQuery,
  from: Date,
  to: Date,
): Promise<number> => {
  const scope = buildScope(query);

  const [row] = await databaseManager.driver.query<{ total: string }>(
    `SELECT COUNT(*)::int AS total ${FROM_CLAUSE}
     WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to`,
    {
      type: QueryTypes.SELECT,
      replacements: { ...scope.replacements, from, to },
    },
  );

  return Number(_.get(row, "total", 0));
};

export const getAnalyticsOverview = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = request.query as AnalyticsQuery;
    const range = resolveRange(query);
    const scope = buildScope(query);

    const [summary] = await databaseManager.driver.query<{
      total_encounters: number;
      unique_patients: number;
      critical_cases: number;
      notifiable_cases: number;
      referred_cases: number;
      follow_ups_due: number;
      active_clinicians: number;
      facilities_reporting: number;
    }>(
      `SELECT
         COUNT(*)::int                                                        AS total_encounters,
         COUNT(DISTINCT e.patient_id)::int                                    AS unique_patients,
         COUNT(*) FILTER (WHERE e.severity = 'CRITICAL')::int                 AS critical_cases,
         COUNT(*) FILTER (WHERE d.is_notifiable IS TRUE)::int                 AS notifiable_cases,
         COUNT(*) FILTER (WHERE e.status = 'REFERRED')::int                   AS referred_cases,
         COUNT(*) FILTER (WHERE e.follow_up_date IS NOT NULL
                            AND e.follow_up_date >= NOW())::int               AS follow_ups_due,
         COUNT(DISTINCT e.clinician_id)::int                                  AS active_clinicians,
         COUNT(DISTINCT e.facility_id)::int                                   AS facilities_reporting
       ${FROM_CLAUSE}
       WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          ...scope.replacements,
          from: range.from,
          to: range.to,
        },
      },
    );

    const previousTotal = await countEncounters(
      query,
      range.previous_from,
      range.previous_to,
    );

    const currentTotal = Number(_.get(summary, "total_encounters", 0));

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.VIEW_ANALYTICS,
      entity_type: "DASHBOARD",
      status: AUDIT_STATUS.SUCCESS,
      metadata: { from: range.from, to: range.to },
    });

    response.customResponse(
      200,
      {
        ...summary,
        previous_total_encounters: previousTotal,
        encounter_change_percentage:
          previousTotal === 0
            ? null
            : Number(
                (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(
                  1,
                ),
              ),
        range: { from: range.from, to: range.to },
      },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const getAnalyticsTrends = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = request.query as AnalyticsQuery;
    const range = resolveRange(query);
    const scope = buildScope(query);

    // `granularity` is validated against an allow-list by the request schema
    // before it reaches this interpolation.
    const rows = await databaseManager.driver.query<{
      bucket: string;
      total: number;
      critical: number;
      notifiable: number;
    }>(
      `SELECT
         DATE_TRUNC(:granularity, e.encounter_date)              AS bucket,
         COUNT(*)::int                                           AS total,
         COUNT(*) FILTER (WHERE e.severity = 'CRITICAL')::int    AS critical,
         COUNT(*) FILTER (WHERE d.is_notifiable IS TRUE)::int    AS notifiable
       ${FROM_CLAUSE}
       WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
       GROUP BY bucket
       ORDER BY bucket ASC`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          ...scope.replacements,
          granularity: range.granularity,
          from: range.from,
          to: range.to,
        },
      },
    );

    const categoryTrend = await databaseManager.driver.query<{
      bucket: string;
      category: string;
      total: number;
    }>(
      `SELECT
         DATE_TRUNC(:granularity, e.encounter_date) AS bucket,
         d.name                                     AS category,
         COUNT(*)::int                              AS total
       ${FROM_CLAUSE}
       WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
       GROUP BY bucket, d.name
       ORDER BY bucket ASC`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          ...scope.replacements,
          granularity: range.granularity,
          from: range.from,
          to: range.to,
        },
      },
    );

    response.customResponse(
      200,
      {
        granularity: range.granularity,
        series: rows,
        category_series: categoryTrend,
        range: { from: range.from, to: range.to },
      },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const getAnalyticsDistribution = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = request.query as AnalyticsQuery;
    const range = resolveRange(query);
    const scope = buildScope(query);

    const replacements = {
      ...scope.replacements,
      from: range.from,
      to: range.to,
    };
    const options = { type: QueryTypes.SELECT as const, replacements };

    const [byCategory, bySeverity, byGender, byAgeBand, byFacility, byStatus] =
      await Promise.all([
        databaseManager.driver.query(
          `SELECT d.name AS label, d.code AS code, d.is_notifiable,
                  COUNT(*)::int AS value
           ${FROM_CLAUSE}
           WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
           GROUP BY d.name, d.code, d.is_notifiable
           ORDER BY value DESC`,
          options,
        ),
        databaseManager.driver.query(
          `SELECT e.severity AS label, COUNT(*)::int AS value
           ${FROM_CLAUSE}
           WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
           GROUP BY e.severity`,
          options,
        ),
        databaseManager.driver.query(
          `SELECT p.gender AS label, COUNT(*)::int AS value
           ${FROM_CLAUSE}
           WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
           GROUP BY p.gender`,
          options,
        ),
        databaseManager.driver.query(
          `SELECT CASE
                    WHEN p.age < 5  THEN '0-4'
                    WHEN p.age < 15 THEN '5-14'
                    WHEN p.age < 30 THEN '15-29'
                    WHEN p.age < 45 THEN '30-44'
                    WHEN p.age < 60 THEN '45-59'
                    ELSE '60+'
                  END AS label,
                  COUNT(*)::int AS value
           ${FROM_CLAUSE}
           WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
           GROUP BY label
           ORDER BY MIN(p.age) ASC`,
          options,
        ),
        databaseManager.driver.query(
          `SELECT f.name AS label, f.district AS district, f.type AS facility_type,
                  COUNT(*)::int AS value,
                  COUNT(*) FILTER (WHERE e.severity = 'CRITICAL')::int AS critical
           ${FROM_CLAUSE}
           WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
           GROUP BY f.name, f.district, f.type
           ORDER BY value DESC`,
          options,
        ),
        databaseManager.driver.query(
          `SELECT e.status AS label, COUNT(*)::int AS value
           ${FROM_CLAUSE}
           WHERE ${scope.clause} AND e.encounter_date BETWEEN :from AND :to
           GROUP BY e.status`,
          options,
        ),
      ]);

    response.customResponse(
      200,
      {
        by_category: byCategory,
        by_severity: bySeverity,
        by_gender: byGender,
        by_age_band: byAgeBand,
        by_facility: byFacility,
        by_status: byStatus,
        range: { from: range.from, to: range.to },
      },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};
