"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromCookie } from "@/lib/api/client";
import { getAdminUsers } from "@/lib/api";
import { AuthExpiredError } from "@/lib/api/withAuth";
import { isDemoToken } from "@/lib/auth";
import type { UserDetail } from "@/lib/api/types";

const demoUsers: UserDetail[] = [
  {
    user_id: 1,
    username: "demo_admin",
    nickname: "演示管理员",
    role: "ADMIN",
    total_quota: 100000,
    remaining_quota: 50000,
  },
  {
    user_id: 2,
    username: "demo_user",
    nickname: "演示用户",
    role: "USER",
    total_quota: 50000,
    remaining_quota: 20000,
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthExpired = (message?: string) => {
    setError(message ?? "登录已过期，请重新登录。");
    router.replace("/login");
  };

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    if (isDemoToken(token)) {
      setUsers(demoUsers);
      return;
    }
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: response } = await getAdminUsers(
          { current_page: 1, page_size: 20 },
          token
        );
        if (response.err_code !== 0) {
          setError(response.err_msg);
          return;
        }
        setUsers(response.users ?? []);
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          handleAuthExpired(err.message);
          return;
        }
        setError(err instanceof Error ? err.message : "加载用户列表失败");
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header>
          <p className="text-sm font-medium text-slate-500">管理后台</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            用户与配额管理
          </h1>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
            <button className="rounded-full bg-slate-900 px-4 py-2 text-white">
              用户管理
            </button>
            <button className="rounded-full border border-slate-200 px-4 py-2">
              配额管理
            </button>
            <button className="rounded-full border border-slate-200 px-4 py-2">
              Prompt 管理
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:w-72"
                placeholder="搜索用户"
                type="search"
              />
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                新增用户
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {loading && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  加载中...
                </div>
              )}
              {!loading && users.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  暂无用户数据
                </div>
              )}
              {users.map((user) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                  key={user.user_id}
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {user.username}
                    </p>
                    <p className="text-xs text-slate-500">角色：{user.role}</p>
                  </div>
                  <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs">
                    查看详情
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
