import type { OTPRequestBody, OTPVerifyRequest, TokenResponse, UserMeResponse } from "../types/api";
import { apiFetch } from "./client";

export async function requestOtp(body: OTPRequestBody): Promise<{ message: string }> {
  return apiFetch("/api/v1/auth/request-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyOtp(body: OTPVerifyRequest): Promise<TokenResponse> {
  return apiFetch("/api/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMe(): Promise<UserMeResponse> {
  return apiFetch("/api/v1/auth/me");
}
