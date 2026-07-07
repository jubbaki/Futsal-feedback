import { notFound } from "next/navigation";
import Link from "next/link";
import { timingSafeEqual } from "crypto";
import { listVisibleFeedbacks, TEAMS } from "@/lib/db";

export const dynamic = "force-dynamic";

const TEAM_FILTERS = ["전체", ...TEAMS] as const;

function isValidToken(token: string): boolean {
  const expected = process.env.COACH_SHARE_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function CoachPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const { token } = await params;
  if (!isValidToken(token)) notFound();

  const { team } = await searchParams;
  const teamFilter = TEAM_FILTERS.includes(team as (typeof TEAM_FILTERS)[number])
    ? (team as (typeof TEAM_FILTERS)[number])
    : "전체";

  const all = await listVisibleFeedbacks();
  const feedbacks = (
    teamFilter === "전체" ? all : all.filter((f) => f.team === teamFilter)
  ).map((f) => ({
    id: f.id,
    created_at: f.created_at,
    team: f.team,
    message: f.message,
    // 관리자가 허용한 항목만 전달 — 비공개 필드는 화면에 아예 내려보내지 않음
    rating: f.show_rating_to_coach ? f.rating : null,
    name: f.show_name_to_coach ? f.name : null,
  }));

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-10">
      <header className="text-center">
        <div className="text-3xl">⚽</div>
        <h1 className="mt-2 text-2xl font-bold">
          즐거운 풋살을 위한 소통창구
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          팀원들이 남긴 의견이에요. 늘 좋은 수업 감사합니다!
        </p>
      </header>

      <nav className="mt-7 flex justify-center gap-2">
        {TEAM_FILTERS.map((t) => (
          <Link
            key={t}
            href={t === "전체" ? "?" : `?team=${encodeURIComponent(t)}`}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              teamFilter === t
                ? "bg-pitch-600 text-white"
                : "bg-white text-ink/60 shadow-sm"
            }`}
          >
            {t}
          </Link>
        ))}
      </nav>

      {feedbacks.length === 0 ? (
        <p className="mt-16 text-center leading-relaxed text-ink/50">
          아직 공개된 의견이 없어요.
          <br />
          의견이 모이면 이곳에서 보실 수 있어요.
        </p>
      ) : (
        <section className="mt-6 space-y-4">
          {feedbacks.map((f) => (
            <article key={f.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-md bg-pitch-100 px-2 py-0.5 font-semibold text-pitch-700">
                  {f.team}
                </span>
                {f.rating !== null && (
                  <span className="text-amber-500">
                    {"★".repeat(f.rating)}
                    <span className="text-gray-300">
                      {"★".repeat(5 - f.rating)}
                    </span>
                  </span>
                )}
                <span className="ml-auto text-xs text-ink/40">
                  {formatDate(f.created_at)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">
                {f.message}
              </p>
              {f.name && (
                <p className="mt-3 text-right text-sm text-ink/50">
                  — {f.name}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
