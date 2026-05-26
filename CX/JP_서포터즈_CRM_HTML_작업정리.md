# JP 서포터즈 CRM HTML 작업 정리

**작성일**: 2026-05-26  
**원본 기획**: [JP]서포터즈 CRM (Confluence ID: 2545582363)  
**디자인 기준**: CRM Phase 02 / `디자인시스템.md` + `module_catalog_v3.html`

---

## 개요

미리캔버스 재팬 서포터즈 프로그램 모집 및 참가 안내를 위한 CRM 메일 3종 HTML 제작.

---

## 메일 3종 요약

### 1. 모집 1차 — `email_supporters_01.html`

| 항목 | 내용 |
|---|---|
| 발송일 | 2026-05-28 (목) 17:00 |
| 제목 후보 A | 【MiriCanvasサポーターズ】Pro 6か月無料の特典付き・参加者募集中 |
| 제목 후보 B | 【第一期メンバー募集】MiriCanvasサポーターズに参加しませんか |
| 소구점 | 혜택 & 한정성 |
| CTA | サポーターズに応募する / 応募フォームへ進む |
| CTA URL | https://forms.gle/ABc4QJVTtFUsRbSk7 |

**사용 모듈**: `01 hero` → `02 body+highlight` (サポーター特典) → `05 cta_microcopy` → `08 header` (活動内容) → `02 body` → `08 header` (応募の流れ) → `12 step_block × 5` → `02 body+highlight` (募集期間) → `08 header` (FAQ) → `17 qa_section × 3` → `07 cta_headline_body` → `19 footer` → `20 unsubscribe`

---

### 2. 모집 2차 — `email_supporters_02.html`

| 항목 | 내용 |
|---|---|
| 발송일 | 2026-06-16 (화) |
| 제목 후보 A | 【締切まであと2週間】MiriCanvasサポーターズ第一期メンバー募集 |
| 제목 후보 B | 【MiriCanvasサポーターズ】応募締切は6月30日まで |
| 소구점 | 긴급성 & FOMO |
| CTA | サポーターズに応募する / 今すぐ申し込む |
| CTA URL | https://forms.gle/ABc4QJVTtFUsRbSk7 |

**사용 모듈**: `21 banner(alert)` → `01 hero` → `02 body+highlight` (締切情報) → `05 cta_microcopy` → `08 header` (혜택) → `02 body` → `08 header` (こんな方から) → `02 body` → `08 header` (応募の流れ) → `12 step_block × 5` → `02 body+highlight` (募集期間) → `06 cta_body_microcopy` → `19 footer` → `20 unsubscribe`

---

### 3. 신청 후 참가 안내 — `email_supporters_03_after.html`

| 항목 | 내용 |
|---|---|
| 발송 조건 | 서포터즈 신청 후 채용 결정 시 |
| 제목 | 【MiriCanvas】サポーターズの参加のご案内 |
| 소구점 | 온보딩 (LINE 친구 추가 유도) |
| CTA | 公式LINEに友だち追加する |
| CTA URL | https://lin.ee/pIVLRXN |

**사용 모듈**: `01 hero` → `02 body` (채용통지) → `08 header` (活動開始の流れ) → `12 step_block` (STEP 1: LINE추가 + 배너 + Secondary CTA + QR) → `12 step_block` (STEP 2: 쿠폰수령) → `12 step_block` (STEP 3: 활동개시) → `02 body+highlight` (大切なお願い) → `02 body` (サポーターズについて) → `04 cta_solo` → `19 footer` → `20 unsubscribe`

---

## 디자인 시스템 적용 내역

| 항목 | 적용값 |
|---|---|
| 메인 컬러 | `#26c7d9` (module_catalog_v3 기준) |
| 배경 | outer `#f4f4f4` / inner `#ffffff` |
| 하이라이트박스 | `#e9f9fb` + `border-left: 4px solid #26c7d9` |
| 폰트 | `'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif` |
| 본문 line-height | `1.7` |
| word-break | `break-all` (전체 텍스트 요소) |
| Primary CTA | `padding: 16px 56px`, `background: #26c7d9`, `border-radius: 4px` |
| Secondary CTA | `border: 2px solid #26c7d9`, `padding: 12px 28px` |
| 최대 너비 | 600px |
| 수신거부 태그 | `{{${set_user_to_unsubscribed_url}}}` |

---

## 공통 사항

- **문의 이메일**: team.miricanvas.jp@miridih.com
- **푸터 주소**: 〒150-0031 東京都渋谷区桜丘町26-1 セルリアンタワー15階
- **LINE URL**: https://lin.ee/pIVLRXN
- **QR 이미지**: `https://asset.cms.miricanvas.com/resources/storage/s/cp/bizhows/miricanvas_global_jp/supporters_line/LINE_QR_S.png`

---

## 파일 위치

```
C:\Users\USER\Downloads\[미리디 미캔재팬]\[CX]\
├── email_supporters_01.html   ← 모집 1차 (2026-05-28)
├── email_supporters_02.html   ← 모집 2차 (2026-06-16)
└── email_supporters_03_after.html  ← 신청 후 참가 안내
```

원본 디자인시스템:
```
C:\Users\USER\Downloads\[미리디 미캔재팬]\[CRM]\CRM Phase 02\
├── 디자인시스템.md
└── module_catalog_v3.html
```
