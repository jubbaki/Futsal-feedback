import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const TEAMS = ["함무라비", "버브", "풋킥킥"] as const;
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

const memoryVisits: string[] = ((
  globalThis as { __futsalMemoryVisits?: string[] }
).__futsalMemoryVisits ??= []);

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

export async function updateFeedbackFlagsBulk(
  ids: string[],
  flags: Partial<CoachFlags>
): Promise<Feedback[]> {
  if (useMemoryStore) {
    const updated: Feedback[] = [];
    for (const id of ids) {
      const row = memoryStore.find((f) => f.id === id);
      if (!row) continue;
      Object.assign(row, flags);
      row.updated_at = new Date().toISOString();
      updated.push({ ...row });
    }
    return updated;
  }
  const { data, error } = await supabase()
    .from("feedbacks")
    .update(flags)
    .in("id", ids)
    .select();
  if (error) throw new Error(error.message);
  return data as Feedback[];
}

export async function deleteFeedback(id: string): Promise<boolean> {
  if (useMemoryStore) {
    const index = memoryStore.findIndex((f) => f.id === id);
    if (index === -1) return false;
    memoryStore.splice(index, 1);
    return true;
  }
  const { data, error } = await supabase()
    .from("feedbacks")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export type CoachVisitSummary = {
  last: string | null;
  count: number;
};

// 5분 안의 재접속(새로고침 등)은 한 번의 방문으로 계산
const VISIT_THROTTLE_MS = 5 * 60 * 1000;

export async function recordCoachVisit(): Promise<void> {
  if (useMemoryStore) {
    const last = memoryVisits[memoryVisits.length - 1];
    if (last && Date.now() - new Date(last).getTime() < VISIT_THROTTLE_MS)
      return;
    memoryVisits.push(new Date().toISOString());
    return;
  }
  const { data, error } = await supabase()
    .from("coach_visits")
    .select("visited_at")
    .order("visited_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const last = data?.[0]?.visited_at as string | undefined;
  if (last && Date.now() - new Date(last).getTime() < VISIT_THROTTLE_MS)
    return;
  const { error: insertError } = await supabase()
    .from("coach_visits")
    .insert({});
  if (insertError) throw new Error(insertError.message);
}

export async function getCoachVisitSummary(): Promise<CoachVisitSummary> {
  if (useMemoryStore) {
    return {
      last: memoryVisits[memoryVisits.length - 1] ?? null,
      count: memoryVisits.length,
    };
  }
  const { data, error, count } = await supabase()
    .from("coach_visits")
    .select("visited_at", { count: "exact" })
    .order("visited_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return {
    last: (data?.[0]?.visited_at as string | undefined) ?? null,
    count: count ?? 0,
  };
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
