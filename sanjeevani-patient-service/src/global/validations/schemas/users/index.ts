import { Yup } from "@/global/validations/extensions/index.js";
import { buildGlobalFilterSchema } from "@/global/validations/schemas/common/index.js";
import { ROLES, USER_STATUS_TYPES } from "@/types/index.js";

export const UserFilterSchema = Yup.object({
  search: Yup.string().trim().optional(),
  role: Yup.array().of(Yup.string().oneOf(Object.values(ROLES))),
  status: Yup.array().of(
    Yup.string().oneOf(Object.values(USER_STATUS_TYPES)),
  ),
  facility_id: Yup.array().of(Yup.string()),
});

export const ListUsersSchema = buildGlobalFilterSchema(UserFilterSchema);

export const UserManagementSchema = Yup.object({
  employee_id: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9-]+$/, "Use letters, numbers and hyphens only.")
    .min(3)
    .max(32)
    .required("Employee ID is required."),
  email: Yup.string()
    .trim()
    .lowercase()
    .email("Enter a valid email address.")
    .required("Email is required."),
  first_name: Yup.string()
    .validateStandardName(2, 64)
    .required("First name is required."),
  last_name: Yup.string()
    .validateStandardName(2, 64)
    .required("Last name is required."),
  role: Yup.string()
    .oneOf(Object.values(ROLES), "Select a valid role.")
    .required("Role is required."),
  facility_id: Yup.string().trim().nullable().default(null),
  status: Yup.string()
    .oneOf(Object.values(USER_STATUS_TYPES))
    .default(USER_STATUS_TYPES.ACTIVE),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters.")
    .matches(/[A-Z]/, "Include at least one uppercase letter.")
    .matches(/[a-z]/, "Include at least one lowercase letter.")
    .matches(/\d/, "Include at least one number.")
    .optional(),
});
