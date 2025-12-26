"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromCookie } from "@/lib/api/client";
import { getMeInfo } from "@/lib/api";
import { AuthExpiredError } from "@/lib/api/withAuth";
import { clearAuthCookie, isDemoToken } from "@/lib/auth";

export default function UserMenu() {
  const router = useRouter();
  const [username, setUsername] = useState("demo_user");

  const handleLogout = () => {
    clearAuthCookie();
    router.replace("/login");
  };

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      return;
    }
    if (isDemoToken(token)) {
      setUsername("demo");
      return;
    }
    const loadUser = async () => {
      try {
        const { data: response } = await getMeInfo(token);
        if (response.err_code === 0) {
          setUsername(response.user.username);
        }
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          clearAuthCookie();
          router.replace("/login");
        }
      }
    };
    void loadUser();
  }, [router]);

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      <span>{username}</span>
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
