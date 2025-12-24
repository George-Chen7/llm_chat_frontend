"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";
import { setAuthCookie } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/chat";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await login({ username, password });
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setAuthCookie(response.jwt_token);
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <header>
          <p className="text-sm font-medium text-slate-500">欢迎使用</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            账号登录
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            使用账号密码登录，开始多模态对话体验。
          </p>
        </header>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">账号</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入账号"
              type="text"
              value={username}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">密码</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              type="password"
              value={password}
            />
          </div>
          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            disabled={loading}
            type="submit"
          >
            {loading ? "登录中..." : "登录"}
          </button>
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs text-rose-600">
              {error}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
