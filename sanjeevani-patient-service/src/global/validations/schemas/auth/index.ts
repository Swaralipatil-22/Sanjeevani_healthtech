import { Yup } from "@/global/validations/extensions/index.js";

export const LoginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .lowercase()
    .email("Enter a valid email address.")
    .required("Email is required."),
  password: Yup.string().required("Password is required."),
});

export const ChangePasswordSchema = Yup.object({
  current_password: Yup.string().required("Current password is required."),
  new_password: Yup.string()
    .min(8, "Password must be at least 8 characters.")
    .matches(/[A-Z]/, "Include at least one uppercase letter.")
    .matches(/[a-z]/, "Include at least one lowercase letter.")
    .matches(/\d/, "Include at least one number.")
    .required("New password is required."),
});
