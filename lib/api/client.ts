// API 客户端封装：统一处理 baseUrl、鉴权、错误与响应解析。
// 注意：该封装不依赖浏览器环境，token 可由调用方传入。

export class ApiError extends Error {
  status: number;
  body?: string;

  constructor(message: string, status: number, body?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
};

const DEFAULT_TIMEOUT_MS = 30000;

function withTimeout(signal?: AbortSignal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return { signal: controller.signal, timer };
}

// 从浏览器 cookie 中读取 token，适合客户端调用。
export function getTokenFromCookie(cookieName = "jwt_token") {
  if (typeof document === "undefined") {
    return undefined;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${cookieName}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const url = `${baseUrl}${path}`;
  const { signal, timer } = withTimeout();

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ?? null,
    signal,
  });

  clearTimeout(timer);

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      `请求失败: ${response.status} ${errorText}`,
      response.status,
      errorText
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.blob()) as T;
}

// JSON 请求的便捷封装，自动设置 Content-Type。
export async function apiJson<T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {}
) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  return apiRequest<T>(path, {
    ...options,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
}
