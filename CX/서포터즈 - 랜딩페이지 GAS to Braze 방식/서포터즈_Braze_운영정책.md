# 서포터즈 신청 폼 — Braze 연동 운영정책

> 서포터즈 신청 폼(`supporters_form.html`) → Apps Script → Braze 연동의
> 운영 결정사항 정리. 기술 구현 방법은 `Braze_외부연동_기술가이드.md` 참고.

---

## 현행 구현 흐름

```
GitHub Pages HTML 폼 (supporters_form.html)
    ↓ fetch() POST (no-cors)
Apps Script 웹앱 (doPost)
    ↓ POST /users/track
Braze — user_alias 프로필 생성 + supporters_application 이벤트
    ↓
Canvas Action-Based → 접수 확인 메일 발송
```

---

## Braze 전송 항목

> 폼 응답 전체는 Google Sheet에 백업됨.
> Braze에는 아래 항목만 전송 (식별·세그먼트·Canvas 트리거에 필요한 최소 세트).

### 커스텀 속성 (attributes)

| 속성명 | 타입 | 값 출처 | 설명 |
|--------|------|---------|------|
| `email` | String (기본속성) | 폼 입력값 | 유저 식별 이메일 |
| `jp_spt_name` | String | 폼 입력값 | 신청자 이름 |
| `jp_spt_submitted_at` | Time | GAS 생성 (ISO 8601 UTC) | 폼 제출 시각 |
| `jp_spt_round` | String | HTML 상수 | 서포터즈 회차 |

- 식별 방식: `user_alias { alias_name: email, alias_label: 'email' }`
- `_update_existing_only: false` — alias 프로필 없으면 신규 생성

### 커스텀 이벤트 (events)

| 항목 | 값 출처 | 설명 |
|------|---------|------|
| 이벤트명 | — | `supporters_application` |
| `properties.round` | HTML 상수 | 서포터즈 회차 |
| `properties.country` | HTML 상수 | 신청 국가 |
| `properties.source` | URL 파라미터 `?source=` | 유입 경로, 없으면 `'direct'` |

- Canvas Entry Action: `supporters_application` 이벤트 기준
- 회차 필터: Add property filters → `round = 'XXXXXX'`

---

## 값 관리 방식

| 항목 | 관리 위치 | 이유 |
|------|-----------|------|
| `round` (회차) | HTML 상수 (`const ROUND`) | GAS 재배포 없이 HTML만 수정으로 변경 가능 |
| `country` (국가) | HTML 상수 (`const COUNTRY`) | 동일 |
| `source` (유입경로) | URL 파라미터 (`?source=`) | 배포 링크마다 다른 유입경로 추적 가능 |

---

## 설계 결정사항

### 메일 발송 타이밍

| 시나리오 | 구현 방법 |
|----------|-----------|
| 제출 즉시 접수 확인 메일 ★현행 | `supporters_application` 이벤트 → Canvas 즉시 트리거 |
| 검토 후 합격자만 발송 | attributes에 `status: "pending"` → 합격 시 `"approved"` 업데이트 → Canvas Entry Filter |
| 정기 발송 | attributes만 저장, Canvas는 Scheduled로 별도 설계 |

### 옵트인(이메일 마케팅 동의)

- 접수 확인 메일 = 트랜잭션 메일 → `email_subscribe` 설정 불필요.
- 마케팅 메일에만 옵트인 적용.

### 이벤트 프로퍼티로 회차 구분

이벤트명을 회차별로 분리하는 대신, 단일 이벤트명 + `round` 프로퍼티로 구분.

| 비교 | 이벤트명 분리 방식 | 프로퍼티 방식 ★현행 |
|------|-------------------|---------------------|
| 이벤트 수 | 회차마다 1개씩 누적 | 항상 1개 |
| 전체 제출 수 집계 | 이벤트 여러 개 합산 필요 | 한 이벤트에서 바로 확인 |
| Canvas 트리거 구분 | 이벤트명으로 구분 | property filter로 구분 |

### 중복 유저 처리

- 같은 이메일로 여러 번 제출 → 동일 프로필에 덮어쓰기 (attributes 최신값으로 갱신)
- 이벤트는 제출 횟수만큼 누적됨 → Canvas에 `re-eligibility` 제한 설정으로 중복 메일 방지 가능

---

## Google Sheet 백업

> 폼 응답 전체를 시트에 보관. Braze에 저장되지 않는 상세 응답 포함.

| 순서 | 컬럼명 |
|------|--------|
| 1–4 | 국가, 회차, 유입경로, 제출일시 |
| 5–6 | 이름, 이메일 |
| 7–22 | 업종, 직종, 주요용도, 주요기능, 이용빈도, 이용기간, 강점, 개선점, 오프라인추천, 온라인발신, 소개대상, 기대사항, 계정정보, 발신채널, 인지경로, 기타코멘트 |
