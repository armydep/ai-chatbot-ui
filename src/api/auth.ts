import type {
  LogoutResponse,
  OTPRequestBody,
  OTPVerifyRequest,
  TokenResponse,
  UserMeResponse,
} from "../types/api";
import { apiFetch } from "./client";

export async function requestOtp(body: OTPRequestBody): Promise<{ message: string }> {
  return apiFetch("/api/v1/auth/request-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyOtp(body: OTPVerifyRequest): Promise<TokenResponse> {
  // The backend also sets the returned token as an httpOnly session cookie
  // on this same response — that's what keeps the SPA logged in on reload.
  return apiFetch("/api/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMe(): Promise<UserMeResponse> {
  return apiFetch("/api/v1/auth/me");
}

export async function logout(): Promise<LogoutResponse> {
  return apiFetch("/api/v1/auth/logout", { method: "POST" });
}
