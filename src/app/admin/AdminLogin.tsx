"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "로그인에 실패했어요.");
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={handleLogin} className="w-full max-w-[300px] pb-16">
        <h1 className="text-center text-lg font-bold">관리자</h1>
        <p className="mt-1.5 text-center text-sm text-muted">
          비밀번호를 입력해 주세요.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          aria-label="비밀번호"
          className="mt-6 h-12 w-full rounded-[10px] border border-line bg-surface text-center text-lg tracking-[0.35em] outline-none transition-colors focus:border-accent"
        />
        {error && (
          <p role="alert" className="mt-3 text-center text-[13px] font-medium text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="mt-3 h-12 w-full rounded-[10px] bg-accent text-[15px] font-bold text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
        >
          {submitting ? "확인 중..." : "들어가기"}
        </button>
      </form>
    </main>
  );
}
