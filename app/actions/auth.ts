"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(50, { message: "Name must be at most 50 characters." })
      .trim(),
    email: z
      .string()
      .email({ message: "Please enter a valid email address." })
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Za-z]/, { message: "Password must contain at least one letter." })
      .regex(/[0-9]/, { message: "Password must contain at least one number." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const LoginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  password: z.string().min(1, { message: "Password is required." }),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type RegisterState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
    }
  | undefined;

export type LoginState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

// ─── Register Action ─────────────────────────────────────────────────────────

export async function register(
  state: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  // 1. Validate fields
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validated.data;

  // 2. Check for existing user
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    return {
      errors: {
        email: ["An account with this email already exists."],
      },
    };
  }

  // 3. Hash password + create user with 25 free credits
  const hashedPassword = await hashPassword(password);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      credits: 25,
    },
  });

  // 4. Auto-login after registration
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  // 5. Redirect to dashboard
  redirect("/dashboard");
}

// ─── Login Action ─────────────────────────────────────────────────────────────

export async function login(
  state: LoginState,
  formData: FormData
): Promise<LoginState> {
  // 1. Validate fields
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  // 2. Attempt sign-in via Auth.js
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            message: "Invalid email or password. Please try again.",
          };
        default:
          return {
            message: "Something went wrong. Please try again.",
          };
      }
    }
    // Re-throw redirect (Next.js uses throw internally for redirect)
    throw error;
  }
}
