import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-sm font-medium text-slate-500">系统入口</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            本地大语言模型人机对话系统
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            支持文字与语音双向交互、对话管理、用户配额、Prompt 预设与多模态附件。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white"
              href="/login"
            >
              前往登录
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700"
              href="/chat"
            >
              进入聊天
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
