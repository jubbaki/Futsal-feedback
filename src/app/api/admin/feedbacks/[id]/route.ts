import { NextRequest, NextResponse } from "next/server";
import { CoachFlags, updateFeedbackFlags } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";

const FLAG_KEYS: (keyof CoachFlags)[] = [
  "visible_to_coach",
  "show_rating_to_coach",
  "show_name_to_coach",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const flags: Partial<CoachFlags> = {};
  for (const key of FLAG_KEYS) {
    const value = (body as Record<string, unknown>)?.[key];
    if (typeof value === "boolean") flags[key] = value;
  }
  if (Object.keys(flags).length === 0) {
    return NextResponse.json(
      { error: "변경할 항목이 없어요." },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const updated = await updateFeedbackFlags(id, flags);
    if (!updated) {
      return NextResponse.json(
        { error: "해당 의견을 찾을 수 없어요." },
        { status: 404 }
      );
    }
    return NextResponse.json({ feedback: updated });
  } catch (e) {
    console.error("[admin] update failed:", e);
    return NextResponse.json(
      { error: "저장 중 문제가 생겼어요." },
      { status: 500 }
    );
  }
}
