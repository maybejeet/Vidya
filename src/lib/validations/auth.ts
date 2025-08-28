import { z } from "zod";

// Signup: name, email, password
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Login: email, password
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
