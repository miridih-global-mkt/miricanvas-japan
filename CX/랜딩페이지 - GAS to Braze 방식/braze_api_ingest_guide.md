# Braze 외부 데이터 수신 가이드 — /users/track 연동

> 구글폼·외부 소스 → Braze로 유저 데이터를 밀어넣는 흐름.
> Braze LP(lpBridge)와 반대 방향: **우리가 Braze API에 쏴주는 구조.**

---

## 전체 흐름

```
구글폼 / 외부 HTML 폼 제출
    ↓
Apps Script / Zapier / Make
    ↓  POST /users/track (REST API)
Braze 유저 프로필 생성·업데이트 + 커스텀 이벤트 기록
    ↓
Canvas (Action-Based) → 이벤트 트리거 → 자동 메일 발송
```

**현행 구현 흐름 (서포터즈 신청 폼):**

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

## 현행 Braze 전송 항목

> 폼 응답 전체는 Google Sheet에 백업됨.
> Braze에는 아래 항목만 전송 (식별·세그먼트·Canvas 트리거에 필요한 최소 세트).

### 커스텀 속성 (attributes)

| 속성명 | 타입 | 값 | 설명 |
|--------|------|----|------|
| `email` | String (기본속성) | 폼 입력값 | 유저 식별 이메일 |
| `jp_spt_name` | String | 폼 입력값 | 신청자 이름 |
| `jp_spt_submitted_at` | Time | ISO 8601 UTC | 폼 제출 시각 |
| `jp_spt_round` | String | `'262508'` | 서포터즈 회차 (연월 기준) |

- 식별 방식: `user_alias { alias_name: email, alias_label: 'email' }`
- `_update_existing_only: false` — alias 프로필 없으면 신규 생성

### 커스텀 이벤트 (events)

| 항목 | 값 |
|------|----|
| 이벤트명 | `supporters_application` |
| `properties.round` | `'262508'` (String) |
| `properties.country` | `'JP'` |
| `properties.source` | `'form'` |

- Canvas Entry Action: `supporters_application` 이벤트 기준
- 회차 필터: Add property filters → `round = '262508'`

---

## 1. Braze에서 REST API 키 만들기

경로: **Settings → APIs and Identifiers → REST API Keys → + Create New API Key**

| 필요 권한 | 설명 |
|-----------|------|
| `users.track` | 유저 속성·이벤트·구매 기록 |

- **REST Endpoint** 확인: 같은 페이지 또는 Settings → APIs and Identifiers 상단
  - 현행: `https://rest.iad-07.braze.com`
- 키는 발급 후 재확인 불가 → 즉시 복사해서 보관

---

## 2. API 호출 형식

### 엔드포인트

```
POST https://{REST_ENDPOINT}/users/track
```

### 헤더

```
Authorization: Bearer {REST_API_KEY}
Content-Type: application/json
```

### 바디 구조 — user_alias 방식 ★현행

external_id 없는 신규 유저(외부 폼 제출자 등)에 적합. 기존 미캔버스 프로필을 건드리지 않음.

```json
{
  "attributes": [{
    "user_alias": { "alias_name": "yamada@example.com", "alias_label": "email" },
    "_update_existing_only": false,
    "email": "yamada@example.com",
    "jp_spt_name": "山田 花子",
    "jp_spt_submitted_at": "2026-05-28T01:00:00.000Z",
    "jp_spt_round": "262508"
  }],
  "events": [{
    "user_alias": { "alias_name": "yamada@example.com", "alias_label": "email" },
    "name": "supporters_application",
    "time": "2026-05-28T01:00:00.000Z",
    "properties": { "round": "262508", "country": "JP", "source": "form" }
  }]
}
```

- `_update_existing_only: false` — alias 프로필이 없으면 신규 생성. 반드시 포함.
- `app_id` — server-side `/users/track`에서는 생략 가능 (선택사항).
- `email_subscribe` — 트랜잭션 메일(접수 확인 등)은 구독 동의 불필요하므로 생략.

### 식별자 선택

| 방식 | 장단점 |
|------|--------|
| `email`만 사용 | 빠르게 시작 가능. 중복 프로필 위험 있음 |
| `external_id` + `email` | 중복 방지에 유리. external_id 체계 미리 설계 필요 |
| `user_alias` + `email` ★현행 | external_id 없는 신규 유저에 적합. 기존 프로필 자동 병합 없음(안전). `_update_existing_only: false` 필수 |

> **중복 프로필 주의**: 같은 이메일이 여러 번 들어오면 `email` 기준 자동 병합이 안 될 수 있음.
> 운영 규모가 커지면 `external_id`(예: 이메일 해시값 또는 자체 ID) 사용 권장.

---

## 3. Apps Script 연동

### 현행 구현 — doPost 웹앱 방식

구글폼 없이 GitHub Pages HTML 폼에서 직접 POST를 받는 방식.
Apps Script를 **웹앱으로 배포**하면 외부에서 접근 가능한 URL이 생긴다.

