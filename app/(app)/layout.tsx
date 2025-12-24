import Link from "next/link";
import UserMenu from "./UserMenu";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link className="text-sm font-semibold text-slate-900" href="/chat">
              LLM Chat
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link className="hover:text-slate-900" href="/chat">
                对话
              </Link>
              <Link className="hover:text-slate-900" href="/prompts">
                Prompt
              </Link>
              <Link className="hover:text-slate-900" href="/settings">
                个人中心
              </Link>
              <Link className="hover:text-slate-900" href="/admin">
                管理后台
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>
      {children}
    </div>
  );
}
