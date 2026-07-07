import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, safeEqual, sessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("[admin] ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
    return NextResponse.json(
      { error: "서버 설정 오류입니다. 관리자에게 문의하세요." },
      { status: 500 }
    );
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

  const { password } = (body ?? {}) as Record<string, unknown>;
  if (typeof password !== "string" || !safeEqual(password, adminPassword)) {
    return NextResponse.json(
      { error: "비밀번호가 맞지 않아요." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie.name, createSessionToken(), sessionCookie.options);
  return res;
}