**배포 방법:**
1. Apps Script 편집기 → **배포 → 새 배포 → 웹앱**
2. 실행 주체: **나** / 액세스: **모든 사용자**
3. 배포 → 생성된 URL을 `supporters_form.html`의 `APPS_SCRIPT_URL`에 붙여넣기

**sendToBraze 함수 (현행):**

```javascript
function sendToBraze(data) {
  const email = data.email;
  const now   = new Date().toISOString();

  const payload = {
    attributes: [{
      user_alias            : { alias_name: email, alias_label: 'email' },
      _update_existing_only : false,
      email                 : email,
      jp_spt_name           : data.name,
      jp_spt_submitted_at   : now,
      jp_spt_round          : '262508',
    }],
    events: [{
      user_alias : { alias_name: email, alias_label: 'email' },
      name       : 'supporters_application',
      time       : now,
      properties : { round: '262508', country: 'JP', source: 'form' },
    }],
  };

  UrlFetchApp.fetch(CONFIG.BRAZE_ENDPOINT + '/users/track', {
    method            : 'post',
    contentType       : 'application/json',
    headers           : { Authorization: 'Bearer ' + CONFIG.BRAZE_API_KEY },
    payload           : JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
```

**HTML 폼 fetch 예시:**

```javascript
await fetch(APPS_SCRIPT_URL, {
  method : 'POST',
  mode   : 'no-cors',  // Apps Script CORS 제한 우회
  body   : JSON.stringify(formData),
});
```

> `no-cors` 모드에서는 응답 내용을 읽을 수 없음. 실패 여부는 Apps Script 실행 로그에서 확인.

---

## 4. Braze: Canvas로 자동 메일 발송

1. **Messaging → Canvas → Create Canvas**
2. **Entry Schedule**: `Action-Based` 선택
3. **Entry Action**: Custom event → `supporters_application`
   - 이벤트가 목록에 안 보이면: 테스트 제출 1회 먼저 실행 → 이벤트 기록 후 목록에 나타남
4. **회차 필터**: Add property filters → `round = '262508'`
5. Canvas 안에 **Message 스텝** 추가 → Email 작성

---

## 5. 설계 시 결정해야 할 것

### A. 메일 발송 타이밍

| 시나리오 | 구현 방법 |
|----------|-----------|
| 제출 즉시 웰컴메일 1통 ★현행 | events에 이벤트 찍기 → Canvas 즉시 트리거 |
| 검토 후 합격자만 발송 | attributes에 `status: "pending"` → 합격 시 `status: "approved"`로 업데이트 → Canvas Entry Filter로 조건 설정 |
| 정기 발송 대상 리스트 누적 | attributes만 저장, Canvas는 Scheduled로 따로 설계 |

### B. 옵트인(이메일 마케팅 동의)

- 트랜잭션 메일(접수 확인, 결과 안내 등)은 `email_subscribe` 설정 불필요.
- 서포터즈 접수 확인 메일은 트랜잭션으로 분류 → 생략 가능. 마케팅 메일에만 적용.

### C. 이벤트 프로퍼티로 회차 구분 ★현행

이벤트명을 회차별로 분리(`_r1`, `_r2`)하는 대신, 단일 이벤트명 + 프로퍼티로 구분.
`round` 값은 연월 기반 String (`'262508'` = 2026년 5월 8회차).

```json
"events": [{ "name": "supporters_application", "properties": { "round": "262508" } }]
```

| 비교 | 이벤트명 분리 방식 | 프로퍼티 방식 ★현행 |
|------|-------------------|---------------------|
| 이벤트 수 | 회차마다 1개씩 누적 | 항상 1개 |
| 전체 제출 수 집계 | 이벤트 여러 개 합산 필요 | 한 이벤트에서 바로 확인 |
| Canvas 트리거 구분 | 이벤트명으로 구분 | Add property filters로 구분 |

### D. 중복 유저 방지

- 같은 이메일로 여러 번 제출 → 동일 유저 프로필에 덮어쓰기 (attributes는 최신값으로 갱신)
- 이벤트는 제출 횟수만큼 누적됨 → 필요하면 Canvas에 `re-eligibility` 제한 설정

---

## 6. 응답 코드 확인

| 코드 | 의미 |
|------|------|
| `201` | 성공 |
| `400` | 요청 형식 오류 (바디 확인) |
| `401` | API 키 오류 |
| `429` | Rate limit 초과 (기본 50,000건/분) |

Apps Script 실행 로그 확인: 편집기 → 왼쪽 실행 아이콘(▶) → 실행 로그

---

## 7. Braze LP(lpBridge)와의 차이

| | lpBridge (Braze LP) | /users/track (외부 연동) |
|-|---------------------|--------------------------|
| 데이터 방향 | Braze가 자체 처리 | **우리가 API로 쏴줌** |
| 사용 시점 | Braze LP 내 폼 제출 | 구글폼·외부 소스 |
| 유저 식별 | LP 접근 시 토큰 자동 연결 | email 또는 external_id 직접 지정 |
| 설정 복잡도 | 낮음 | 중간 (API 키·스크립트 필요) |
| 직접 URL 접근 | 저장 실패 (이메일 경유 필수) | 제한 없음 ✅ |
