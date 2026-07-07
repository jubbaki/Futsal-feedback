"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CoachFlags, Feedback } from "@/lib/db";

const TEAM_FILTERS = ["전체", "함무라비", "버브"] as const;
const VISIBILITY_FILTERS = ["전체", "공개됨", "비공개"] as const;
const SORT_OPTIONS = ["최근순", "오래된순"] as const;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        checked
          ? "border-pitch-600 bg-pitch-50 text-pitch-700"
          : "border-gray-200 bg-white text-ink/60"
      }`}
    >
      <span
        className={`relative inline-block h-4 w-7 rounded-full transition-colors ${
          checked ? "bg-pitch-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            checked ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
      {label}
    </button>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] =
    useState<(typeof TEAM_FILTERS)[number]>("전체");
  const [visibilityFilter, setVisibilityFilter] =
    useState<(typeof VISIBILITY_FILTERS)[number]>("전체");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>("최근순");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/feedbacks");
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "데이터를 불러오지 못했어요.");
        return;
      }
      setFeedbacks(data.feedbacks);
    } catch {
      setLoadError("네트워크 문제로 데이터를 불러오지 못했어요.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!feedbacks) return [];
    let rows = feedbacks;
    if (teamFilter !== "전체") rows = rows.filter((f) => f.team === teamFilter);
    if (visibilityFilter !== "전체")
      rows = rows.filter(
        (f) => f.visible_to_coach === (visibilityFilter === "공개됨")
      );
    rows = [...rows].sort((a, b) =>
      sort === "최근순"
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at)
    );
    return rows;
  }, [feedbacks, teamFilter, visibilityFilter, sort]);

  const avgRating = useMemo(() => {
    if (filtered.length === 0) return null;
    return (
      filtered.reduce((sum, f) => sum + f.rating, 0) / filtered.length
    ).toFixed(1);
  }, [filtered]);

  async function updateFlag(id: string, flags: Partial<CoachFlags>) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/feedbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flags),
      });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "저장에 실패했어요.");
        return;
      }
      setFeedbacks((prev) =>
        prev
          ? prev.map((f) => (f.id === id ? (data.feedback as Feedback) : f))
          : prev
      );
    } catch {
      alert("네트워크 문제로 저장하지 못했어요.");
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">관리자 페이지</h1>
        <button
          onClick={logout}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-ink/60 active:bg-gray-50"
        >
          로그아웃
        </button>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-sm text-ink/50">의견 수 (현재 필터)</div>
          <div className="mt-1 text-2xl font-bold">{filtered.length}건</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-sm text-ink/50">만족도 평균</div>
          <div className="mt-1 text-2xl font-bold">
            {avgRating === null ? "—" : `${avgRating} / 5`}
          </div>
        </div>
      </section>

      <section className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
        {(
          [
            ["팀", TEAM_FILTERS, teamFilter, setTeamFilter],
            ["공개 상태", VISIBILITY_FILTERS, visibilityFilter, setVisibilityFilter],
            ["정렬", SORT_OPTIONS, sort, setSort],
          ] as const
        ).map(([label, options, value, setValue]) => (
          <div key={label}>
            <div className="text-xs font-medium text-ink/50">{label}</div>
            <div className="mt-1.5 flex gap-1.5">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() =>
                    (setValue as (v: (typeof options)[number]) => void)(opt)
                  }
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    value === opt
                      ? "bg-pitch-600 text-white"
                      : "bg-white text-ink/60 shadow-sm active:bg-pitch-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {loadError && (
        <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {loadError}{" "}
          <button onClick={load} className="underline">
            다시 시도
          </button>
        </div>
      )}

      {feedbacks === null && !loadError && (
        <p className="mt-10 text-center text-ink/50">불러오는 중...</p>
      )}

      {feedbacks !== null && filtered.length === 0 && (
        <p className="mt-10 text-center text-ink/50">
          조건에 맞는 의견이 없어요.
        </p>
      )}

      <section className="mt-5 space-y-4">
        {filtered.map((f) => (
          <article key={f.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-md bg-pitch-100 px-2 py-0.5 font-semibold text-pitch-700">
                {f.team}
              </span>
              <span className="font-semibold">
                만족도 {f.rating}/5
              </span>
              <span className="text-ink/50">
                {f.name ? `✍️ ${f.name}` : "익명"}
              </span>
              <span className="ml-auto text-xs text-ink/40">
                제출 {formatDateTime(f.created_at)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">
              {f.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Toggle
                label="코치님 공개"
                checked={f.visible_to_coach}
                disabled={savingId === f.id}
                onChange={(v) => updateFlag(f.id, { visible_to_coach: v })}
              />
              <Toggle
                label="만족도 공개"
                checked={f.show_rating_to_coach}
                disabled={savingId === f.id || !f.visible_to_coach}
                onChange={(v) => updateFlag(f.id, { show_rating_to_coach: v })}
              />
              <Toggle
                label="이름 공개"
                checked={f.show_name_to_coach}
                disabled={savingId === f.id || !f.visible_to_coach || !f.name}
                onChange={(v) => updateFlag(f.id, { show_name_to_coach: v })}
              />
            </div>
            {f.updated_at !== f.created_at && (
              <div className="mt-2 text-xs text-ink/40">
                공개 설정 변경 {formatDateTime(f.updated_at)}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
