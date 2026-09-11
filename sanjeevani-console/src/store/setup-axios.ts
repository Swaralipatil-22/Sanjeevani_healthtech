import axios, { type AxiosError } from "axios";
import _ from "lodash";

import { ROUTES } from "@/constants/global/routes";

let isConfigured = false;

/**
 * A 401 means the httpOnly cookie is gone or expired. Client code cannot
 * refresh it, so the only correct response is a full-page trip through
 * logout - which also clears any stale Redux state.
 */
export const setupAxios = (): void => {
  if (isConfigured) return;
  isConfigured = true;

  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = _.get(error, "response.status");

      if (status === 401 && typeof window !== "undefined") {
        window.location.href = ROUTES.AUTH.LOGOUT;
      }

      return Promise.reject(error);
    },
  );
};

export const getErrorMessage = (error: unknown): string =>
  _.get(error, "response.data.data.detail", "Something Went Wrong") as string;
