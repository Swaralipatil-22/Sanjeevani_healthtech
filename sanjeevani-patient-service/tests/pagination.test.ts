import { describe, expect, it } from "vitest";

import {
  resolvePagination,
  resolveSorting,
} from "@/utils/paginationsorting.js";

const SORTABLE = ["encounter_date", "severity"];

describe("pagination", () => {
  it("defaults to the first page", () => {
    expect(resolvePagination()).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  it("computes the offset from page and limit", () => {
    expect(resolvePagination(3, 20)).toEqual({
      page: 3,
      limit: 20,
      offset: 40,
    });
  });

  it("clamps a hostile page number", () => {
    expect(resolvePagination(-5, 10).page).toBe(1);
    expect(resolvePagination(-5, 10).offset).toBe(0);
  });

  it("caps the page size so a client cannot request the whole table", () => {
    expect(resolvePagination(1, 100_000).limit).toBe(1000);
  });
});

describe("sorting", () => {
  it("translates the console's sort map to Sequelize order", () => {
    expect(resolveSorting({ encounter_date: -1 }, SORTABLE)).toEqual([
      ["encounter_date", "DESC"],
    ]);
    expect(resolveSorting({ severity: 1 }, SORTABLE)).toEqual([
      ["severity", "ASC"],
    ]);
  });

  it("ignores fields that are not explicitly sortable", () => {
    // Guards against a caller ordering by an un-indexed or private column.
    expect(resolveSorting({ password_hash: 1 }, SORTABLE)).toEqual([
      ["created_at", "DESC"],
    ]);
  });

  it("falls back when no sort is supplied", () => {
    expect(resolveSorting(undefined, SORTABLE)).toEqual([
      ["created_at", "DESC"],
    ]);
  });
});
