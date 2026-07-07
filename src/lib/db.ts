import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const TEAMS = ["함무라비", "버브"] as const;
export type Team = (typeof TEAMS)[number];

export type Feedback = {
  id: string;
  created_at: string;
  updated_at: string;
  team: Team;
  rating: number;
  name: string | null;
  message: string;
  visible_to_coach: boolean;
  show_rating_to_coach: boolean;
  show_name_to_coach: boolean;
};

export type CoachFlags = Pick<
  Feedback,
  "visible_to_coach" | "show_rating_to_coach" | "show_name_to_coach"
>;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase 미설정 시 개발용 메모리 저장소 (서버 재시작 시 초기화)
// 프로덕션 배포에서는 반드시 Supabase 환경변수를 설정할 것 — 미설정이면 요청 시 에러 발생
const useMemoryStore =
  (!SUPABASE_URL || !SUPABASE_KEY) && process.env.NODE_ENV !== "production";

// globalThis에 보관: Next dev에서 라우트별 모듈 인스턴스가 분리되어도 공유되도록
const memoryStore: Feedback[] = ((
  globalThis as { __futsalMemoryStore?: Feedback[] }
).__futsalMemoryStore ??= []);

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export async function insertFeedback(input: {
  team: Team;
  rating: number;
  name: string | null;
  message: string;
}): Promise<void> {
  if (useMemoryStore) {
    const now = new Date().toISOString();
    memoryStore.push({
      id: randomUUID(),
      created_at: now,
      updated_at: now,
      ...input,
      visible_to_coach: false,
      show_rating_to_coach: false,
      show_name_to_coach: false,
    });
    return;
  }
  const { error } = await supabase().from("feedbacks").insert(input);
  if (error) throw new Error(error.message);
}

export async function listAllFeedbacks(): Promise<Feedback[]> {
  if (useMemoryStore) {
    return [...memoryStore].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  }
  const { data, error } = await supabase()
    .from("feedbacks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Feedback[];
}

export async function updateFeedbackFlags(
  id: string,
  flags: Partial<CoachFlags>
): Promise<Feedback | null> {
  if (useMemoryStore) {
    const row = memoryStore.find((f) => f.id === id);
    if (!row) return null;
    Object.assign(row, flags);
    row.updated_at = new Date().toISOString();
    return { ...row };
  }
  const { data, error } = await supabase()
    .from("feedbacks")
    .update(flags)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Feedback;
}

export async function listVisibleFeedbacks(): Promise<Feedback[]> {
  if (useMemoryStore) {
    return memoryStore
      .filter((f) => f.visible_to_coach)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await supabase()
    .from("feedbacks")
    .select("*")
    .eq("visible_to_coach", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Feedback[];
}
