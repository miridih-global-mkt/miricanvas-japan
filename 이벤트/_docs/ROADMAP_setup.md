# 로드맵 — 팀 소유 셋업 (퇴사 후에도 존속)

작성일: 2026-05-20
대상: 「ミーキャンPPTで私の○○自慢」 콘테스트 사이트
목적: ejjeong@miridih.com 같은 **개인 종속** 가입을 피하고, 담당자 교체/퇴사에도 무중단 운영 가능한 구조

---

## 0. 핵심 원칙 (3줄 요약)

1. **개인 이메일 X · 팀 메일링리스트로만 가입** — 그래야 담당자 바뀌어도 비밀번호 리셋 메일을 다음 담당자가 받음
2. **Owner는 항상 2명 이상** — 한 명 부재 시에도 결제·권한 변경 가능
3. **결제는 법인카드 / 도메인은 회사 명의** — 사적 자산화 방지

이 3원칙을 어기지 않으면 나머지는 디테일.

---

## Phase 0 · 사전 합의 (1~2일, blocker)

여기 막히면 뒤가 다 막힘. 먼저 통과시킬 것.

| 항목 | 작업 | 협조 |
|---|---|---|
| **팀 메일 발급** | `mican-jp-event@miridih.com` 같은 메일링리스트 생성 (멤버 2~3명) | IT/총무 |
| **공유 볼트 생성** | 1Password Business (있으면) 또는 Bitwarden에 "MiCan Contest" 볼트 | IT |
| **공동 책임자 지정** | 본인 + Owner #2 한 명 (팀장 또는 미캔재팬 매니저급) | 팀장 합의 |
| **예산 승인** | 월 약 $45–65 / 연 ~$700 (4-1 참조) | 매니저 |
| **법인카드 등록 채널** | Vercel·Supabase 결제용 카드 정보 어디로 보낼지 | 재무 |
| **프로젝트 슬러그 확정** | repo·도메인에 쓸 영문 이름. 예: `mican-jiman` | 본인 |

→ 이 6개 다 완료될 때까지 Phase 1 시작 X.

---

## Phase 1 · 식별 계층 (Identity)

모든 외부 서비스의 뿌리. 잘못 세우면 나중에 전부 마이그레이션해야 함.

- **모든 가입 이메일** = Phase 0의 팀 메일 (`mican-jp-event@miridih.com`)
- **모든 API 키 / 비밀번호** = 1Password 공유 볼트 (`MiCan Contest` 볼트)
- 개인 메일이나 슬랙 DM에 키 평문 저장 금지

> 💡 가입할 때 2FA는 **TOTP** 방식으로 1Password에 같이 저장. SMS 2FA는 본인 번호에 종속되므로 X.

---

## Phase 2 · 인프라 셋업

순서대로: **도메인 → GitHub → Vercel → Supabase → Resend**

### 2-1. 도메인
- **추천**: 새 도메인 사지 말고 미캔 기존 도메인의 **서브도메인** 사용
  - 예: `jiman.miricanvas.com` 또는 `event.miricanvas.com/jiman`
  - 이유: 새 도메인은 등록자 명의·갱신·결제가 따라붙음. 서브도메인은 이미 회사 자산.
- 작업: IT에 DNS 레코드(Vercel CNAME) 추가 요청
- 새 도메인이 꼭 필요하면 회사 도메인 관리 계정으로 등록 (개인 가비아/Cloudflare X)

### 2-2. GitHub
- **기존 Miridih GitHub Organization**에 신규 private repo 생성 (새 Org 만들지 말 것)
- Org에 본인이 없다면 Org Owner에게 초대 요청
- Repo Admin: 본인 + Owner #2 (=Phase 0)
- Branch protection: `main` 보호, PR 1명 이상 리뷰 필수, force push 금지
- Repo Secret: 빈 상태로 두고, Vercel에 환경변수 직접 등록 (2-3)

### 2-3. Vercel
- **새 Vercel Team** 생성 (개인 hobby plan X)
- 팀 메일로 가입 → Pro plan ($20/seat/mo)
- Members: Owner 2명 + Developer 권한 작업자
- GitHub Org connect → 자동 배포
- 환경변수: Production / Preview 분리 (Preview는 더미 키)
- Custom Domain: 2-1의 서브도메인 연결

### 2-4. Supabase
- **Supabase Organization** 생성 (개인 프로젝트 X)
- 팀 메일로 가입 → Pro plan ($25/mo, 백업 7일·DB 8GB)
- Members: Owner 2명, Developer 권한 작업자
- Project 1개 안에 DB(Postgres) + Auth(OAuth) + Storage(썸네일)
- **DB 백업 정책 확인** — Pro plan은 PITR 7일. 사용자 데이터 있으니 필수
- Service Role Key: 1Password 볼트에 저장, 절대 클라이언트 코드에 X

### 2-5. Resend (이메일 발송)
- 팀 메일로 가입
- 발신 도메인: `jiman.miricanvas.com` (또는 미캔 도메인)
- SPF·DKIM·DMARC 레코드 IT에 등록 요청
- 발신 주소: `no-reply@jiman.miricanvas.com`
- 무료 tier 3000통/월로 시작, 초과 시 $20/mo

---

## Phase 3 · OAuth 프로바이더 (가장 까다로움)

플랫폼마다 정책이 다르고, **개인 계정 의존성이 가장 잘 숨겨져 있는 영역**.

### 3-1. Google OAuth
- Google Cloud Console에서 **회사 Workspace 조직** 안에 새 프로젝트
- 개인 Gmail/구글 계정 X
- OAuth consent screen → **외부(External)** 모드 + production 검증 신청
- 검증 필요: 개인정보 처리방침 페이지 URL, 도메인 소유 증명
- Client ID/Secret → 1Password

