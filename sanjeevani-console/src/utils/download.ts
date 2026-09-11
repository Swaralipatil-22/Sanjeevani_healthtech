import type { AxiosResponse } from "axios";
import _ from "lodash";

const EXTENSIONS: Record<string, string> = {
  CSV: "csv",
  JSON: "json",
  XLS: "xlsx",
};

/**
 * Export endpoints stream a file rather than JSON. The filename comes from
 * Content-Disposition when present, so the server stays in charge of naming.
 */
export const downloadBlobResponse = (
  response: AxiosResponse<Blob>,
  fallbackName: string,
  format: string,
): void => {
  const disposition = _.get(
    response,
    "headers.content-disposition",
    "",
  ) as string;

  const matched = /filename="?([^"]+)"?/.exec(disposition);
  const fileName =
    matched?.[1] ?? `${fallbackName}.${EXTENSIONS[format] ?? "csv"}`;

  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
