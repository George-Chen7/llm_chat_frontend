// 统一处理前端可见的鉴权 cookie，便于登录与退出逻辑复用。
export function setAuthCookie(token: string) {
  document.cookie = `jwt_token=${encodeURIComponent(
    token
  )}; Path=/; SameSite=Lax; Max-Age=86400`;
}

export function clearAuthCookie() {
  document.cookie = "jwt_token=; Path=/; Max-Age=0";
}
