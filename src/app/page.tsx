"use client";

import { useState } from "react";

const TEAMS = ["함무라비", "버브", "풋킥킥"] as const;
const RATINGS = [0, 1, 2, 3, 4, 5] as const;

export default function SubmitPage() {
  const [team, setTeam] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!team) return setError("팀을 선택해 주세요.");
    if (rating === null) return setError("수업 만족도를 선택해 주세요.");
    if (message.trim().length === 0)
      return setError("수업에서 바라는 점을 적어주세요.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          rating,
          message,
          name: name.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "제출에 실패했어요. 다시 시도해 주세요.");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 문제로 제출하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setTeam(null);
    setRating(null);
    setMessage("");
    setName("");
    setError(null);
    setDone(false);
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            className="text-accent"
            aria-hidden
          >
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-bold">의견이 잘 전달됐어요</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          더 즐거운 풋살을 만드는 데 참고할게요.
        </p>
        <button
          onClick={reset}
          className="mt-9 h-12 rounded-[10px] border border-line bg-surface px-6 text-[15px] font-semibold transition-colors hover:border-faint active:bg-bg"
        >
          의견 하나 더 남기기
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-20 pt-12">
      <header>
        <h1 className="text-[22px] font-bold tracking-tight">
          즐거운 풋살을 위한 소통창구
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          매주 수업이 끝난 뒤, 몇 번이든 편하게 남길 수 있어요.
        </p>
      </header>

      <div className="mt-6 flex items-start gap-2.5 rounded-[10px] bg-accent-soft px-4 py-3.5">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          className="mt-0.5 shrink-0 text-accent"
          aria-hidden
        >
          <rect
            x="5"
            y="10.5"
            width="14"
            height="9.5"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 10V7.5a4 4 0 018 0V10"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <p className="text-[13px] leading-relaxed font-medium text-accent-strong">
          기본적으로 익명으로 전달돼요. 이름을 남기고 싶은 경우에만 선택적으로
          적어주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="mt-9">
          <label className="text-[15px] font-semibold">소속 팀</label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TEAMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTeam(t)}
                aria-pressed={team === t}
                className={`h-12 rounded-[10px] border text-[15px] transition-colors ${
                  team === t
                    ? "border-accent bg-accent font-semibold text-white"
                    : "border-line bg-surface font-medium text-ink hover:border-faint"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <label className="text-[15px] font-semibold">수업 만족도</label>
          <div className="mt-3 flex rounded-[10px] border border-line bg-surface p-1">
            {RATINGS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                aria-pressed={rating === r}
                className={`h-10 flex-1 rounded-lg text-[15px] font-semibold tabular-nums transition-colors ${
                  rating === r
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-accent-soft hover:text-accent-strong"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-0.5 text-xs text-faint">
            <span>아쉬웠어요</span>
            <span>최고였어요</span>
          </div>
        </section>

        <section className="mt-8">
          <label htmlFor="message" className="text-[15px] font-semibold">
            수업에서 바라는 점
          </label>
          <div className="mt-3 rounded-[10px] border border-line bg-surface transition-colors focus-within:border-accent">
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="더 즐겁고 좋은 수업을 위해 바라는 점이 있다면 편하게 적어주세요."
              className="w-full resize-none bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-faint"
            />
            <div className="px-4 pb-2.5 text-right text-xs tabular-nums text-faint">
              {message.length.toLocaleString()}/2,000
            </div>
          </div>
        </section>

        <section className="mt-8">
          <label htmlFor="name" className="text-[15px] font-semibold">
            이름 또는 닉네임
            <span className="ml-1.5 text-[13px] font-normal text-faint">
              선택
            </span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="비워두면 익명으로 전달돼요."
            className="mt-3 h-12 w-full rounded-[10px] border border-line bg-surface px-4 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
        </section>

        {error && (
          <p
            role="alert"
            className="mt-6 text-[13px] font-medium text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 h-[52px] w-full rounded-[10px] bg-accent text-base font-bold text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
        >
          {submitting ? "전달하는 중..." : "의견 보내기"}
        </button>
      </form>
    </main>
  );
}
