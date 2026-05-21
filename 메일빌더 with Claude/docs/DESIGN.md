# CRM 메일 빌더 — 기술 설계 문서

> **상태:** v1 설계 (구현 직전)
> **작성:** 2026-04-25
> **참고:** [`docs/PRD.md`](./PRD.md)
> **목표:** PRD를 만족하면서 구현 시 의사결정이 필요 없도록 충분히 구체적인 청사진

---

## 1. 아키텍처 개요

```
┌─────────────────┐    JSON API    ┌──────────────────┐    File I/O    ┌──────────────┐
│  브라우저       │ ⇄ HTTP/JSON ⇄ │  Flask 서버      │ ⇄ Read/Write ⇄ │  파일 시스템 │
│  단일 SPA       │                │  Python 백엔드   │                │  JSON 파일   │
│  (HTML+CSS+JS)  │                │  포트 5001       │                │  per 메일    │
└─────────────────┘                └──────────────────┘                └──────────────┘
```

- 모든 컴포넌트가 사용자 PC 내부에서 동작. 외부 네트워크 의존 없음
- DB 없음 — 메일 1통 = 1 JSON 파일
- 프론트엔드 = 단일 SPA. 페이지 리로드 없이 JS로 탭/뷰 전환

---

## 2. 폴더 구조

```
crm/
├── _pipeline/                      ← 기존 (그대로 둠)
├── module_catalog_annotated.html   ← 영감용 (편집·테스트 기준 X)
├── docs/
│   ├── PRD.md
│   └── DESIGN.md                   ← 이 문서
└── _builder/                       ← 이번 신규 작업
    ├── app.py                      # Flask 진입점
    ├── requirements.txt
    ├── README.md
    ├── server/
    │   ├── __init__.py
    │   ├── routes.py               # API 라우트
    │   ├── storage.py              # JSON 파일 저장/로딩 + 백업
    │   ├── library.py              # 레이아웃·박스·요소·프리셋 정의
    │   ├── renderer.py             # JSON 트리 → 이메일 HTML
    │   └── sanitizer.py            # 리치 텍스트 화이트리스트 필터
    ├── static/
    │   ├── index.html              # 단일 SPA 엔트리
    │   ├── css/
    │   │   └── style.css
    │   └── js/
    │       ├── app.js              # 메인 컨트롤러 (탭 전환·전역 상태·라우팅)
    │       ├── api.js              # 백엔드 호출 래퍼
    │       ├── sidebar.js          # 사이드바 컴포넌트
    │       ├── intro.js            # 소개탭
    │       ├── editor/
    │       │   ├── index.js        # 제작탭 컨트롤러
    │       │   ├── library.js      # 좌측 라이브러리 패널
    │       │   ├── canvas.js       # 좌측 구성 영역
    │       │   ├── preview.js      # 우측 비주얼/코드 토글
    │       │   ├── richtext.js     # contentEditable + 자체 툴바
    │       │   ├── undo.js         # Undo 스택 관리
    │       │   └── spacing.js      # 여백 컨트롤 패널
    │       └── compare.js          # 비교탭
    ├── mails/                      # 사용자 데이터 (gitignore)
    │   ├── {id}.json
    │   └── .backup/
    │       └── {id}-{timestamp}.json
    └── tests/
        ├── sample_complete.html    # 정합성 테스트 정답 HTML (수동 작성)
        ├── sample_complete.json    # 위 HTML과 1:1 대응되는 JSON 트리
        ├── renderer_fidelity.py    # pytest 테스트
        └── manual.md               # 매뉴얼 체크리스트
```

---

## 3. 백엔드 — Flask API

