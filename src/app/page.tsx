"use client";

import { useState } from "react";

const TEAMS = ["함무라비", "버브"] as const;
const RATINGS = [0, 1, 2, 3, 4, 5] as const;

export default function SubmitPage() {
  const [team, setTeam] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
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
        <div className="text-5xl">⚽</div>
        <h1 className="mt-6 text-xl font-bold">의견이 잘 전달됐어요.</h1>
        <p className="mt-2 text-ink/70">
          더 즐거운 풋살을 만드는 데 참고할게요.
        </p>
        <button
          onClick={reset}
          className="mt-8 rounded-xl bg-pitch-600 px-6 py-3 font-semibold text-white active:bg-pitch-700"
        >
          의견 하나 더 남기기
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-10">
      <header className="text-center">
        <div className="text-3xl">⚽</div>
        <h1 className="mt-2 text-2xl font-bold">
          즐거운 풋살을 위한 소통창구
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          기본적으로 익명으로 전달돼요. 이름을 남기고 싶은 경우에만
          선택적으로 적어주세요.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="font-semibold">
          소속 팀 <span className="text-pitch-600">*</span>
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {TEAMS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTeam(t)}
              className={`rounded-xl border-2 py-3.5 text-base font-semibold transition-colors ${
                team === t
                  ? "border-pitch-600 bg-pitch-600 text-white"
                  : "border-pitch-200 bg-white text-ink active:bg-pitch-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="font-semibold">
          수업 만족도 <span className="text-pitch-600">*</span>
        </h2>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRating(r)}
              className={`rounded-xl border-2 py-3 text-base font-semibold transition-colors ${
                rating === r
                  ? "border-pitch-600 bg-pitch-600 text-white"
                  : "border-pitch-200 bg-white text-ink active:bg-pitch-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/50">
          0은 아쉬웠어요, 5는 최고였어요!
        </p>
      </section>

      <section className="mt-7">
        <h2 className="font-semibold">
          수업에서 바라는 점 <span className="text-pitch-600">*</span>
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="더 즐겁고 좋은 수업을 위해 바라는 점이 있다면 편하게 적어주세요."
          className="mt-3 w-full rounded-xl border-2 border-pitch-200 bg-white p-4 text-base leading-relaxed outline-none placeholder:text-ink/35 focus:border-pitch-500"
        />
      </section>

      <section className="mt-5">
        <h2 className="font-semibold">
          이름 또는 닉네임{" "}
          <span className="text-sm font-normal text-ink/50">(선택)</span>
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="비워두면 익명으로 전달돼요."
          className="mt-3 w-full rounded-xl border-2 border-pitch-200 bg-white px-4 py-3.5 text-base outline-none placeholder:text-ink/35 focus:border-pitch-500"
        />
      </section>

      {error && (
        <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-7 w-full rounded-xl bg-pitch-600 py-4 text-lg font-bold text-white transition-colors active:bg-pitch-700 disabled:opacity-60"
      >
        {submitting ? "전달하는 중..." : "의견 보내기"}
      </button>
    </main>
  );
}
