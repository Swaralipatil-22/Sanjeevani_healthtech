import type { SortingState } from "@tanstack/react-table";

/** TanStack sorting state -> the API's `{ field: 1 | -1 }` contract. */
export const toApiSort = (
  sorting: SortingState,
): Record<string, -1 | 1> | undefined => {
  const first = sorting[0];
  if (!first) return undefined;
  return { [first.id]: first.desc ? -1 : 1 };
};

export const fromApiSort = (
  sort: Record<string, -1 | 1> | undefined,
): SortingState => {
  if (!sort) return [];
  return Object.entries(sort).map(([id, direction]) => ({
    id,
    desc: direction === -1,
  }));
};
