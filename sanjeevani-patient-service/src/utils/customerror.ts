import _ from "lodash";
import { BaseError as SequelizeBaseError, ValidationError } from "sequelize";
import { ValidationError as YupValidationError } from "yup";

export interface CustomErrorDetails {
  detail: string;
  errors?: string[];
  code?: string;
}

/**
 * Every error surfaced to a client is normalised into this shape so the
 * frontend can always read the message from `response.data.data.detail`.
 */
export class CustomError extends Error {
  public readonly status_code: number;
  public readonly errors: string[];
  public readonly code: string | undefined;

  constructor(
    status_code: number,
    detail: string,
    errors: string[] = [],
    code?: string,
  ) {
    super(detail);
    this.name = "CustomError";
    this.status_code = status_code;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, CustomError);
  }

  public toDetails(): CustomErrorDetails {
    return {
      detail: this.message,
      ...(this.errors.length > 0 ? { errors: this.errors } : {}),
      ...(this.code ? { code: this.code } : {}),
    };
  }

  /**
   * Yup and Sequelize both throw rich error objects. Rather than leaking their
   * internals we flatten them into a CustomError with a readable summary.
   */
  public static from(error: unknown): CustomError {
    if (error instanceof CustomError) return error;

    if (error instanceof YupValidationError) {
      return new CustomError(
        422,
        _.first(error.errors) ?? "Request validation failed.",
        error.errors,
        "VALIDATION_ERROR",
      );
    }

    if (error instanceof ValidationError) {
      const messages = _.map(error.errors, (item) => item.message);
      return new CustomError(
        409,
        _.first(messages) ?? "Database validation failed.",
        messages,
        "DB_VALIDATION_ERROR",
      );
    }

    if (error instanceof SequelizeBaseError) {
      return new CustomError(500, "A database error occurred.", [], "DB_ERROR");
    }

    return new CustomError(
      500,
      _.get(error, "message", "Something Went Wrong") as string,
    );
  }
}
