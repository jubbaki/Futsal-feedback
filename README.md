# ⚽ 즐거운 풋살을 위한 소통창구

풋살 수업 피드백을 익명으로 모으고, 관리자가 고른 의견만 코치님에게 공개하는 웹앱.

- **제출 페이지** `/` — 팀원 누구나 익명으로 의견 제출
- **관리자 페이지** `/admin` — 비밀번호 로그인 후 전체 의견 확인·공개 설정
- **코치님 페이지** `/coach/<공유토큰>` — 관리자가 공개한 의견만 표시

스택: Next.js (App Router) + Supabase(Postgres) + Tailwind CSS. Vercel 배포 기준.

## 익명성 원칙

- 저장하는 데이터는 팀/만족도/의견/선택 입력한 이름뿐입니다.
- **IP, 브라우저 정보, 쿠키, 로그인 정보는 저장하지 않습니다.** 애널리틱스도 없습니다.
- 코치님 페이지 API는 비공개 필드(만족도·이름)를 응답에서 아예 제외하고 전달합니다.

## 실행 방법 (로컬)

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 환경변수 참고)
npm run dev
```

`http://localhost:3000` 접속.

> Supabase 환경변수를 비워두면 개발용 **메모리 저장소**로 동작합니다.
> 서버를 재시작하면 데이터가 사라지므로 화면 확인용으로만 쓰세요.

## 필요한 환경변수

| 변수 | 설명 |
|---|---|
| `ADMIN_PASSWORD` | 관리자 페이지 비밀번호. 코드에 없으므로 여기서만 관리 |
| `COACH_SHARE_TOKEN` | 코치님 페이지 URL 토큰. `openssl rand -hex 24`로 생성 |
| `SESSION_SECRET` | 관리자 세션 쿠키 서명 키. `openssl rand -hex 32`로 생성 |
| `SUPABASE_URL` | Supabase 프로젝트 URL (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 (서버 전용, 절대 공개 금지) |

## 데이터베이스 설정 (Supabase)

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. 대시보드 → **SQL Editor** → [`supabase/schema.sql`](supabase/schema.sql) 내용 붙여넣고 실행
   - `feedbacks` 테이블 + `updated_at` 자동 갱신 트리거 + RLS 활성화가 한 번에 됩니다
   - RLS 정책을 만들지 않으므로 anon 키로는 읽기/쓰기 모두 차단됩니다 (서버의 service_role 키만 접근 가능)
3. Settings → API에서 URL과 service_role 키를 복사해 환경변수에 설정

## 배포 방법 (Vercel)

1. 이 폴더를 GitHub 저장소에 푸시
2. [vercel.com](https://vercel.com) → **Add New Project** → 저장소 선택
3. **Environment Variables**에 위 5개 변수 입력 (Production 기준)
4. Deploy

이후 `git push`만 하면 자동 재배포됩니다.
환경변수를 바꾸면(예: 코치 토큰 교체) **Redeploy**를 한 번 해줘야 반영됩니다.

## 관리자 페이지 접속 방법

1. `https://<배포주소>/admin` 접속
2. `ADMIN_PASSWORD` 값 입력 → 12시간 동안 로그인 유지 (httpOnly 쿠키)
3. 기능: 팀(전체/함무라비/버브/풋킥킥)·공개 상태(공개됨/비공개)·정렬(최근순/오래된순) 필터,
   의견 수·만족도 평균, 의견별 공개 토글 3종(코치님 공개 / 만족도 공개 / 이름 공개)

공개 설정을 바꾸면 `updated_at`이 자동 갱신되어 변경 시점이 카드에 표시됩니다.

## 코치님 페이지 공유 방법

1. 코치님 페이지 주소는 `https://<배포주소>/coach/<COACH_SHARE_TOKEN 값>`
2. 이 링크를 코치님에게만 개인 메시지로 전달 (단체방 공유 금지)
3. 링크가 새어나간 것 같으면: `openssl rand -hex 24`로 새 토큰 생성 →
   Vercel 환경변수 `COACH_SHARE_TOKEN` 교체 → Redeploy → 새 링크 다시 전달
   (이전 링크는 즉시 무효화됩니다)

코치님은 관리자가 "코치님 공개"로 켠 의견만 볼 수 있고,
만족도와 이름은 각각 공개를 허용한 경우에만 표시됩니다.