### 3-2. LINE Login
- 일본 시장 거의 필수
- LINE Developers Console에서 **LINE Business ID** (회사 명의)로 채널 생성
- 채널 어드민 2명 이상 등록
- 심사 1~2주 소요

### 3-3. X (Twitter) OAuth — 권장하지 않음
- X 개발자 계정은 실질적으로 **개인 X 계정**에 묶임 (퇴사 후 양도 어려움)
- 회사 명의 공용 X 계정 새로 만든다 해도 SMS 인증 등 문제 발생
- **추천**: 1차 출시는 **Google + LINE만**으로. X는 나중에 별도 검토

---

## Phase 4 · 모니터링·분석·시크릿 운영

### 4-1. 분석
- **GA4**: 회사 GA 워크스페이스에 새 속성 추가 (개인 GA X)
- **Vercel Analytics**: Pro plan에 포함, 별도 셋업 불필요

### 4-2. 에러 모니터링
- 회사에 Sentry Org 있으면 거기 새 project
- 없으면 Sentry 팀 메일 가입 (무료 tier로 시작 가능)

### 4-3. 비용 (월 추정)

| 서비스 | 비용 | 비고 |
|---|---|---|
| Vercel Pro | $20 | 1 seat |
| Supabase Pro | $25 | |
| Resend | $0~$20 | 트래픽 따라 |
| 도메인 | $0 | 서브도메인 |
| OAuth (Google/LINE) | $0 | |
| Sentry | $0~$26 | |
| **합계** | **~$45–90/mo** | 연 $540–1080 |

### 4-4. 시크릿 운영 규칙
- 키 발급 즉시 1Password 저장 → 파일·슬랙·메모장 어디에도 평문 X
- Vercel 환경변수는 UI에서만 수정, CLI export 금지
- `.env.example` 만들어서 변수명만 공유, 값은 X
- 키 로테이션 6개월마다 (특히 Service Role Key)

---

## Phase 5 · 문서 / 인수인계 준비

> "퇴사 후" 가 아니라 **첫날부터** 인수인계용 문서를 같이 쓴다는 마인드.

### 필수 문서 (repo 안)
| 파일 | 내용 |
|---|---|
| `README.md` | 로컬 셋업, 명령어 |
| `RUNBOOK.md` | 배포 절차, 시리즈 종료 절차, 장애 대응 |
| `ACCOUNTS.md` | 외부 계정 일람 (서비스명·가입 메일·Owner·1Password 위치) |
| `.env.example` | 환경변수 템플릿 (값 X) |
| `docs/decisions/*.md` | 주요 의사결정 기록 (ADR) |

### Notion / Confluence (회사 위키)
- 운영 매뉴얼 (시리즈 시작·종료, 리워드 지급, 신고 처리)
- 약관 / 개인정보처리방침 (법무 검토 필요)

---

## Phase 6 · 구현

`GUIDELINE_full.md`의 M1 ~ M4 마일스톤 그대로 진행. 위 인프라 위에서 코딩.

---

## 인수인계 체크리스트 (퇴사 시 또는 담당 변경 시)

- [ ] 1Password 볼트 멤버 갱신 (본인 제거, 후임 추가)
- [ ] Miridih GitHub Org에서 본인 권한 회수
- [ ] Vercel Team에서 본인 제거 + 후임 Owner 승격
- [ ] Supabase Org에서 본인 제거 + 후임 추가
- [ ] Google Cloud / LINE Developers 어드민 멤버 갱신
- [ ] 결제 카드가 본인 명의면 법인카드로 교체
- [ ] 도메인 등록자 정보 회사 명의인지 재확인
- [ ] 팀 메일링리스트 멤버 업데이트
- [ ] `ACCOUNTS.md` 최신화 + Slack에 공지
- [ ] RUNBOOK.md / ADR 최신화

---

## 빨간 깃발 (피해야 할 함정)

| 패턴 | 왜 안 되는가 |
|---|---|
| ❌ 개인 Gmail로 Google Cloud 가입 | 퇴사 시 Google이 막아도 풀 방법 없음 |
| ❌ ejjeong@miridih.com 단독 가입 | IT가 메일 비활성화하면 비밀번호 리셋 불가 |
| ❌ 개인 X 계정으로 X 개발자 등록 | X는 양도 절차 사실상 없음 |
| ❌ 본인 명의 도메인 등록 | 갱신 책임 따라오고 양도 비용·시간 발생 |
| ❌ 본인 명의 신용카드 결제 | 퇴사 시 결제 끊김 → 서비스 다운 |
| ❌ Supabase 개인 organization | 조직 양도 가능하지만 절차 번거롭고 데이터 다운타임 가능 |
| ❌ 시크릿을 코드 / Slack DM / 노션에 평문 저장 | 가장 흔한 사고 원인 |
| ❌ 2FA를 본인 폰 SMS로 | 폰 분실/퇴사 시 잠김 → TOTP를 1Password에 |
| ❌ "일단 빨리 만들고 나중에 옮기지 뭐" | 마이그레이션 비용이 처음 셋업의 5~10배 |

---

## 추천 진행 순서 (실행 가능한 첫 액션)

**이번 주**
1. 매니저에게 이 문서 공유 → 예산·공동책임자 합의
2. IT에 팀 메일링리스트 발급 + 1Password 볼트 생성 티켓
3. 슬러그 이름 확정

**다음 주**
4. 팀 메일 받은 즉시 Phase 1 → Phase 2 순서대로 가입
5. GitHub repo에 README + ACCOUNTS 골격만 먼저 commit (빈 가입 정보 채워가며)

**3~4주 차 이후**
6. OAuth 검증 신청 (LINE은 시간 걸림 → 일찍 시작)
7. M1 구현 착수
