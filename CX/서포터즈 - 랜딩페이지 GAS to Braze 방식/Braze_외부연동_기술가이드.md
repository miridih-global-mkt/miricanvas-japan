# Braze 외부 연동 기술 가이드 — /users/track

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

---

## 1. Braze REST API 키 만들기

경로: **Settings → APIs and Identifiers → REST API Keys → + Create New API Key**

| 필요 권한 | 설명 |
|-----------|------|
| `users.track` | 유저 속성·이벤트·구매 기록 |

- **REST Endpoint** 확인: 같은 페이지 또는 Settings → APIs and Identifiers 상단
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

### 바디 구조 — user_alias 방식

external_id 없는 신규 유저(외부 폼 제출자 등)에 적합. 기존 미캔버스 프로필을 건드리지 않음.

```json
{
  "attributes": [{
    "user_alias": { "alias_name": "yamada@example.com", "alias_label": "email" },
    "_update_existing_only": false,
    "email": "yamada@example.com",
    "커스텀속성1": "값1",
    "커스텀속성2": "값2"
  }],
  "events": [{
    "user_alias": { "alias_name": "yamada@example.com", "alias_label": "email" },
    "name": "이벤트명",
    "time": "2026-05-28T01:00:00.000Z",
    "properties": { "key": "value" }
  }]
}
```

- `_update_existing_only: false` — alias 프로필이 없으면 신규 생성. 반드시 포함.
- `app_id` — server-side `/users/track`에서는 생략 가능 (선택사항).
- `email_subscribe` — 트랜잭션 메일은 구독 동의 불필요하므로 생략 가능.

### 식별자 선택

| 방식 | 장단점 |
|------|--------|
| `email`만 사용 | 빠르게 시작 가능. 중복 프로필 위험 있음 |
| `external_id` + `email` | 중복 방지에 유리. external_id 체계 미리 설계 필요 |
| `user_alias` + `email` | external_id 없는 신규 유저에 적합. 기존 프로필 자동 병합 없음(안전). `_update_existing_only: false` 필수 |

> **중복 프로필 주의**: 같은 이메일이 여러 번 들어오면 `email` 기준 자동 병합이 안 될 수 있음.
> 운영 규모가 커지면 `external_id`(예: 이메일 해시값 또는 자체 ID) 사용 권장.

---

## 3. Apps Script 연동

### 배포 방법

1. Apps Script 편집기 → **배포 → 새 배포 → 웹앱**
2. 실행 주체: **나** / 액세스: **모든 사용자**
3. 배포 → 생성된 URL을 HTML 폼의 `APPS_SCRIPT_URL`에 붙여넣기

### doPost 웹앱 방식

구글폼 없이 HTML 폼에서 직접 POST를 받는 방식.

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    saveToSheet(data);
    sendToBraze(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### HTML 폼 fetch 예시

```javascript
await fetch(APPS_SCRIPT_URL, {
  method : 'POST',
  mode   : 'no-cors',  // Apps Script CORS 제한 우회
  body   : JSON.stringify(formData),
});
```

> `no-cors` 모드에서는 응답 내용을 읽을 수 없음. 실패 여부는 Apps Script 실행 로그에서 확인.
> 편집기 → 왼쪽 실행 아이콘(▶) → 실행 로그

---

## 4. Braze Canvas로 자동 메일 발송

1. **Messaging → Canvas → Create Canvas**
2. **Entry Schedule**: `Action-Based` 선택
3. **Entry Action**: Custom event → 이벤트명 지정
   - 이벤트가 목록에 안 보이면: 테스트 제출 1회 먼저 실행 → 이벤트 기록 후 목록에 나타남
4. **회차 필터**: Add property filters → `round = '값'`
5. Canvas 안에 **Message 스텝** 추가 → Email 작성

---

## 5. 응답 코드

| 코드 | 의미 |
|------|------|
| `201` | 성공 |
| `400` | 요청 형식 오류 (바디 확인) |
| `401` | API 키 오류 |
| `429` | Rate limit 초과 (기본 50,000건/분) |

---

## 6. Braze LP(lpBridge)와의 차이

| | lpBridge (Braze LP) | /users/track (외부 연동) |
|-|---------------------|--------------------------|
| 데이터 방향 | Braze가 자체 처리 | **우리가 API로 쏴줌** |
| 사용 시점 | Braze LP 내 폼 제출 | 구글폼·외부 소스 |
| 유저 식별 | LP 접근 시 토큰 자동 연결 | email 또는 external_id 직접 지정 |
| 설정 복잡도 | 낮음 | 중간 (API 키·스크립트 필요) |
| 직접 URL 접근 | 저장 실패 (이메일 경유 필수) | 제한 없음 ✅ |
