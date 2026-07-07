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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function formatDateHeader(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

type DateGroup = { key: string; label: string; items: Feedback[] };

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-line bg-surface p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`h-8 rounded-[6px] px-3 text-[13px] transition-colors ${
            value === opt
              ? "bg-accent-soft font-semibold text-accent-strong"
              : "font-medium text-muted hover:text-ink"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Switch({
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
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 disabled:opacity-35"
    >
      <span
        className={`inline-block h-5 w-[34px] rounded-full p-0.5 transition-colors ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-3.5" : ""
          }`}
        />
      </span>
      <span
        className={`text-[13px] font-medium ${
          checked ? "text-ink" : "text-muted"
        }`}
      >
        {label}
      </span>
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
  const [savingGroup, setSavingGroup] = useState<string | null>(null);

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

  const groups = useMemo<DateGroup[]>(() => {
    const result: DateGroup[] = [];
    for (const f of filtered) {
      const key = dateKey(f.created_at);
      const last = result[result.length - 1];
      if (last && last.key === key) last.items.push(f);
      else
        result.push({ key, label: formatDateHeader(f.created_at), items: [f] });
    }
    return result;
  }, [filtered]);

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

  async function updateGroup(group: DateGroup, next: boolean) {
    setSavingGroup(group.key);
    try {
      const res = await fetch("/api/admin/feedbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: group.items.map((f) => f.id),
          flags: { visible_to_coach: next },
        }),
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
      const updatedById = new Map<string, Feedback>(
        (data.feedbacks as Feedback[]).map((f) => [f.id, f])
      );
      setFeedbacks((prev) =>
        prev ? prev.map((f) => updatedById.get(f.id) ?? f) : prev
      );
    } catch {
      alert("네트워크 문제로 저장하지 못했어요.");
    } finally {
      setSavingGroup(null);
    }
  }

  async function remove(f: Feedback) {
    const preview =
      f.message.length > 20 ? `${f.message.slice(0, 20)}…` : f.message;
    if (!confirm(`이 의견을 완전히 삭제할까요?\n\n"${preview}"\n\n삭제하면 되돌릴 수 없어요.`))
      return;
    setSavingId(f.id);
    try {
      const res = await fetch(`/api/admin/feedbacks/${f.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "삭제에 실패했어요.");
        return;
      }
      setFeedbacks((prev) =>
        prev ? prev.filter((row) => row.id !== f.id) : prev
      );
    } catch {
      alert("네트워크 문제로 삭제하지 못했어요.");
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-10">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-bold">관리자</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            즐거운 풋살을 위한 소통창구
          </p>
        </div>
        <button
          onClick={logout}
          className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
        >
          로그아웃
        </button>
      </header>

      <section className="mt-6 grid grid-cols-2 divide-x divide-line rounded-xl border border-line bg-surface">
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-faint">의견</div>
          <div className="mt-1 text-xl font-bold tabular-nums">
            {filtered.length}
            <span className="ml-0.5 text-sm font-semibold text-muted">건</span>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-faint">만족도 평균</div>
          <div className="mt-1 text-xl font-bold tabular-nums">
            {avgRating === null ? (
              "—"
            ) : (
              <>
                {avgRating}
                <span className="ml-0.5 text-sm font-semibold text-muted">
                  / 5
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 flex flex-wrap gap-2">
        <Segmented
          options={TEAM_FILTERS}
          value={teamFilter}
          onChange={setTeamFilter}
        />
        <Segmented
          options={VISIBILITY_FILTERS}
          value={visibilityFilter}
          onChange={setVisibilityFilter}
        />
        <Segmented options={SORT_OPTIONS} value={sort} onChange={setSort} />
      </section>

      {loadError && (
        <div className="mt-8 rounded-[10px] border border-line bg-surface px-4 py-3 text-[13px] font-medium text-danger">
          {loadError}{" "}
          <button onClick={load} className="ml-1 text-ink underline underline-offset-2">
            다시 시도
          </button>
        </div>
      )}

      {feedbacks === null && !loadError && (
        <p className="mt-16 text-center text-sm text-faint">불러오는 중...</p>
      )}

      {feedbacks !== null && filtered.length === 0 && (
        <p className="mt-16 text-center text-sm text-faint">
          조건에 맞는 의견이 없어요.
        </p>
      )}

      <section className="mt-6 space-y-8">
        {groups.map((g) => {
          const visibleCount = g.items.filter(
            (f) => f.visible_to_coach
          ).length;
          const allVisible = visibleCount === g.items.length;
          const groupBusy = savingGroup === g.key;
          return (
            <div key={g.key}>
              <div className="flex items-center justify-between px-0.5">
                <h2 className="text-[13px] font-semibold text-muted">
                  {g.label}
                  <span className="ml-1.5 font-medium text-faint">
                    {g.items.length}건
                  </span>
                </h2>
                <div className="flex items-center gap-2.5">
                  {visibleCount > 0 && !allVisible && (
                    <span className="text-xs tabular-nums text-faint">
                      {visibleCount}/{g.items.length} 공개
                    </span>
                  )}
                  <Switch
                    label="코치님 공개"
                    checked={allVisible}
                    disabled={groupBusy}
                    onChange={(v) => updateGroup(g, v)}
                  />
                </div>
              </div>
              <div className="mt-2.5 space-y-3">
                {g.items.map((f) => (
                  <article
                    key={f.id}
                    className="rounded-xl border border-line bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong">
                        {f.team}
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums">
                        만족도 {f.rating}
                      </span>
                      <span className="text-[13px] text-muted">
                        {f.name ?? "익명"}
                      </span>
                      <time className="ml-auto text-xs tabular-nums text-faint">
                        {formatTime(f.created_at)}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
                      {f.message}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5 border-t border-line pt-4">
                      <Switch
                        label="코치님 공개"
                        checked={f.visible_to_coach}
                        disabled={savingId === f.id || groupBusy}
                        onChange={(v) =>
                          updateFlag(f.id, { visible_to_coach: v })
                        }
                      />
                      <Switch
                        label="만족도 공개"
                        checked={f.show_rating_to_coach}
                        disabled={
                          savingId === f.id || groupBusy || !f.visible_to_coach
                        }
                        onChange={(v) =>
                          updateFlag(f.id, { show_rating_to_coach: v })
                        }
                      />
                      <Switch
                        label="이름 공개"
                        checked={f.show_name_to_coach}
                        disabled={
                          savingId === f.id ||
                          groupBusy ||
                          !f.visible_to_coach ||
                          !f.name
                        }
                        onChange={(v) =>
                          updateFlag(f.id, { show_name_to_coach: v })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => remove(f)}
                        disabled={savingId === f.id || groupBusy}
                        className="ml-auto text-[13px] font-medium text-faint transition-colors hover:text-danger disabled:opacity-35"
                      >
                        삭제
                      </button>
                    </div>
                    {f.updated_at !== f.created_at && (
                      <p className="mt-3 text-xs tabular-nums text-faint">
                        공개 설정 변경 · {formatDateTime(f.updated_at)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
