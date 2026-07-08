import { NextRequest, NextResponse } from "next/server";
import {
  CoachFlags,
  getCoachVisitSummary,
  listAllFeedbacks,
  updateFeedbackFlagsBulk,
} from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";

const FLAG_KEYS: (keyof CoachFlags)[] = [
  "visible_to_coach",
  "show_rating_to_coach",
  "show_name_to_coach",
];

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않아요." },
      { status: 400 }
    );
  }

  const { ids, flags } = (body ?? {}) as Record<string, unknown>;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 500 ||
    !ids.every((id) => typeof id === "string")
  ) {
    return NextResponse.json(
      { error: "변경할 의견 목록이 올바르지 않아요." },
      { status: 400 }
    );
  }

  const safeFlags: Partial<CoachFlags> = {};
  for (const key of FLAG_KEYS) {
    const value = (flags as Record<string, unknown>)?.[key];
    if (typeof value === "boolean") safeFlags[key] = value;
  }
  if (Object.keys(safeFlags).length === 0) {
    return NextResponse.json(
      { error: "변경할 항목이 없어요." },
      { status: 400 }
    );
  }

  try {
    const feedbacks = await updateFeedbackFlagsBulk(ids as string[], safeFlags);
    return NextResponse.json({ feedbacks });
  } catch (e) {
    console.error("[admin] bulk update failed:", e);
    return NextResponse.json(
      { error: "저장 중 문제가 생겼어요." },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  try {
    const feedbacks = await listAllFeedbacks();
    // coach_visits 테이블이 아직 없어도 관리자 페이지는 동작하도록
    const coachVisit = await getCoachVisitSummary().catch((e) => {
      console.error("[admin] coach visit summary failed:", e);
      return { last: null, count: 0 };
    });
    return NextResponse.json({ feedbacks, coachVisit });
  } catch (e) {
    console.error("[admin] list failed:", e);
    return NextResponse.json(
      { error: "데이터를 불러오지 못했어요." },
      { status: 500 }
    );
  }
}
