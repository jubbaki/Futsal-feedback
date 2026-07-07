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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="text-center text-xl font-bold">관리자 페이지</h1>
      <form onSubmit={handleLogin} className="mt-6">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          className="w-full rounded-xl border-2 border-pitch-200 bg-white px-4 py-3.5 text-center text-lg tracking-widest outline-none focus:border-pitch-500"
        />
        {error && (
          <p className="mt-3 text-center text-sm font-medium text-amber-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="mt-4 w-full rounded-xl bg-pitch-600 py-3.5 font-bold text-white active:bg-pitch-700 disabled:opacity-60"
        >
          {submitting ? "확인 중..." : "들어가기"}
        </button>
      </form>
    </main>
  );
}
