"use client";

import { useRouter } from "next/navigation";
import { clearAuthCookie } from "@/lib/auth";

export default function UserMenu() {
  const router = useRouter();

  const handleLogout = () => {
    clearAuthCookie();
    router.replace("/login");
  };

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      <span>demo_user</span>
      <button
        className="rounded-lg border border-slate-200 px-3 py-1"
        onClick={handleLogout}
        type="button"
      >
        退出登录
      </button>
    </div>
  );
}
