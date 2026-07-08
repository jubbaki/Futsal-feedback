import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { timingSafeEqual } from "crypto";
import { listVisibleFeedbacks, recordCoachVisit, TEAMS } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";

export const dynamic = "force-dynamic";

// 카톡/슬랙 등 메신저의 링크 미리보기 봇 접속은 방문으로 치지 않음
const BOT_UA_PATTERN =
  /bot|crawler|spider|scrap|preview|facebookexternalhit|kakaotalk|whatsapp|telegram|slack|discord|linkedin|twitter/i;

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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-px" aria-label={`만족도 ${rating}점`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          className={i <= rating ? "text-amber-400" : "text-line"}
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9L12 2.5z"
          />
        </svg>
      ))}
    </span>
  );
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

  // 방문 기록: 시각만 저장 (User-Agent는 봇 판별에만 쓰고 저장하지 않음)
  // 관리자 본인이 미리보기로 여는 경우는 제외
  try {
    const userAgent = (await headers()).get("user-agent") ?? "";
    if (!BOT_UA_PATTERN.test(userAgent) && !(await isAdminAuthenticated())) {
      await recordCoachVisit();
    }
  } catch (e) {
    console.error("[coach] visit logging failed:", e);
  }

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
    <main className="mx-auto max-w-xl px-5 pb-20 pt-12">
      <header>
        <p className="text-[13px] font-semibold text-accent">
          즐거운 풋살을 위한 소통창구
        </p>
        <h1 className="mt-1.5 text-[22px] font-bold tracking-tight">
          팀원들의 의견
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          늘 좋은 수업 감사합니다. 팀원들이 남긴 의견을 전해드려요.
        </p>
      </header>

      <nav className="mt-7 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {TEAM_FILTERS.map((t) => (
          <Link
            key={t}
            href={t === "전체" ? "?" : `?team=${encodeURIComponent(t)}`}
            className={`flex h-8 items-center rounded-[6px] px-3.5 text-[13px] transition-colors ${
              teamFilter === t
                ? "bg-accent-soft font-semibold text-accent-strong"
                : "font-medium text-muted hover:text-ink"
            }`}
          >
            {t}
          </Link>
        ))}
      </nav>

      {feedbacks.length === 0 ? (
        <div className="mt-14 rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="text-sm leading-relaxed text-faint">
            아직 공개된 의견이 없어요.
            <br />
            의견이 모이면 이곳에서 보실 수 있어요.
          </p>
        </div>
      ) : (
        <section className="mt-5 space-y-3">
          {feedbacks.map((f) => (
            <article
              key={f.id}
              className="rounded-xl border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong">
                  {f.team}
                </span>
                {f.rating !== null && <Stars rating={f.rating} />}
                <time className="ml-auto text-xs tabular-nums text-faint">
                  {formatDate(f.created_at)}
                </time>
              </div>
              <p className="mt-3.5 whitespace-pre-wrap text-[15px] leading-7">
                {f.message}
              </p>
              {f.name && (
                <p className="mt-3 text-right text-[13px] font-medium text-muted">
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
