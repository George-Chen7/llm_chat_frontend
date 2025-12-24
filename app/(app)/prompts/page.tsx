export default function PromptsPage() {
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

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="搜索预设"
              type="search"
            />
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">产品经理</p>
                <p className="mt-1 text-xs text-slate-500">
                  帮助进行需求梳理与PRD撰写
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">技术支持</p>
                <p className="mt-1 text-xs text-slate-500">
                  快速定位问题与解决方案
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">学习助手</p>
                <p className="mt-1 text-xs text-slate-500">
                  解释概念并提供学习计划
                </p>
              </div>
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
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              这里展示 Prompt 内容预览，点击使用后将写入新建对话的系统提示。
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
