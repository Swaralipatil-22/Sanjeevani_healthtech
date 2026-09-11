import type { Request } from "express";

import _ from "lodash";
import requestIp from "request-ip";

export const getClientIp = (request: Request): string =>
  requestIp.getClientIp(request) ?? "unknown";

export const getUserAgent = (request: Request): string =>
  _.get(request, "headers.user-agent", "unknown") as string;

/** Splits a comma-separated env value into a trimmed, non-empty list. */
export const toList = (value: string): string[] =>
  _.compact(_.map(_.split(value, ","), (item) => item.trim()));

/** `[{ label, value }]` shaped rows for chart consumption in the console. */
export const toChartSeries = <T extends Record<string, unknown>>(
  rows: T[],
  labelKey: string,
  valueKey: string,
): { label: string; value: number }[] =>
  rows.map((row) => ({
    label: String(_.get(row, labelKey, "Unknown")),
    value: Number(_.get(row, valueKey, 0)),
  }));
