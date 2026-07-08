-- 즐거운 풋살을 위한 소통창구 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행하세요.

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  team text not null check (team in ('함무라비', '버브', '풋킥킥')),
  rating int not null check (rating between 0 and 5),
  name text,
  message text not null check (char_length(message) between 1 and 2000),
  visible_to_coach boolean not null default false,
  show_rating_to_coach boolean not null default false,
  show_name_to_coach boolean not null default false
);

-- 관리자가 공개 설정을 바꾸면 updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feedbacks_set_updated_at on public.feedbacks;
create trigger feedbacks_set_updated_at
before update on public.feedbacks
for each row execute function public.set_updated_at();

-- RLS 활성화 + 정책 없음:
-- anon/authenticated 키로는 읽기/쓰기 전부 차단.
-- 앱은 서버에서 service_role 키로만 접근 (RLS 우회).
alter table public.feedbacks enable row level security;

-- 코치님 페이지 접속 기록 (시각만 저장 — IP/브라우저 정보 없음)
create table if not exists public.coach_visits (
  id uuid primary key default gen_random_uuid(),
  visited_at timestamptz not null default now()
);

alter table public.coach_visits enable row level security;
