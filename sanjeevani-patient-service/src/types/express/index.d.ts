import type { JWTPayload, PERMISSIONS } from "@/types/index.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      access_token?: string;
      decoded_user?: JWTPayload;
      permissions_claimed?: PERMISSIONS[];
      request_id: string;
      request_timestamp: string;
    }

    interface Response {
      customResponse: (
        status_code: number,
        data: unknown,
        success: boolean,
        request_id: string,
        request_timestamp: string,
      ) => Response;
    }
  }
}

export {};
