# 캠페인 HTML 26개 → v2.7 빌더 마이그레이션 보고서

**일시**: 2026-04-30
**대상**: 26개 (28개 - 차트 2개 제외)
**스크립트**: `_builder/migrate_html.py`
**저장 위치**: `_builder/mails/{uuid}.json`

---

## 1. 결과 요약

- ✅ **26/26** 메일 모두 변환 성공 (실패 0)
- 빌더 API에서 정상 로딩, 미리보기 렌더, 스토리지 동작 확인

### 모듈 type 빈도

| type | 개수 | 메일 평균 |
|---|---|---|
| `section` | 78 | 3.0 |
| `footer_company` | 26 | 1.0 |
| `footer_unsubscribe` | 26 | 1.0 |
| `hero` | 22 | 0.85 |
| `cta_section` | 9 | 0.35 |

→ 4개 메일은 `hero` 미생성 (배너 이미지로 시작하는 웨비나 4건). 자동 fallback으로 첫 section이 hero 역할 함. 실제 렌더 결과는 동일하지만 모듈 시퀀스가 [section, ..., footer]로 시작.

### 슬롯 type 빈도

| type | 개수 | 비고 |
|---|---|---|
| `paragraph` | 114 | 본문 (richtext, `<b>/<u>/<br>` 보존) |
| `image` | 84 | 로고·콘텐츠 이미지·GIF |
| `heading` | 72 | H1 + 강조박스(border-left teal) 모두 |
| `button` | 50 | 모든 CTA 버튼 |
| `caption` | 38 | 이미지 아래 굵은 짧은 텍스트 (D3 일본어 "▼" 패턴 다수) |
| `info_row` | 24 | 웨비나 정보표 (4 메일 × 평균 6행) |

`divider`, `spacer`, `subtitle` 슬롯은 **0건** — 원본 HTML에 명시 사용 없음. 이들은 새로 만들 메일에서 사용될 예정.

---

## 2. 메인 이슈 (제품 추가 기능 검토 필요)

### 🔴 1. 비대칭 padding (4-direction)

**증상**: Hero TD의 padding이 `40px 20px 30px 20px` (top 40 ≠ bottom 30) — **22/26 메일에서 발생** (사실상 모든 hero를 포함하는 메일)

**현재 처리**: 데이터는 `{top:40, right:20, bottom:30, left:20}` dict로 보존. 렌더러는 4-direction CSS shorthand 출력. **손실 없음**.

**한계**: 빌더 UI는 padding을 **수직(top=bottom) / 수평(left=right) 2-input**으로 단순화함. 이 메일들을 빌더에서 열면 padding 표시가 `상하: 40 / 좌우: 20`처럼 보이고, 사용자가 만지는 순간 bottom이 40으로 통일됨 (정보 손실).

**제품 옵션**:
- (A) padding UI를 다시 4-direction으로 (사용성 ↓, 정확성 ↑)
- (B) 2-direction UI 유지 + 데이터에 4-direction이 들어있으면 "비대칭" 뱃지로 표시 → 클릭하면 4-input으로 펼침
- (C) 현 상태 유지: 마이그레이션 시 약간의 차이는 허용 (bottom 40 → 같이 통일)
- **권장**: B (정보 보존 + UI 단순)

### 🔴 2. footer가 검은 배경

**증상**: 모든 메일의 회사 푸터가 `background-color: #333333` 검은 배경에 흰 텍스트 + `#26c7d9` 강조 링크 + 회색 본문.

**현재**: 빌더의 `footer_company` 모듈은 흰색 고정 (다국어 자동 텍스트만). 검은 배경 표현 불가.

**제품 옵션**:
- footer_company에 `bgColor` 옵션 추가 + textColor 자동 보색
- 또는 검은 배경의 별도 footer 모듈 추가 (예: `footer_company_dark`)
- **권장**: 옵션 추가 (한 모듈로 다양한 메일 톤 지원)

### 🟠 3. 4-step 같은 반복 구조의 평탄화

**증상**: 4스텝 메일은 원본에서 큰 td 1개 안에 4단계가 다 들어있음 → 마이그레이션 결과 1 section + 슬롯 약 25개 (강조박스 4 + 본문 8 + 이미지 4 + 버튼 4 + ...).

**한계**: 빌더 UI에서 1 모듈 안에 25 슬롯이 길게 늘어짐. 각 단계를 분리된 모듈로 보고 싶을 수 있음.

**제품 옵션**:
- 슬롯 그룹화 기능 (가시적 구분선)
- "이 위치에서 모듈 분할" 버튼
- 또는 그냥 두기: 사용자가 모듈 복제 + 슬롯 옮겨서 직접 분할
- **권장**: 사용자가 모듈 복제 버튼으로 충분히 처리 가능 (이미 구현됨). 추가 기능 불필요.

### 🟠 4. paragraph 안의 청록색 강조 텍스트

**증상**: AIP/강조 영역에서 H2 역할로 `<p style="color:#26c7d9; font-weight:bold">AIで...自動生成！</p>` 패턴 — **5개 메일** (AIP, AIP_curiosity, 시리즈/2 AIP 등).

