import type { NextFunction, Request, Response } from "express";
import type { FindOptions, WhereOptions } from "sequelize";

import bcrypt from "bcryptjs";
import _ from "lodash";
import { Op } from "sequelize";

import type { GlobalFilters, ROLES } from "@/types/index.js";

import { localCacheManager } from "@/components/cache/index.js";
import { databaseManager } from "@/components/database/index.js";
import { Repositories } from "@/components/repositories/index.js";
import { CustomError } from "@/utils/customerror.js";
import { env } from "@/utils/env.js";
import {
  resolvePagination,
  resolveSorting,
} from "@/utils/paginationsorting.js";

const SORTABLE_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "employee_id",
  "status",
  "last_login_at",
  "created_at",
];

const USER_INCLUDES = [
  {
    model: databaseManager.models.roles,
    as: "role_details",
    attributes: ["id", "name", "description"],
  },
  {
    model: databaseManager.models.facilities,
    as: "facility_details",
    attributes: ["id", "code", "name", "district"],
  },
];

interface UserFilter {
  search?: string;
  role?: string[];
  status?: string[];
  facility_id?: string[];
}

const buildUserQuery = (payload: GlobalFilters<UserFilter>): FindOptions => {
  const filter = payload.filter ?? {};
  const where: Record<string, unknown> = {};

  if (filter.search) {
    where[Op.or as unknown as string] = [
      { first_name: { [Op.iLike]: `%${filter.search}%` } },
      { last_name: { [Op.iLike]: `%${filter.search}%` } },
      { email: { [Op.iLike]: `%${filter.search}%` } },
      { employee_id: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }

  if (!_.isEmpty(filter.status)) where.status = { [Op.in]: filter.status };
  if (!_.isEmpty(filter.facility_id)) {
    where.facility_id = { [Op.in]: filter.facility_id };
  }

  return {
    where: where as WhereOptions,
    include: _.isEmpty(filter.role)
      ? USER_INCLUDES
      : [
          { ...USER_INCLUDES[0]!, where: { name: { [Op.in]: filter.role } } },
          USER_INCLUDES[1]!,
        ],
    order: resolveSorting(payload.sort, SORTABLE_FIELDS),
  };
};

export const listUsers = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as GlobalFilters<UserFilter>;
    const { limit, offset } = resolvePagination(payload.page, payload.limit);

    const { rows, count } = await Repositories.UsersRepository.findAndCountAll({
      ...buildUserQuery(payload),
      limit,
      offset,
      distinct: true,
    });

    response.customResponse(
      200,
      { data: rows, count },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const getUserById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };

    const user = await Repositories.UsersRepository.findByPK(id, {
      include: USER_INCLUDES,
    });

    if (!user) throw new CustomError(404, "User not found.");

    response.customResponse(
      200,
      user,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const createUser = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = request.body as {
      email: string;
      employee_id: string;
      role: ROLES;
      password?: string;
    };

    const existing = await Repositories.UsersRepository.findOne({
      where: {
        [Op.or]: [
          { email: payload.email },
          { employee_id: payload.employee_id },
        ],
      } as never,
      paranoid: false,
    });

    if (existing) {
      throw new CustomError(
        409,
        "A user with this email address or employee ID already exists.",
      );
    }

    const role = await Repositories.RolesRepository.findOne({
      where: { name: payload.role } as never,
    });

    if (!role) throw new CustomError(422, "The selected role does not exist.");

    const user = await Repositories.UsersRepository.create({
      ..._.omit(payload, ["role", "password"]),
      role_id: role.get("id"),
      password_hash: await bcrypt.hash(
        payload.password ?? env.SEED_DEFAULT_PASSWORD,
        env.BCRYPT_SALT_ROUNDS,
      ),
      created_by: request.decoded_user!.id,
      updated_by: request.decoded_user!.id,
    } as never);

    const created = await Repositories.UsersRepository.findByPK(
      user.get("id") as string,
      { include: USER_INCLUDES },
    );

    response.customResponse(
      201,
      created,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const updateUserById = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = request.params as { id: string };
    const payload = request.body as { role?: ROLES; password?: string };

    const user = await Repositories.UsersRepository.findByPK(id);
    if (!user) throw new CustomError(404, "User not found.");

    const updates: Record<string, unknown> = {
      ..._.omit(payload, ["role", "password"]),
      updated_by: request.decoded_user!.id,
    };

    if (payload.role) {
      const role = await Repositories.RolesRepository.findOne({
        where: { name: payload.role } as never,
      });
      if (!role) throw new CustomError(422, "The selected role does not exist.");
      updates.role_id = role.get("id");
    }

    if (payload.password) {
      updates.password_hash = await bcrypt.hash(
        payload.password,
        env.BCRYPT_SALT_ROUNDS,
      );
    }

    await Repositories.UsersRepository.update(updates as never, {
      where: { id } as never,
    });

    // A role change must take effect immediately, not after the cache expires.
    localCacheManager.delete(`role-permissions:${user.get("role_id")}`);
    if (updates.role_id) {
      localCacheManager.delete(`role-permissions:${updates.role_id as string}`);
    }

    const updated = await Repositories.UsersRepository.findByPK(id, {
      include: USER_INCLUDES,
    });

    response.customResponse(
      200,
      updated,
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};
