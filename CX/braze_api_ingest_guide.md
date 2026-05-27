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
GitHub Pages HTML 폼
    ↓ fetch() POST
Apps Script 웹앱 (doPost)
    ↓ POST /users/track
Braze — user_alias 프로필 생성 + supporters_form_submitted 이벤트
    ↓
Canvas Action-Based → 접수 확인 메일 발송
```

---

## 1. Braze에서 REST API 키 만들기

경로: **Settings → APIs and Identifiers → REST API Keys → + Create New API Key**

| 필요 권한 | 설명 |
|-----------|------|
| `users.track` | 유저 속성·이벤트·구매 기록 |

- **REST Endpoint** 확인: 같은 페이지 또는 Settings → APIs and Identifiers 상단
  - 예) `https://rest.iad-01.braze.com` (대시보드 URL에 따라 다름)
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

### 바디 구조

```json
{
  "attributes": [
    {
      "email": "yamada@example.com",
      "first_name": "山田",
      "email_subscribe": "subscribed",
      "커스텀속성명": "값"
    }
  ],
  "events": [
    {
      "email": "yamada@example.com",
      "app_id": "{APP_ID}",
      "name": "google_form_submitted",
      "time": "2026-05-22T10:00:00Z",
      "properties": {
        "form_name": "supporters",
        "source": "google_form"
      }
    }
  ]
}
```

### 식별자 선택

| 방식 | 장단점 |
|------|--------|
| `email`만 사용 | 빠르게 시작 가능. 중복 프로필 위험 있음 |
| `external_id` + `email` | 중복 방지에 유리. external_id 체계 미리 설계 필요 |

> **중복 프로필 주의**: 같은 이메일이 여러 번 들어오면 `email` 기준 자동 병합이 안 될 수 있음.
> 운영 규모가 커지면 `external_id`(예: 이메일 해시값 또는 자체 ID) 사용 권장.

### APP_ID 확인 위치

Settings → APIs and Identifiers → App Identifiers 탭

---

## 3. 구글폼 연동 — Apps Script 예시

구글폼 → 스프레드시트 연결 후, 스프레드시트의 **확장 프로그램 → Apps Script**에 아래 코드 추가.

```javascript
const BRAZE_ENDPOINT = "https://rest.iad-01.braze.com"; // 본인 엔드포인트로 변경
const BRAZE_API_KEY  = "YOUR_REST_API_KEY";
const BRAZE_APP_ID   = "YOUR_APP_ID";

function onFormSubmit(e) {
  const response = e.namedValues; // 구글폼 질문명: 응답값 배열

  const email     = response["メールアドレス"]?.[0]?.trim();
  const firstName = response["お名前"]?.[0]?.trim();
  if (!email) return; // 이메일 없으면 중단

  const now = new Date().toISOString();

  const payload = {
    attributes: [{
      email:           email,
      first_name:      firstName || "",
      email_subscribe: "subscribed",  // 옵트인 동의한 경우에만
      lead_source:     "google_form"
    }],
    events: [{
      email:   email,
      app_id:  BRAZE_APP_ID,
      name:    "google_form_submitted",
      time:    now,
      properties: {
        form_name: "supporters_offline"
      }
    }]
  };

  const options = {
    method:      "post",
    contentType: "application/json",
    headers:     { Authorization: "Bearer " + BRAZE_API_KEY },
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(BRAZE_ENDPOINT + "/users/track", options);
  Logger.log(res.getContentText()); // 로그 확인용
}
```

**트리거 설정**: Apps Script 편집기 → 왼쪽 시계 아이콘(트리거) → `onFormSubmit` → 이벤트: 스프레드시트 / 폼 제출 시

---

## 4. Braze: Canvas로 자동 메일 발송

1. **Messaging → Canvas → Create Canvas**
2. **Entry Schedule**: `Action-Based` 선택
3. **Entry Action**: Custom event → `google_form_submitted`
   - 이벤트가 목록에 안 보이면: 테스트 제출 1회 먼저 실행 → 이벤트 기록 후 목록에 나타남
4. Canvas 안에 **Message 스텝** 추가 → Email 작성
5. 발송 조건에 `email_subscribe = subscribed` 필터 추가 권장 (미동의자 제외)

---

## 5. 설계 시 결정해야 할 것

### A. 메일 발송 타이밍

| 시나리오 | 구현 방법 |
|----------|-----------|
| 제출 즉시 웰컴메일 1통 | events에 이벤트 찍기 → Canvas 즉시 트리거 |
| 검토 후 합격자만 발송 | attributes에 `status: "pending"` → 합격 시 `status: "approved"`로 업데이트 → Canvas Entry Filter로 조건 설정 |
| 정기 발송 대상 리스트 누적 | attributes만 저장, Canvas는 Scheduled로 따로 설계 |

### B. 옵트인(이메일 마케팅 동의)

- 폼에 명시적 동의 체크박스 필수
- 동의 시에만 `"email_subscribe": "subscribed"` 포함해서 전송
- 미동의자는 `"email_subscribe": "unsubscribed"` 또는 속성 자체를 생략

### C. 중복 유저 방지

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

---

## 7. Braze LP(lpBridge)와의 차이

| | lpBridge (Braze LP) | /users/track (외부 연동) |
|-|---------------------|--------------------------|
| 데이터 방향 | Braze가 자체 처리 | **우리가 API로 쏴줌** |
| 사용 시점 | Braze LP 내 폼 제출 | 구글폼·외부 소스 |
| 유저 식별 | LP 접근 시 토큰 자동 연결 | email 또는 external_id 직접 지정 |
| 설정 복잡도 | 낮음 | 중간 (API 키·스크립트 필요) |
