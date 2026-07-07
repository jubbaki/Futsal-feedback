import { NextResponse } from "next/server";
import { listAllFeedbacks } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  try {
    const feedbacks = await listAllFeedbacks();
    return NextResponse.json({ feedbacks });
  } catch (e) {
    console.error("[admin] list failed:", e);
    return NextResponse.json(
      { error: "데이터를 불러오지 못했어요." },
      { status: 500 }
    );
  }
}
