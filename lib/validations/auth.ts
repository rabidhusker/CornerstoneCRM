import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters"),
    workspaceName: z
      .string()
      .min(1, "Workspace name is required")
      .min(2, "Workspace name must be at least 2 characters")
      .max(100, "Workspace name must be less than 100 characters"),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, "You must accept the terms of service"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

// Password strength calculator
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (!password) {
    return { score: 0, label: "Enter a password", color: "bg-muted" };
  }

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Normalize to 0-4 scale
  const normalizedScore = Math.min(Math.floor(score / 2), 4);

  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-danger",
    "bg-danger",
    "bg-warning",
    "bg-accent",
    "bg-accent",
  ];

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    color: colors[normalizedScore],
  };
}
