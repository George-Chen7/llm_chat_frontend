"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromCookie } from "@/lib/api/client";
import {
  adminCreatePromptPreset,
  adminDeletePromptPreset,
  adminDeleteUser,
  adminGetPromptPresets,
  adminNewUser,
  adminSetQuota,
  getAdminUsers,
  getMeInfo,
} from "@/lib/api";
import { AuthExpiredError } from "@/lib/api/withAuth";
import { isDemoToken } from "@/lib/auth";
import type { PromptPreset, UserDetail } from "@/lib/api/types";

const demoUsers: UserDetail[] = [
  {
    user_id: 1,
    username: "demo_admin",
    nickname: "演示管理员",
    role: "ADMIN",
    total_quota: 100000,
    used_quota: 50000,
  },
  {
    user_id: 2,
    username: "demo_user",
    nickname: "演示用户",
    role: "USER",
    total_quota: 50000,
    used_quota: 20000,
  },
];

const demoPrompts: PromptPreset[] = [
  {
    prompt_preset_id: 1,
    name: "管理视角复盘",
    description: "用于评估项目进展与风险控制",
    content: "你是项目经理，请输出进度评估与风险清单。",
  },
  {
    prompt_preset_id: 2,
    name: "产品需求分析",
    description: "用于梳理用户需求与价值点",
    content: "你是产品专家，请给出需求拆解与优先级。",
  },
];

