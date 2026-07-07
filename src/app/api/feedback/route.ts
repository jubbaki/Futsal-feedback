import { NextRequest, NextResponse } from "next/server";
import { insertFeedback, TEAMS, Team } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않아요." },
      { status: 400 }
    );
  }

  const { team, rating, name, message } = (body ?? {}) as Record<
    string,
    unknown
  >;

  if (typeof team !== "string" || !TEAMS.includes(team as Team)) {
    return NextResponse.json(
      { error: "팀을 선택해 주세요." },
      { status: 400 }
    );
  }
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 0 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "수업 만족도를 선택해 주세요." },
      { status: 400 }
    );
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "수업에서 바라는 점을 적어주세요." },
      { status: 400 }
    );
  }
  if (message.trim().length > 2000) {
    return NextResponse.json(
      { error: "의견은 2000자 이내로 적어주세요." },
      { status: 400 }
    );
  }

  const trimmedName =
    typeof name === "string" && name.trim().length > 0
      ? name.trim().slice(0, 50)
      : null;

  try {
    await insertFeedback({
      team: team as Team,
      rating,
      name: trimmedName,
      message: message.trim(),
    });
  } catch (e) {
    console.error("[feedback] insert failed:", e);
    return NextResponse.json(
      { error: "저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
