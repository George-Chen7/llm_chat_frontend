"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromCookie } from "@/lib/api/client";
import { getChatPromptPresets } from "@/lib/api";
import { AuthExpiredError } from "@/lib/api/withAuth";
import { isDemoToken } from "@/lib/auth";
import type { ChatPromptPreset } from "@/lib/api/types";

const demoPromptPresets: ChatPromptPreset[] = [
  {
    name: "产品经理",
    description: "帮助进行需求梳理与 PRD 撰写",
    content: "你是一名资深产品经理，请输出结构化的需求文档。",
  },
  {
    name: "技术支持",
    description: "快速定位问题与解决方案",
    content: "你是一名技术支持工程师，请给出排查与修复步骤。",
  },
  {
    name: "学习助手",
    description: "解释概念并提供学习计划",
    content: "你是一名学习导师，请制定清晰的学习路径。",
  },
];

export default function PromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<ChatPromptPreset[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activePrompt = useMemo(() => prompts[activeIndex], [activeIndex, prompts]);

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
      setPrompts(demoPromptPresets);
      return;
    }
    const loadPrompts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: response } = await getChatPromptPresets(token);
        if (response.err_code !== 0) {
          setError(response.err_msg);
          return;
        }
        setPrompts(response.prompt_presets ?? []);
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          handleAuthExpired(err.message);
          return;
        }
        setError(err instanceof Error ? err.message : "加载预设失败");
      } finally {
        setLoading(false);
      }
    };

    void loadPrompts();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Prompt 预设</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              预设列表与详情
            </h1>
          </div>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            新建预设
          </button>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="搜索预设"
              type="search"
            />
            <div className="mt-4 space-y-3">
              {loading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  加载中...
                </div>
              )}
              {!loading && prompts.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  暂无预设
                </div>
              )}
              {prompts.map((prompt, index) => (
                <button
                  className={`w-full rounded-2xl border p-3 text-left ${
                    index === activeIndex
                      ? "border-slate-300 bg-slate-50"
                      : "border-slate-200"
                  }`}
                  key={`${prompt.name}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {prompt.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {prompt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  预设详情
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  在此查看完整 Prompt 内容与描述。
                </p>
              </div>
              <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                立即使用
              </button>
            </div>
            <div className="mt-6 space-y-3">
              <div className="text-sm font-semibold text-slate-900">
                {activePrompt?.name ?? "-"}
              </div>
              <div className="text-sm text-slate-500">
                {activePrompt?.description ?? "暂无描述"}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {activePrompt?.content ??
                  "这里展示 Prompt 内容预览，点击使用后将写入新建对话的系统提示。"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