type TabKey = "users" | "quota" | "prompts";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [prompts, setPrompts] = useState<PromptPreset[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    nickname: "",
    role: "USER",
    total_quota: 100000,
    used_quota: 0,
  });
  const [quotaMap, setQuotaMap] = useState<Record<number, string>>({});
  const [newPrompt, setNewPrompt] = useState({
    name: "",
    description: "",
    content: "",
  });

  const handleAuthExpired = (message?: string) => {
    setError(message ?? "登录已过期，请重新登录。");
    router.replace("/login");
  };

  const resolveToken = () => getTokenFromCookie() ?? token;

  const loadAdminData = async (authToken: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const meInfo = await getMeInfo(authToken);
      if (meInfo.data.err_code !== 0) {
        setError(meInfo.data.err_msg);
        return;
      }
      const role = meInfo.data.user.role;
      if (role !== "ADMIN") {
        setError("无管理权限，已返回首页。");
        router.replace("/chat");
        return;
      }
      setIsAdmin(true);

      const [{ data: userResponse }, { data: promptResponse }] = await Promise.all(
        [
          getAdminUsers({ current_page: 1, page_size: 20 }, authToken),
          adminGetPromptPresets(authToken),
        ]
      );

      if (userResponse.err_code !== 0) {
        setError(userResponse.err_msg);
      } else {
        setUsers(userResponse.users ?? []);
      }
      if (promptResponse.err_code !== 0) {
        setError(promptResponse.err_msg);
      } else {
        setPrompts(promptResponse.prompt_presets ?? []);
      }
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "加载管理数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cookieToken = getTokenFromCookie();
    if (!cookieToken) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    setToken(cookieToken);
    if (isDemoToken(cookieToken)) {
      setIsAdmin(true);
      setUsers(demoUsers);
      setPrompts(demoPrompts);
      return;
    }
    void loadAdminData(cookieToken);
  }, []);

  const handleCreateUser = async () => {
    const authToken = resolveToken();
    if (!authToken) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    if (newUser.password.trim().length < 3) {
      setError("密码长度过短。");
      return;
    }
    if (isDemoToken(authToken)) {
      const mockUser: UserDetail = {
        user_id: Date.now(),
        username: newUser.username,
        nickname: newUser.nickname,
        role: newUser.role as "ADMIN" | "USER",
        total_quota: newUser.total_quota,
        used_quota: newUser.used_quota,
      };
      setUsers((prev) => [mockUser, ...prev]);
      setSuccess("演示账号已新增用户。");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: response } = await adminNewUser(
        {
          username: newUser.username,
          password: newUser.password,
          nickname: newUser.nickname,
          role: newUser.role as "ADMIN" | "USER",
          total_quota: newUser.total_quota,
          used_quota: newUser.used_quota,
        },
        authToken
      );
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setUsers((prev) => [response.user, ...prev]);
      setSuccess("用户创建成功。");
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "创建用户失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const authToken = resolveToken();
    if (!authToken) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    if (isDemoToken(authToken)) {
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
      setSuccess("演示账号已删除用户。");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: response } = await adminDeleteUser(userId, authToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
      setSuccess("用户删除成功。");
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "删除用户失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSetQuota = async (userId: number) => {
    const authToken = resolveToken();
    if (!authToken) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    const value = Number(quotaMap[userId]);
    if (Number.isNaN(value) || value <= 0) {
      setError("请输入有效的配额数值。");
      return;
    }
    if (isDemoToken(authToken)) {
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId
            ? {
                ...user,
                total_quota: value,
                used_quota: Math.min(user.used_quota, value),
              }
            : user
        )
      );
      setSuccess("演示账号已更新配额。");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: response } = await adminSetQuota(
        userId,
        { quota: value },
        authToken
      );
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId
            ? {
                ...user,
                total_quota: value,
                used_quota: Math.min(user.used_quota, value),
              }
            : user
        )
      );
      setSuccess("配额更新成功。");
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "更新配额失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async () => {
    const authToken = resolveToken();
    if (!authToken) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    if (!newPrompt.name || !newPrompt.description || !newPrompt.content) {
      setError("请填写完整的提示词信息。");
      return;
    }
    if (isDemoToken(authToken)) {
      const mockPrompt: PromptPreset = {
        prompt_preset_id: Date.now(),
        ...newPrompt,
      };
      setPrompts((prev) => [mockPrompt, ...prev]);
      setSuccess("演示账号已新增提示词。");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: response } = await adminCreatePromptPreset(
        newPrompt,
        authToken
      );
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setPrompts((prev) => [
        { prompt_preset_id: Date.now(), ...newPrompt },
        ...prev,
      ]);
      setSuccess("提示词创建成功。");
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "创建提示词失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = async (presetId: number) => {
    const authToken = resolveToken();
    if (!authToken) {
      handleAuthExpired("未找到登录信息，请重新登录。");
      return;
    }
    if (isDemoToken(authToken)) {
      setPrompts((prev) => prev.filter((item) => item.prompt_preset_id !== presetId));
      setSuccess("演示账号已删除提示词。");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: response } = await adminDeletePromptPreset(
        presetId,
        authToken
      );
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setPrompts((prev) => prev.filter((item) => item.prompt_preset_id !== presetId));
      setSuccess("提示词删除成功。");
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "删除提示词失败");
    } finally {
      setLoading(false);
    }
  };

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
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
            {success}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
            <button
              className={`rounded-full px-4 py-2 ${
                activeTab === "users"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600"
              }`}
              onClick={() => setActiveTab("users")}
              type="button"
            >
              用户管理
            </button>
            <button
              className={`rounded-full px-4 py-2 ${
                activeTab === "quota"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600"
              }`}
              onClick={() => setActiveTab("quota")}
              type="button"
            >
              配额管理
            </button>
            <button
              className={`rounded-full px-4 py-2 ${
                activeTab === "prompts"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600"
              }`}
              onClick={() => setActiveTab("prompts")}
              type="button"
            >
              Prompt 管理
            </button>
          </div>

          {!isAdmin && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              权限校验中...
            </div>
          )}

          {isAdmin && activeTab === "users" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-7">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-1"
                  placeholder="账号"
                  type="text"
                  value={newUser.username}
                  onChange={(event) =>
                    setNewUser((prev) => ({
                      ...prev,
                      username: event.target.value,
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-1"
                  placeholder="密码"
                  type="password"
                  value={newUser.password}
                  onChange={(event) =>
                    setNewUser((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-1"
                  placeholder="昵称"
                  type="text"
                  value={newUser.nickname}
                  onChange={(event) =>
                    setNewUser((prev) => ({
                      ...prev,
                      nickname: event.target.value,
                    }))
                  }
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-1"
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-1"
                  placeholder="总配额"
                  type="number"
                  value={newUser.total_quota}
                  onChange={(event) =>
                    setNewUser((prev) => ({
                      ...prev,
                      total_quota: Number(event.target.value),
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-1"
                  placeholder="已用配额"
                  type="number"
                  value={newUser.used_quota}
                  onChange={(event) =>
                    setNewUser((prev) => ({
                      ...prev,
                      used_quota: Number(event.target.value),
                    }))
                  }
                />
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white md:col-span-1"
                  onClick={handleCreateUser}
                  type="button"
                >
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
                      <p className="text-xs text-slate-500">
                        角色：{user.role} | 昵称：{user.nickname}
                      </p>
                    </div>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => handleDeleteUser(user.user_id)}
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && activeTab === "quota" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-3 text-sm text-slate-600">
                {users.map((user) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    key={user.user_id}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user.username}
                      </p>
                      <p className="text-xs text-slate-500">
                        总配额：{user.total_quota} | 已用配额：{user.used_quota} | 剩余配额：
                        {Math.max(user.total_quota - user.used_quota, 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="w-32 rounded-lg border border-slate-200 px-3 py-1 text-xs"
                        placeholder="新配额"
                        type="number"
                        value={quotaMap[user.user_id] ?? ""}
                        onChange={(event) =>
                          setQuotaMap((prev) => ({
                            ...prev,
                            [user.user_id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                        onClick={() => handleSetQuota(user.user_id)}
                        type="button"
                      >
                        更新配额
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                    暂无用户数据
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && activeTab === "prompts" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="名称"
                  type="text"
                  value={newPrompt.name}
                  onChange={(event) =>
                    setNewPrompt((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="描述"
                  type="text"
                  value={newPrompt.description}
                  onChange={(event) =>
                    setNewPrompt((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  onClick={handleCreatePrompt}
                  type="button"
                >
                  新增提示词
                </button>
              </div>
              <textarea
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="提示词内容"
                rows={4}
                value={newPrompt.content}
                onChange={(event) =>
                  setNewPrompt((prev) => ({
                    ...prev,
                    content: event.target.value,
                  }))
                }
              />

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {prompts.map((prompt) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                    key={prompt.prompt_preset_id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {prompt.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {prompt.description}
                        </p>
                      </div>
                      <button
                        className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
                        onClick={() =>
                          handleDeletePrompt(prompt.prompt_preset_id)
                        }
                        type="button"
                      >
                        删除
                      </button>
                    </div>
                    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      {prompt.content}
                    </div>
                  </div>
                ))}
                {prompts.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                    暂无提示词
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
