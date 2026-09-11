import type { Response } from "express";

import ExcelJS from "exceljs";
import _ from "lodash";

export type ExportRow = Record<string, boolean | number | string | null>;

const escapeCSVCell = (value: unknown): string => {
  const stringified = _.isNil(value) ? "" : String(value);
  return `"${stringified.replaceAll('"', '""')}"`;
};

export const toJSON = (
  response: Response,
  rows: ExportRow[],
  fileName: string,
): void => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}.json"`,
  );
  response.send(JSON.stringify(rows, null, 2));
};

export const toCSV = (
  response: Response,
  rows: ExportRow[],
  fileName: string,
): void => {
  const headers = _.keys(_.first(rows) ?? {});
  const body = rows.map((row) =>
    headers.map((header) => escapeCSVCell(row[header])).join(","),
  );

  response.setHeader("Content-Type", "text/csv");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}.csv"`,
  );
  response.send([headers.map(escapeCSVCell).join(","), ...body].join("\n"));
};

export const toXLS = async (
  response: Response,
  rows: ExportRow[],
  fileName: string,
  sheetName = "Sheet1",
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const headers = _.keys(_.first(rows) ?? {});

  sheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.min(Math.max(header.length + 6, 16), 48),
  }));

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F6B68" },
  };
  sheet.getRow(1).alignment = { vertical: "middle" };
  sheet.getRow(1).height = 22;

  for (const row of rows) sheet.addRow(row);
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: Math.max(headers.length, 1) },
  };

  response.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}.xlsx"`,
  );

  await workbook.xlsx.write(response);
  response.end();
};
