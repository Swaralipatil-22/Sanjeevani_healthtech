import type { Order } from "sequelize";

import _ from "lodash";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 1000;

export const resolvePagination = (
  page?: number,
  limit?: number,
): { limit: number; offset: number; page: number } => {
  const resolvedPage = Math.max(page ?? DEFAULT_PAGE, 1);
  const resolvedLimit = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  return {
    page: resolvedPage,
    limit: resolvedLimit,
    offset: (resolvedPage - 1) * resolvedLimit,
  };
};

/**
 * The console sends sort as `{ created_at: -1 }`; Sequelize wants
 * `[["created_at", "DESC"]]`.
 */
export const resolveSorting = (
  sort: Record<string, -1 | 1> | undefined,
  allowedFields: string[],
  fallback: Order = [["created_at", "DESC"]],
): Order => {
  const entries = _.toPairs(sort ?? {}).filter(([field]) =>
    _.includes(allowedFields, field),
  );

  if (entries.length === 0) return fallback;

  return entries.map(([field, direction]) => [
    field,
    direction === 1 ? "ASC" : "DESC",
  ]) as Order;
};
