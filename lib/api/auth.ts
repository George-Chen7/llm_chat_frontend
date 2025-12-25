import { apiRequest } from "./client";
import type { RefreshTokenResponse } from "./types";

// 刷新 Jwt token，返回新的 token。
export function refreshToken(token: string) {
  return apiRequest<RefreshTokenResponse>("/auth/refresh-token", {
    method: "POST",
    token,
  });
}
