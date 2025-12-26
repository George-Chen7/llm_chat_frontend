"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromCookie } from "@/lib/api/client";
import { getMeInfo, resetPassword } from "@/lib/api";
import { AuthExpiredError } from "@/lib/api/withAuth";
import { isDemoToken } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    username: string;
    nickname: string;
    role: string;
    total_quota: number;
    used_quota: number;
  } | null>(null);

  const handleAuthExpired = (message?: string) => {
    setError(message ?? "登录已过期，请重新登录。");
    router.replace("/login");
  };

  const loadUserInfo = async (token: string) => {
    if (isDemoToken(token)) {
      setUserInfo({
        username: "demo",
        nickname: "演示用户",
        role: "USER",
        total_quota: 100000,
        used_quota: 27500,
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: response, token: nextToken } = await getMeInfo(token);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setUserInfo({
        username: response.user.username,
        nickname: response.user.nickname,
        role: response.user.role,
        total_quota: response.user.total_quota,
        used_quota: response.user.used_quota,
      });
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "加载个人信息失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    void loadUserInfo(token);
  }, []);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("请填写完整密码信息。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致。");
      return;
    }
    const token = getTokenFromCookie();
    if (!token) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }

    if (isDemoToken(token)) {
      setSuccess("演示账号不支持修改密码。");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: response } = await resetPassword(
        { old_password: oldPassword, new_password: newPassword },
        token
      );
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setSuccess("密码修改成功，请重新登录。");
      router.replace("/login");
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header>
          <p className="text-sm font-medium text-slate-500">个人中心</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            账户与配额
          </h1>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">基本信息</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>账号：{userInfo?.username ?? "-"}</p>
              <p>昵称：{userInfo?.nickname ?? "-"}</p>
              <p>角色：{userInfo?.role ?? "-"}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">配额情况</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>总配额：{userInfo?.total_quota ?? "-"}</p>
              <p>已用配额：{userInfo?.used_quota ?? "-"}</p>
              <p>
                剩余配额：
                {userInfo
                  ? Math.max(userInfo.total_quota - userInfo.used_quota, 0)
                  : "-"}
              </p>
              <p>提示：配额不足时将限制发送消息。</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">修改密码</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="旧密码"
              type="password"
              value={oldPassword}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="新密码"
              type="password"
              value={newPassword}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="确认新密码"
              type="password"
              value={confirmPassword}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={handleSubmit}
              type="button"
            >
              {loading ? "提交中..." : "保存修改"}
            </button>
            {error && (
              <span className="text-sm text-rose-600">{error}</span>
            )}
            {success && (
              <span className="text-sm text-emerald-600">{success}</span>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
