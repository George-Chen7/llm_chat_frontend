import { ApiError } from "./client";
import { refreshToken } from "./auth";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import type { ApiResponse } from "./types";

export type AuthResult<T> = {
  data: T;
  token: string;
};

type RequestWithAuth<T> = (token: string) => Promise<T>;

export class AuthExpiredError extends Error {
  constructor(message = "登录已过期，请重新登录。") {
    super(message);
    this.name = "AuthExpiredError";
  }
}

function isAuthErrorResponse(data: unknown) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (!("err_code" in data)) {
    return false;
  }
  // 约定：err_code === 401 表示 token 失效；如后端定义不同，请调整。
  return (data as ApiResponse).err_code === 401;
}

async function doRefresh(token: string) {
  const refreshResponse = await refreshToken(token);
  if (refreshResponse.err_code !== 0) {
    clearAuthCookie();
    throw new AuthExpiredError();
  }
  setAuthCookie(refreshResponse.jwt_token);
  return refreshResponse.jwt_token;
}

// 通用鉴权包装：遇到 401 或 err_code=401 时，自动刷新 token 并重试一次。
export async function requestWithAuth<T>(
  request: RequestWithAuth<T>,
  token: string
): Promise<AuthResult<T>> {
  try {
    const data = await request(token);
    if (isAuthErrorResponse(data)) {
      const nextToken = await doRefresh(token);
      const retryData = await request(nextToken);
      if (isAuthErrorResponse(retryData)) {
        clearAuthCookie();
        throw new AuthExpiredError();
      }
      return { data: retryData, token: nextToken };
    }
    return { data, token };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const nextToken = await doRefresh(token);
      const retryData = await request(nextToken);
      if (isAuthErrorResponse(retryData)) {
        clearAuthCookie();
        throw new AuthExpiredError();
      }
      return { data: retryData, token: nextToken };
    }
    throw err;
  }
}