### 3.1 라우트 목록

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | `static/index.html` 서빙 |
| GET | `/static/<path>` | 정적 파일 |
| GET | `/api/library` | 레이아웃·박스·요소·프리셋 정의 (전체) |
| GET | `/api/mails` | 메일 목록 (메타데이터만 — id, title, number, language, createdAt, lastSavedAt) |
| POST | `/api/mails` | 새 메일 생성 (body: `{ title, language }`) → 반환: 새 메일 JSON |
| GET | `/api/mails/<id>` | 메일 1개 전체 JSON 트리 로딩 |
| PUT | `/api/mails/<id>` | 메일 저장 (body: 전체 JSON 트리). 기존 파일은 백업으로 이동 |
| DELETE | `/api/mails/<id>` | 메일 삭제 (mails/{id}.json + 모든 백업) |
| POST | `/api/mails/<id>/duplicate` | 메일 복제 → 반환: 새 메일 JSON |
| PATCH | `/api/mails/<id>/title` | 제목만 빠르게 갱신 (사이드바 인라인 수정용) |
| POST | `/api/render` | (옵션) JSON 트리 → HTML 변환 (서버 사이드 렌더). 프론트가 자체 렌더하므로 v1에선 미구현 가능 |

### 3.2 데이터 무결성

- 모든 라우트에 경로 탈출 방지 (`if "/" in id or ".." in id: abort(400)`)
- 저장 시 기존 파일이 있으면 백업 폴더로 이동 → 새 파일 쓰기 → 백업 3개 초과분 삭제
- ID 형식: UUID4 (충돌 사실상 0)

### 3.3 에러 응답
- 4xx: `{ "error": "...", "code": "..." }` JSON
- 5xx: 동일 형식 + 콘솔 로깅

---

## 4. 데이터 모델

