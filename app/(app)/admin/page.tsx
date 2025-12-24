export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header>
          <p className="text-sm font-medium text-slate-500">管理后台</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            用户与配额管理
          </h1>
        </header>

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
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">demo_admin</p>
                  <p className="text-xs text-slate-500">角色：ADMIN</p>
                </div>
                <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs">
                  查看详情
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">demo_user</p>
                  <p className="text-xs text-slate-500">角色：USER</p>
                </div>
                <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