**현재 처리**: paragraph 슬롯에서 `<p>` 텍스트만 추출, 색상 정보 손실. 시각적으로 검은 굵은 글씨로 렌더 (강조감 부족).

**제품 옵션**:
- heading 슬롯에 `color` 옵션 추가
- 또는 paragraph richtext에 색상 지정 가능 (현재는 B/U/list만 허용)
- **권장**: heading에 색상 옵션 (간단). 본문 인라인 색상은 추가 안 함 (복잡도 ↑)

### 🟠 5. 강조박스 안 박스 중첩 (이중 컨테이너)

**증상**: AIP 영역은 `<tr td bg=#e9f9fb>` 안에 다시 `<table bg=#fff radius=8>` 흰 박스. 바깥 시안 + 안쪽 흰색 카드.

**현재 처리**: 바깥 td만 section(bgColor=#e9f9fb)으로 잡고, 안쪽 흰 박스 효과는 손실.

**제품 옵션**:
- box_section 모듈을 중첩 가능하게 (시퀀스 평면 구조 깨짐 — 복잡)
- section 옵션에 "내부 카드" toggle 추가 (이중 패딩 + 흰 배경)
- **권장**: 우선 미해결. 사용 빈도 낮음 (5건). 필요시 향후 box_section을 시퀀스 안에 끼워넣는 방식으로 흉내 가능.

### 🟡 6. 캡션 + 이미지 링크 동시

**증상**: 이미지에 클릭 링크 + 아래 캡션이 둘 다 있는 케이스 (드물지만 D3·D5 일부).

**현재 처리**: image 슬롯의 `link` 필드 + 다음 슬롯에 caption 별도 → 동작에 문제는 없으나 시각적으로 link 영역이 캡션도 포함하는지 분리되는지 모호.

**권장**: 현재 분리 처리로 OK.

### 🟡 7. info_row의 라벨 폰트 색

**증상**: 웨비나 정보표 라벨이 `#26c7d9` 청록색 텍스트.

**현재 처리**: info_row 렌더는 라벨 색상 `#444` 회색 고정.

**권장**: 보조 사항. 필요시 info_row에 `labelColor` 옵션 추가.

---

## 3. 첨언 (사소한 차이 — 메인 이슈 X)

- **헤더 폰트 크기**: 원본 H1은 `26px` 또는 `28px`. 빌더 hero heading은 `22px` 고정. headingSize 옵션은 24/28/32 선택지인데 26은 없음.
- **이미지 width**: 원본은 대부분 100% (반응형). 마이그레이션 시 width가 attribute 없으면 600 기본값 사용. 시각 손실 없음.
- **CTA 버튼 padding**: 원본은 `14px 40px`. 빌더 medium은 `12px 28px`. 약간 작게 보임 → size 옵션 large로 매뉴얼 변경 가능.
- **마진/spacer 사용 0건**: 원본은 모듈 사이 간격을 td padding으로 처리. 빌더에서는 spacer 슬롯이 가능하나 마이그레이션엔 안 넣음.
- **MiriCanvas 로고 width**: 원본 120px, hero 옵션 logoWidth는 폐기됐음 (단순화). 이미지 슬롯의 width 필드로 보존됨.
- **`<u>` 밑줄**: paragraph richtext 안에서 보존됨 ✓.
- **`<font color>` 같은 deprecated 태그**: 사용 0건.

---

## 4. 마이그레이션 후 손실 정리

| 손실 | 영향 받은 메일 수 | 회복 방법 |
|---|---|---|
| 검은 footer 배경 | 26 (전부) | footer_company.bgColor 옵션 추가 시 회복 |
| 비대칭 padding 정밀도 | 22 (Hero 있는 모든 메일) | 4-direction UI 도입 시 회복 |
| AIP 강조 텍스트 색상 (#26c7d9) | 5 | heading.color 옵션 |
| AIP 이중 박스 (시안 + 흰) | 5 | section 중첩 또는 inner-card 옵션 |
| 4단계 모듈 분리 | 4 (4스텝 계열) | 사용자가 직접 복제·분할 (기능 충분) |

---

## 5. 추천 제품 변경 우선순위

1. **footer_company에 bgColor 옵션 추가** — 1줄 변경, 영향 26 메일 ✅
2. **padding 4-direction 토글 UI** (수직/수평 ↔ 4방향 전환) — 영향 22 메일
3. **heading에 color 옵션** — 영향 5 메일 (AIP 강조)
4. (낮음) section의 inner-card 옵션 — AIP 흉내, 영향 5 메일
5. (낮음) info_row 라벨 색상 — 4 웨비나

---

## 6. 검증

- [x] `_builder/mails/`에 26 JSON 파일 존재
- [x] number 1~26 중복 없음
- [x] 모든 메일에 `modules` 배열 비어있지 않음
- [x] `GET /api/mails` 응답에 26개 모두 노출
- [x] `POST /api/render`로 첫 메일(4스텝) 렌더 → 6212자 HTML 정상, Braze 토큰 보존
- [x] 첫 메일 modules 시퀀스 `[hero, section, section, footer_company, footer_unsubscribe]` + 슬롯 18개

브라우저에서 메일 목록 → 각 메일 클릭 → 미리보기·코드 모두 확인 가능.