### 4.1 메일 1통 — JSON 스키마

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "D7 폰트 변경 안내",
  "number": 4,
  "language": "ja",
  "createdAt": "2026-04-25T14:30:12+09:00",
  "lastSavedAt": "2026-04-25T15:42:00+09:00",
  "tree": {
    "layouts": [
      {
        "id": "lay-001",
        "type": "1col",
        "padding": null,
        "bgColor": null,
        "cells": [
          {
            "id": "cell-001",
            "items": [
              {
                "kind": "element",
                "id": "el-001",
                "type": "image",
                "src": "https://...",
                "alt": "logo",
                "width": 120,
                "align": "center"
              },
              {
                "kind": "element",
                "id": "el-002",
                "type": "text",
                "html": "<h1>안녕하세요</h1>"
              }
            ]
          }
        ]
      },
      {
        "id": "lay-002",
        "type": "1col",
        "padding": { "top": 30, "bottom": 30 },
        "bgColor": "#e9f9fb",
        "cells": [
          {
            "id": "cell-002",
            "items": [
              {
                "kind": "box",
                "id": "box-001",
                "padding": { "top": 25, "right": 20, "bottom": 25, "left": 20 },
                "bgColor": "#ffffff",
                "borderRadius": 8,
                "items": [
                  { "kind": "element", "id": "el-003", "type": "text", "html": "<p>본문</p>" },
                  { "kind": "element", "id": "el-004", "type": "button", "label": "지금", "href": "https://...", "bgColor": "#26c7d9", "size": "medium" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 4.2 타입별 필드

#### 레이아웃 공통
- `id`, `type` (`1col` | `2col-50-50` | `2col-33-67` | `2col-67-33` | `3col`)
- `padding`: `null` 또는 `{ top?, right?, bottom?, left? }` (생략된 방향은 디폴트)
- `bgColor`: `null` 또는 hex 문자열
- `cells`: 배열. 길이는 type에 따라 1/2/2/2/3

#### 셀 (Cell)
- `id`, `items: (Box | Element)[]`

#### 박스 (Box, `kind: "box"`)
- `id`, `padding`, `bgColor`, `borderColor?`, `borderWidth?`, `borderRadius?`, `items: (Box | Element)[]`

#### 요소 (Element, `kind: "element"`)
- `id`, `type`, + 타입별 추가 필드:
  - `text`: `html` (sanitize된 HTML)
  - `image`: `src`, `alt`, `width`, `align`, `link?`
  - `button`: `label`, `href`, `bgColor`, `size`, `align`
  - `divider`: `color`, `thickness`, `width`
  - `spacer`: `height`

### 4.3 Padding 규칙
- `padding: null` → 라이브러리 디폴트 그대로
- `padding: { top: 30 }` → top만 override, 나머지는 디폴트
- 직렬화 시 디폴트와 같은 값은 자동 제거 (정합성 보장)

---

## 5. 라이브러리 정의 (server/library.py)

### 5.1 정의 형식 (예시)

```python
LAYOUTS = {
    "1col": {
        "label": "1열",
        "cells": 1,
        "default_padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
        "default_bg": None,
        "html_template": "<tr><td style='{style}'>{cells}</td></tr>",
    },
    "2col-50-50": {
        "label": "2열 50:50",
        "cells": 2,
        "default_padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
        "html_template": "<tr><td style='{style}'><table width='100%'><tr>{cells}</tr></table></td></tr>",
        "cell_html_template": "<td width='50%' valign='top'>{content}</td>",
    },
    # ... 나머지 3개
}

ELEMENTS = {
    "text": {
        "label": "텍스트",
        "icon": "📝",
        "default_html": "<p>텍스트를 입력하세요</p>",
    },
    "image": {
        "label": "이미지",
        "icon": "🖼",
        "default_src": "https://placehold.co/600x300?text=이미지",
        "default_alt": "이미지",
        "default_width": 600,
        "default_align": "center",
    },
    # ... 나머지 3개
}

PRESETS = {
    "hero": {
        "label": "Hero",
        "icon": "🎯",
        "expand": lambda: [
            { "kind": "layout", "type": "1col", "cells": [
                { "items": [
                    { "kind": "element", "type": "image", ... },
                    { "kind": "element", "type": "text", "html": "<h1>...</h1>" }
                ]}
            ]}
        ],
    },
    # ... 나머지 11개 (#2~#12)
    "footer_company": {
        "label": "Footer Company",
        "icon": "🏢",
        "expand": lambda: [
            { "kind": "layout", "type": "1col", "bgColor": "#2a2a2a",
              "padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
              "cells": [{ "items": [
                { "kind": "element", "type": "text",
                  "html": "<p style='color:#fff;'>회사명 · HP · 이메일 · 주소</p>" }
              ]}]}
        ],
    },
    "footer_unsubscribe": {
        "label": "Footer Unsubscribe",
        "icon": "✉",
        "expand": lambda: [
            { "kind": "layout", "type": "1col", "bgColor": "#2a2a2a",
              "padding": {"top": 10, "right": 20, "bottom": 30, "left": 20},
              "cells": [{ "items": [
                { "kind": "element", "type": "text",
                  "html": "<p style='color:#aaa;font-size:11px;'>"
                          "수신을 원하지 않으시면 "
                          "<a href='{{${set_user_to_unsubscribed_url}}}'>여기</a>를 클릭해 주세요."
                          "</p>" }
              ]}]}
        ],
    },
}
# 총 14개 프리셋 (이전 12개 + 푸터 2개)
```

### 5.2 프리셋 분해 동작
- 사용자가 프리셋을 드롭하면 `expand()` 함수 호출 → 레이아웃·박스·요소 트리로 변환 → 구성 영역에 삽입
- 삽입 후 프리셋이라는 정보는 사라짐 (일반 블록과 구분 안 됨)

---

## 6. 렌더링 파이프라인 (server/renderer.py & static/js/preview.js)

### 6.1 파이프라인
```
JSON 트리 → traverse → 각 노드 HTML 조각 생성 → 합쳐서 완성된 이메일 HTML
                                                         ↓
                                                    sanitize 검증
                                                         ↓
                                              우측 비주얼/코드 화면에 표시
```

### 6.2 양쪽 구현 (서버 vs 프론트)
- **프론트엔드 렌더러** (`static/js/preview.js`): 실시간 프리뷰용. JSON 트리를 즉시 HTML로 변환
- **서버 렌더러** (`server/renderer.py`): 정합성 테스트용. 프론트와 동일한 결과를 산출해야 함
- 두 구현이 일치하는지 자동 테스트 (`tests/renderer_fidelity.py`)에서 검증

### 6.3 모바일 반응형
- 2열·3열 레이아웃은 `@media (max-width: 600px)` CSS로 자동 1열 스택
- 인라인 스타일 + 미디어 쿼리 (이메일 호환성을 위해 `<style>` 태그는 `<head>`에)

### 6.4 출력 HTML 골격

```html
<!DOCTYPE html>
<html lang="{language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{title}</title>
  <style>
    @media screen and (max-width: 600px) {
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:{fontStack}; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#fff;">
          <!-- 사용자 레이아웃 트리 전체 (푸터 포함) -->
          {tree_html}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**푸터 정책:** 자동 삽입 없음. 푸터 2종은 일반 프리셋(`footer_company`, `footer_unsubscribe`)으로 사용자 트리의 일부 — 신규 메일 생성 시 14개 프리셋 모두 자동 삽입되므로 처음엔 항상 들어 있음. 사용자가 삭제하면 출력에서도 빠짐 (사용자 책임).

---

## 7. 외부 라이브러리

### 7.1 드래그앤드롭 — Sortable.js (CDN)
- 라이브러리 패널 → 구성 영역 드롭
- 구성 영역 내부 카드 순서 변경
- 박스 간 카드 이동 (중첩 박스 지원)
- 드롭 시 콜백에서 JSON 트리 업데이트 + Undo 스택 push

### 7.2 리치 텍스트 — contentEditable + 자체 툴바
- 텍스트 요소 클릭 시 인라인 편집 활성화
- 상단 또는 호버 시 툴바: B / U / 링크 / H1-H4 토글 / 리스트 (UL/OL) / 줄바꿈
- 입력 종료 시 (blur) → `sanitize()` 호출 → 화이트리스트 외 태그·속성 제거 → JSON 저장
- 화이트리스트:
  - 태그: `p`, `br`, `strong`, `u`, `a`, `ul`, `ol`, `li`, `h1`, `h2`, `h3`, `h4`
  - 속성: `a`의 `href`만
  - 인라인 스타일 (`style="..."`) — 일괄 제거. 색상·정렬은 요소 메타데이터로 별도 관리
  - **예외 — Braze 변수 보존:** `{{${...}}}` 패턴은 sanitize 통과 (특히 `{{${set_user_to_unsubscribed_url}}}`). 텍스트 노드뿐 아니라 `<a href>`에도 사용 가능

### 7.3 코드 표시 — `<textarea readonly>` + 복사 버튼
- 신택스 하이라이트는 v2

---

## 8. 프론트엔드 — 단일 SPA 동작

### 8.1 라우팅
- 해시 기반: `#/intro`, `#/editor/{id}`, `#/compare`
- 브라우저 뒤로가기·앞으로가기 동작
- 메일 편집 중 다른 탭으로 가도 메모리 상태는 유지 (편집 메일을 닫지 않는 한)

### 8.2 전역 상태 (`app.js`)
```javascript
const state = {
  mails: [],                    // 사이드바 목록 메타
  currentMail: null,            // 편집 중인 메일 JSON 트리
  activeTab: "intro",
  editingMailId: null,
  comparingMailIds: new Set(),
  unsavedChanges: false,
  undoStack: [],
  redoStack: [],
  library: null,                // 서버에서 로드한 라이브러리 정의
};
```

### 8.3 이벤트 흐름 — 텍스트 편집 1회
```
사용자 키 입력
  ↓ (debounce 200ms)
contentEditable.oninput → editor/richtext.js
  ↓
sanitize() → JSON 트리 업데이트 (currentMail.tree.layouts[i].cells[j].items[k].html)
  ↓
undoStack.push(prevSnapshot)  (max 30, 가장 오래된 것 제거)
unsavedChanges = true
  ↓
preview.js.rerender() → 우측 화면 갱신
상단바 저장 버튼 활성화, 닫기 버튼 비활성화
```

### 8.4 저장 흐름
```
사용자 저장 클릭
  ↓
api.js: PUT /api/mails/{id} (body = currentMail)
  ↓
서버: 기존 파일 → mails/.backup/{id}-{timestamp}.json
서버: 새 파일 쓰기
서버: 백업 3개 초과분 삭제
  ↓
응답 200
  ↓
unsavedChanges = false
닫기 버튼 활성화
```

---

## 9. 에러 처리

| 상황 | 동작 |
|---|---|
| 저장 실패 (디스크 가득, 권한 등) | 상단 빨간 알림 배너 + 저장 버튼은 활성 유지 (재시도). 메모리 상태 보존 |
| 로딩 실패 (JSON 손상) | "파일이 손상되었습니다. Claude Code에 백업 복구 명령" 안내 페이지 |
| 이미지 URL 깨짐 | 렌더링 화면: placeholder 이미지 fallback. 편집 화면: 빨간 ⚠ 아이콘 |
| CTA href 비어있음 | 편집 화면 노란 ⚠ (저장은 가능) |
| 서버 다운 | 상단 빨간 배너 "서버 연결 끊김. 콘솔에서 python app.py 다시 실행" |
| 메일 ID 충돌 | UUID4 사용 → 사실상 발생 0. 발생 시 재생성 |
| 브라우저 닫기 (미저장) | 표준 `beforeunload` 컨펌 |
| 다른 메일 편집 시도 (편집 중) | 차단 팝업 (스펙대로) |
| Sanitizer가 모르는 태그 발견 | 제거 + 콘솔 경고. 사용자 텍스트는 보존 |

---

## 10. 테스트 전략

### 10.1 렌더러 정합성 자동 테스트 (핵심)

**파일:** `tests/sample_complete.html` + `tests/sample_complete.json`

`sample_complete.html`은 다음을 모두 포함:
- 5가지 레이아웃 모두 사용 (1열, 2열 50:50, 2열 33:67, 2열 67:33, 3열)
- 박스 (단일·중첩) 사용
- 5가지 요소 모두 사용 (텍스트·이미지·버튼·구분선·여백)
- 패딩 변형 (디폴트 + override)
- 배경색 변형 (white·light teal·custom)
- 14가지 프리셋 동등 패턴 모두 한 번씩 등장 (푸터 2종 포함)
- 4개 언어 (한·일·영·포) 각각 한 통씩

**`tests/sample_complete.json`:** 위 HTML을 표현하는 JSON 트리

**`tests/renderer_fidelity.py`** (pytest):
```python
def test_renderer_matches_sample():
    expected_html = read("tests/sample_complete.html")
    tree = json.load("tests/sample_complete.json")
    actual_html = render(tree)
    assert normalize(expected_html) == normalize(actual_html)
```

`normalize()` 함수: 공백·주석·인라인 스타일 키 순서·id 속성 정규화

### 10.2 매뉴얼 체크리스트 (`tests/manual.md`)

릴리스 전 사람이 클릭하며 확인 (PRD #12 완료 기준 그대로).

### 10.3 단위 테스트 (선택)
- `sanitize.py`: 화이트리스트 태그만 통과하는지
- `storage.py`: 백업 회전 (3개 초과 시 삭제)
- 단순한 케이스만, 과도하게 만들지 않음

---

## 11. 성능 고려

| 영역 | 정책 |
|---|---|
| 실시간 프리뷰 | 200ms debounce — 키 연타 시 마지막에만 렌더 |
| Undo 스택 | 최대 30. 메모리 사용량 무시할 수준 (메일당 수 KB) |
| 메일 목록 로딩 | 메타데이터만 먼저 (id·title·number·language·날짜) → 클릭 시 전체 로딩 |
| 이미지 로딩 | 외부 CDN 그대로. 로컬 캐시 안 함 |
| 비교 탭 | 각 메일을 iframe으로 표시 (CSS 격리) |

---

## 12. 보안 고려

- 단일 사용자 로컬 도구라 인증 없음
- 호스트는 `127.0.0.1`만 바인드 (외부 접속 차단)
- 경로 탈출 방지 (storage.py)
- Sanitizer로 XSS 차단 (자기 자신에게도 — 미래에 다중 사용자 도입 시 안전)
- 외부 이미지 URL은 검증 없이 사용 (사용자 책임 — 로컬 도구 컨텍스트)

---

## 13. 구현 순서 (마일스톤)

각 마일스톤이 끝났을 때 사용자가 직접 확인 가능한 결과물 있음.

| # | 단계 | 산출물 |
|---|---|---|
| **M1** | 프로젝트 골격 + 렌더러 | `python app.py` 실행 → 빈 메일 → 우측에 600px 빈 이메일 렌더 |
| **M2** | 라이브러리 정의 + 기본 추가 | 좌측 라이브러리 패널에서 1열 레이아웃·텍스트 요소 드래그 → 추가 |
| **M3** | 5가지 레이아웃 + 박스 + 5요소 + 여백 컨트롤 | 모든 빌딩 블록 동작 |
| **M4** | 리치 텍스트 + 비주얼/코드 토글 | 텍스트 인라인 편집 + 코드 복사 |
| **M5** | 사이드바 + 저장/로드 + 백업 | 메일 목록·저장·재오픈 |
| **M6** | Undo + 미저장 처리 + 복제 | Ctrl+Z·beforeunload·duplicate |
| **M7** | 비교 탭 + 폭 토글 | 메일 비교 |
| **M8** | 프리셋 12종 | 자주 쓰는 조합 1클릭 |
| **M9** | 4개 언어 + 폰트 자동 | 언어별 폰트 스택 |
| **M10** | 정합성 테스트 + 매뉴얼 체크리스트 통과 | v1 완료 |

---

## 14. 위험 요소 (재확인)

| # | 위험 | 대응 |
|---|---|---|
| 1 | 렌더러 정합성 (서버 vs 프론트 vs sample_complete) | 자동 테스트로 매번 검증. 차이 발생 시 즉시 수정 |
| 2 | 리치 텍스트 → 이메일 안전 HTML | 화이트리스트 sanitizer + 단위 테스트. 실 Gmail 발송 1회 검증 |
| 3 | Undo 스택 메모리 | 30단계 한정 + 메일당 수 KB 라 무시 가능 |
| 4 | 박스 무한 중첩의 UI 가독성 | 들여쓰기 + 색 구분. 실용상 깊이 3 이상 잘 안 감 |
| 5 | 모바일 반응형 (2/3열 → 1열 스택) | sample_complete에 모바일 케이스 포함, 매뉴얼 체크에 폭 토글 확인 |

---

## 15. 미결정 사항 (구현 시 자연스럽게 결정)

- 사이드바 기본 폭 (240px 가안)
- 라이브러리 패널 기본 폭 (240px 가안)
- 프리뷰 영역 폭 (640px = 600 + 패딩)
- 박스 기본 스타일 (white bg + 1px solid #ddd 가안)
- 토글 애니메이션 (CSS transition 200ms 가안)
- 빈 메일 placeholder 텍스트

이 항목들은 구현 시 사용자가 마음에 안 들어 하면 즉시 변경 가능한 자잘한 시각·UX 결정.

---

_작성: 2026-04-25 / 다음 단계: 구현 플랜 작성 (writing-plans 스킬)_
