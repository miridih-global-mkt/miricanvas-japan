> **측정 축 안내** (2026-05-22): 이 파일은 **L2 분석** — 단기 활성화(발송 후 72~168h 로그인 빈도, 디자인 생성 수) 기준.
> Phase 2 설계는 **v7 z-rank + KPI v3.2**(가입 후 30~60일 장기 정착) 기준으로 등급 부여.
>
> **두 분석의 EDUCATION 불일치**: L2에서 EDU_SERIES는 EDUCATION에 역효과(-2~-8). Phase 2 KPI에서는 B-tier(정착 효과 있음).
> → EDU 시리즈는 단기 활성화엔 안 움직이지만 장기 정착에 기여하는 패턴. 단기 지표로 판단하면 효과 없어 보임 주의.
>
> 이 파일은 세그먼트별 메일 선별 참고용 (Phase 2 설계의 보조 데이터). 운영 기준은 Phase 2 설계원칙.md 우선.

# user_type × 캔버스/Step 메일 효과 분석

본 문서는 6개 캔버스 × 18개 step × 6개 user_type(UNKNOWN 포함) cell에 대해, **44+개 metric 전수**(diagnostic metric 제외)를 통합 평가하여 양효과/역효과 메일을 분류한다.

**근거 데이터**: `분석산출물/L2_v4_results.csv` (50 metric, 5096행)
**필터**: 통제군 N≥80
**신호 임계**:
- 강신호: |z|≥2.0 + 일관성≥0.7
- 중간 신호: 1.0≤|z|<2.0 + 일관성≥0.7
- net score = 2×강+ + 1×중+ − 1×중− − 2×강−

**분류 기준** (단일 metric에 매몰되지 않도록 다지표 통합):
- 🟢 **강한 양효과**: 강신호 + ≥5개, 강신호 − ≤1개
- 🟢 **양효과**: 강신호 + ≥2개, 강신호 − =0, net≥5
- 🟠 **혼재**: 강신호 양·역 둘 다 ≥2 (세그먼트 내 부분 효과)
- 🔴 **(강한) 역효과**: 대칭 적용
- 🟡 **약한 효과**: 강신호 1개 + 반대 방향 0
- ⚪ **중립**: 위 모두 미해당

**제외 metric**: open_rate, click_rate (구조적 z 왜곡 — 통제군 메일 미수신)
**참고용 산출물**: `L2_cell_분류_요약.csv` (전 cell raw)

---

## 0. Executive Summary — user_type별 패턴

| user_type | 패턴 요약 |
|---|---|
| **BUSINESS** | 거의 모든 메일이 양효과 (D1·D2·EN1 강한 +). 강한 역효과 cell 0개. 가장 메일에 호응하는 세그먼트 |
| **COMPANY** | 극단적 분기. JA_SERIES 전 step 강한 +, D1·D2 단독은 대부분 역효과 |
| **EDUCATION** | 거의 모든 메일 역효과. 양효과 cell 0개. **메일 발송 전면 재검토** 후보 |
| **INDIVIDUAL** | D1 양효과, D2 기능 메일은 강한 역효과 (특히 image_bgremove, data_graph) |
| **STUDENT** | D1(공감/AI/리뷰류) 전부 강한 역효과, D2(기능 메일)는 양효과 — **메일 종류 분기 필요** |
| **UNKNOWN** | JA_SERIES 강한 +, D1 단독 강한 -, D2 mixed. 약 활성 신규 코호트 추정 |

### 같은 메일이 user_type에 따라 정반대 효과인 cell

| 메일 | 양효과 user_type | 역효과 user_type |
|---|---|---|
| **D1 aip_curiosity** | BUSINESS (net+32) | COMPANY (-32), STUDENT (-52), UNKNOWN (-44) |
| **D1 review_number** | BUSINESS (+17), INDIVIDUAL (+8) | STUDENT (-34), UNKNOWN (-18), COMPANY (혼재 -17) |
| **D2 image_bgremove** | BUSINESS (+20) | INDIVIDUAL (-29), EDUCATION (-16) |
| **D2 data_graph** | STUDENT (+39), UNKNOWN (+23), COMPANY (+11) | INDIVIDUAL (-38), EDUCATION (-31) |
| **D2 data_table** | UNKNOWN (+27) | COMPANY (-15), EDUCATION (-18) |
| **D2 font** | BUSINESS (+25), COMPANY (+20), STUDENT (+24) | COMPANY (-29 ← COMPANY 안에서도?? — 아래 §2 caveat) |
| **D1 4step_simplify** | INDIVIDUAL (+19) | UNKNOWN (-17) |

→ **user_type 분리 없이 캔버스 단위로만 보면 효과가 상쇄되어 잘못된 의사결정 위험.** L2 분석이 본 데이터의 핵심.

---

## 1. BUSINESS (사업체) — 거의 전부 양효과

> 메일에 가장 호응 잘하는 세그먼트. **모든 메일 적극 발송 가능.**

| 분류 | 캔버스/Step | net | 강+ | 강− | max metric |
|---|---|---:|---:|---:|---|
| 🟢 강한 양효과 | **D1 aip_curiosity** | +32 | 5 | 0 | Activ_AUC z=+4.43 (n_c=144) |
| 🟢 강한 양효과 | **EN1 en welcome 001** | +28 | 10 | 0 | D168h_ge3 z=+5.27 (n_c=152) |
| 🟢 강한 양효과 | **D2 font** | +25 | 7 | 0 | DRateTotal z=+2.94 (n_c=184) |
| 🟢 양효과 | **D2 image_bgremove** | +20 | 4 | 0 | DRateTotal z=+2.82 |
| 🟢 강한 양효과 | **D1 review_number** | +17 | 6 | 0 | cLPU168h z=+6.39 |
| 🔴 강한 역효과 | D2 data_graph | +4 | 0 | 5 | L72h_ge2 z=-2.46 (cons=0.75) |
| ⚪ 중립 | D2 data_table, D1 4step_simplify, D2 image_frame | ~0 | - | - | - |

**핵심 발견**
- 다른 세그먼트에서 강한 역효과인 **D1 aip_curiosity가 BUSINESS에선 net=+32**로 가장 강한 양효과. AI 호기심 어필이 사업체 유저에겐 잘 통함.
- **D1 review_number도 BUSINESS에선 강 양** (cLPU168h z=+6.39): "수만 명 사용" 같은 소셜 프루프가 사업체 유저에겐 의사결정 신호로 작용 추정.
- 유일 역효과인 **D2 data_graph**: BUSINESS에선 강신호 음만 5개(L72h_ge2 등 단기 로그인 깊이) — 단기엔 부정, 누적엔 양으로 분기. 모니터링 필요.

**권고**: D2 data_graph만 콘텐츠 점검, 나머지 5개 메일 전부 적극 발송.

---

## 2. COMPANY (회사) — JA_SERIES만 통하고 단독 캔버스는 다수 역효과

| 분류 | 캔버스/Step | net | 강+ | 강− | max metric |
|---|---|---:|---:|---:|---|
| 🟢 강한 양효과 | **JA_SERIES font** | +20 | 7 | 0 | LPU72h z=+7.03 |
| 🟢 강한 양효과 | **JA_SERIES aip_curiosity** | +20 | 6 | 0 | LPU72h z=+5.79 |
| 🟢 강한 양효과 | **JA_SERIES 4step_empathy** | +19 | 5 | 0 | LPU72h z=+4.77 |
| 🟢 양효과 | **D2 image_frame** | +15 | 4 | 0 | cLPU72h z=+2.25 |
| 🟢 강한 양효과 | **JA_SERIES table** | +12 | 5 | 0 | LDeep168h z=+32.12 (n_c=83 ⚠) |
| 🟢 양효과 | **D2 data_graph** | +11 | 3 | 0 | D_total_ge2 z=+3.46 |
| 🟢 강한 양효과 | **JA_SERIES bgremove** | +10 | 5 | 0 | LDeep168h z=+6.69 |
| 🟢 양효과 | **JA_SERIES graph** | +7 | 2 | 0 | LDeep168h z=+6.76 |
| ⚪ 중립 | D2 image_bgremove, D1 4step_simplify, D1 review_ampathy 등 | - | - | - | - |
| 🔴 역효과 | **D1 4step_empathy** | -8 | 0 | 2 | cDPU24h z=-2.06 |
| 🔴 강한 역효과 | **D2 data_table** | -15 | 0 | 7 | DPU168h z=-4.69 |
| 🟠 혼재 | **D1 review_number** | -17 | 7 | 14 | Stickiness_168h z=-5.59 |
| 🔴 강한 역효과 | **D2 font** | -29 | 0 | 8 | Stickiness_168h z=-3.13 |
| 🔴 강한 역효과 | **D1 aip_curiosity** | -32 | 0 | 10 | LPU24h z=-2.82 |

**핵심 발견**
- **JA_SERIES는 COMPANY 세그먼트에 매우 잘 통함** (6개 step 모두 강 양).
- **D2 font가 COMPANY에선 역효과(-29)인데 BUSINESS·STUDENT에선 강 양효과** — 회사 유저는 폰트 어필에 거부 반응. ⚠ 단 강신호 8개 모두 Stickiness 시리즈(잡음 큰 지표) 위주. 정성 점검 필요.
- **D1 review_number는 혼재**: 강 양 7개, 강 역 14개 — 메트릭 종류에 따라 정반대. 디자인계열은 ↑, 로그인 빈도/Stickiness는 ↓. "디자인은 더 만들지만 자주 들어오진 않는다" 패턴.
- **D1 aip_curiosity는 COMPANY에 명백한 역효과**: 강신호 음 10개 일관 100%.

**권고**:
- COMPANY 대상 발송: JA_SERIES 위주, D2 image_frame/data_graph 가능
- 발송 중단: D1 aip_curiosity, D2 data_table
- 콘텐츠 점검: D2 font(Stickiness 외 metric 재확인), D1 review_number(목적이 디자인 생성이면 유지 가능)

---

## 3. EDUCATION (교육) — 양효과 cell 0개, 거의 전부 역효과

> **메일 발송 전면 재검토 필요한 세그먼트.** 양효과 cell 단 0건.

| 분류 | 캔버스/Step | net | 강+ | 강− | max metric |
|---|---|---:|---:|---:|---|
| ⚪ 중립 | D2 image_frame | +6 | 0 | 0 | D168h_ge3 z=+1.91 |
| ⚪ 중립 | JA1 (4 step 모두) | 0 | 0 | 0 | - |
| ⚪ 중립 | D2 font | -1 | 0 | 0 | LRateReturn z=+2.24 |
| 🟠 혼재 | **EDU_SERIES edu01_class** | -2 | 3 | 4 | L_total_ge3 z=-4.72 |
| ⚪ 중립 | EDU_SERIES edu03_character | -4 | 0 | 2 | L_total_ge3 z=-4.54 |
| 🔴 역효과 | **EN1 en welcome 001** | -6 | 0 | 2 | LD72h z=-3.04 |
| 🔴 역효과 | **EDU_SERIES edu02_quiz** | -8 | 0 | 4 | L_total_ge3 z=-4.58 |
| 🔴 역효과 | **D2 image_bgremove** | -16 | 0 | 4 | D24h_ge2 z=-2.47 (cons=0.75) |
| 🔴 강한 역효과 | **D2 data_table** | -18 | 0 | 6 | LD24h z=-2.76 |
| 🔴 강한 역효과 | **D2 data_graph** | -31 | 0 | 9 | DRate24h z=-2.76 |

**핵심 발견**
- **EDU_SERIES(교육 전용 시리즈)가 교육 유저에게 역효과인 가장 큰 문제** — 시리즈 콘텐츠가 타겟과 안 맞음.
- D2 모든 기능 메일이 교육 유저에겐 역효과: data 시각화·이미지 처리 모두 거부 반응. 교육 유저는 다른 기능(템플릿, 슬라이드?)을 원할 가능성.
- 통제군 N=325~519로 충분히 큰 편, 통계적 신뢰 있음.

**권고**:
- **D2 data_graph / data_table 교육 유저 대상 즉시 중단**
- **EDU_SERIES 전면 콘텐츠 재설계 검토** (교육 유저에게 educational 시리즈가 안 통한다는 역설)
- 발송할 만한 안전한 메일: D2 image_frame (중립이지만 net+6), JA1 시리즈 (중립)
- 분석 권장: 교육 유저가 실제로 어떤 콘텐츠/CTA에 반응하는지 정성 인터뷰

---

## 4. INDIVIDUAL (개인) — D1은 양, D2 기능 메일은 강한 역

| 분류 | 캔버스/Step | net | 강+ | 강− | max metric |
|---|---|---:|---:|---:|---|
| 🟢 강한 양효과 | **D1 4step_simplify** | +19 | 5 | 0 | LRateTotal z=+6.96 |
| 🟢 양효과 | **D1 review_number** | +8 | 3 | 0 | D_total_ge3 z=+2.50 |
| ⚪ 중립 | D1 review_ampathy | +8 | 0 | 0 | LPU24h z=+2.33 (cons=0.75) |
| ⚪ 중립 | EN1 en welcome 001, D1 4step_empathy, D1 aip_curiosity, D1 aip_empathy | ~0 | - | - | - |
| ⚪ 중립 | JA1 (4 step 모두) | 0 | - | - | - |
| ⚪ 중립 | D2 image_frame, data_table, font | -2~-5 | - | - | - |
| 🔴 강한 역효과 | **D2 image_bgremove** | -29 | 0 | 15 | DRate168h z=-2.97 |
| 🔴 강한 역효과 | **D2 data_graph** | -38 | 0 | 12 | DRateTotal z=-4.45 |

**핵심 발견**
- **D1 4step_simplify는 INDIVIDUAL에 매우 강한 양효과** (LRateTotal z=+6.96, 강+ 5개).
- D1 카테고리는 개인 유저에게 양호: review_number·review_ampathy·aip_curiosity 모두 ↑ 방향(아주 강은 아님).
- **D2 기능 메일(image_bgremove, data_graph)은 INDIVIDUAL에 강한 역효과** — 개인 유저는 기능 어필에 부정적.
- 가설: 개인 유저는 "더 잘 만들도록 돕는" 메시지(simplify, review)엔 반응, "기능 자랑" 메시지엔 부담.

**권고**:
- 적극 발송: D1 4step_simplify, D1 review_number
- 중단: D2 image_bgremove, D2 data_graph (개인 유저 한정)
- 다른 D1 메일은 콘텐츠 다듬으면 양효과 전환 여지

---

## 5. STUDENT (학생) — D1 전멸·D2 양효과 (메일 종류 완전 분기)

> 가장 극단적 분기. **D1(전체 역효과), D2(전체 양효과).** 메일 종류 선택이 결정적.

| 분류 | 캔버스/Step | net | 강+ | 강− | max metric |
|---|---|---:|---:|---:|---|
| 🟢 강한 양효과 | **D2 data_graph** | +39 | 14 | 0 | LRate168h z=+7.81 |
| 🟢 강한 양효과 | **D2 font** | +24 | 6 | 0 | LD168h z=+3.38 |
| 🟠 혼재 | **D2 data_table** | +23 | 12 | 2 | L_total_ge2 z=+6.75 |
| 🟠 혼재 | **EN1 en welcome 001** | +16 | 13 | 5 | cDPU_total z=+6.90 |
| ⚪ 중립 | D2 image_frame, JA1 4종, D1 4step_simplify | ~0 | - | - | - |
| 🟠 혼재 | **D2 image_bgremove** | -5 | 2 | 5 | D168h_ge2 z=-2.53 (cons=0.75) |
| 🔴 강한 역효과 | **D1 review_ampathy** | -29 | 0 | 7 | D168h_ge3 z=-2.71 (cons=0.75) |
| 🔴 강한 역효과 | **D1 review_number** | -34 | 0 | 12 | L168h_ge3 z=-4.94 |
| 🔴 강한 역효과 | **D1 4step_empathy** | -35 | 0 | 10 | DRate72h z=-3.09 |
| 🔴 강한 역효과 | **D1 aip_empathy** | -40 | 0 | 17 | L72h_ge2 z=-8.63 |
| 🔴 강한 역효과 | **D1 aip_curiosity** | -52 | 0 | 16 | L72h_ge2 z=-8.81 |

**핵심 발견**
- **D1 5개 step 전부 강한 역효과** (net -29 ~ -52). 공감·AI 호기심·리뷰 어필이 학생에겐 부담.
- 반대로 **D2 데이터 시각화·폰트는 학생에게 강한 양효과**. 학생은 "기능을 더 잘 쓰는 방법"엔 반응.
- 가설: 학생은 실용적 도구로 인식, 정서·소셜 어필을 부담스러워함. 빠르게 끝나는 기능 팁만 환영.

**권고**:
- **D1 전체 학생 발송 즉시 중단** (5개 step 모두 강한 역효과, 가장 명백한 데이터)
- **D2 data_graph/font/data_table 학생 대상 적극 발송**
- EN1 콘텐츠는 cDPU_total z=+6.90 강한 양 + cLPU168h z=-3.34 음 → 디자인은 늘지만 로그인 빈도 ↓. 한 번에 깊게 쓰는 패턴 — KPI 정의에 따라 평가

---

## 6. UNKNOWN (미분류) — JA_SERIES 강한 양, D1 단독 강한 역

> n이 가장 큰 세그먼트 (n_c 2076~18834). 가입 후 user_type 미확정 = 신규/약활성 유저로 추정.

| 분류 | 캔버스/Step | net | 강+ | 강− | max metric |
|---|---|---:|---:|---:|---|
| 🟢 강한 양효과 | **JA_SERIES font** | +53 | 23 | 0 | LPU24h z=+5.83 |
| 🟢 강한 양효과 | **JA_SERIES aip_curiosity** | +51 | 21 | 0 | cLPU24h z=+5.63 |
| 🟢 강한 양효과 | **JA_SERIES 4step_empathy** | +49 | 19 | 0 | cLPU24h z=+5.13 |
| 🟢 강한 양효과 | **JA_SERIES bgremove** | +40 | 20 | 0 | D24h_ge2 z=+8.10 |
| 🟠 혼재 | **JA_SERIES table** | +38 | 22 | 3 | LPU24h z=+9.55 |
| 🟠 혼재 | **JA_SERIES graph** | +29 | 15 | 3 | LPU24h z=+12.86 |
| 🟢 강한 양효과 | **D2 data_table** | +27 | 5 | 0 | LDeep_total z=+3.08 |
| 🟢 강한 양효과 | **JA_SERIES templatemix** | +24 | 10 | 0 | LPU72h z=+9.09 |
| 🟢 양효과 | **D2 data_graph** | +23 | 4 | 0 | DRateTotal z=+3.57 |
| ⚪ 중립 | EN1 en welcome 001 | +8 | 4 | 0 | Stickiness_72h z=+3.16 |
| ⚪ 중립 | D1 4step_empathy, JA1 4종, JA_SERIES bookmark, D2 image_frame | ~0 | - | - | - |
| 🟠 혼재 | **D2 font** | -2 | 3 | 2 | D168h_ge3 z=+3.72 |
| ⚪ 중립 | D2 image_bgremove | -14 | 0 | 0 | LRateReturn z=-2.20 |
| ⚪ 중립 | D1 4step_simplify | -17 | 0 | 0 | (강+0 강-0지만 중-17) |
| 🔴 역효과 | **D1 review_number** | -18 | 0 | 3 | L168h_ge3 z=-2.86 |
| 🔴 강한 역효과 | **D1 aip_empathy** | -29 | 0 | 16 | Stickiness_72h z=-4.43 |
| 🔴 강한 역효과 | **D1 review_ampathy** | -38 | 0 | 7 | L_total_ge3 z=-5.06 |
| 🔴 강한 역효과 | **D1 aip_curiosity** | -44 | 0 | 18 | Stickiness_total z=-5.03 |

**핵심 발견**
- UNKNOWN은 모수가 압도적으로 커서 신뢰 가장 높음.
- **JA_SERIES 전 step이 UNKNOWN에 가장 잘 통함** — 가입 직후 약활성 신규 유저에게 시리즈가 자연스러운 onboarding 역할.
- **D1 단독 캠페인은 UNKNOWN엔 강한 역효과** — 같은 콘텐츠(aip_curiosity, review류)가 시리즈 안에선 양, 단독으론 역. 발송 컨텍스트가 결정적.
- D2 기능 메일은 UNKNOWN엔 양(data_table/data_graph)이지만 BUSINESS·EDUCATION·INDIVIDUAL과 다른 결과.

**권고**:
- UNKNOWN 신규 활성화: **JA_SERIES 메일 시리즈 적극 발송**
- D1 단독 발송은 UNKNOWN에 중단
- D2 data_table/data_graph 발송 유지

---

## 7. 캔버스별 user_type 매트릭스 (요약 viewer)

각 cell은 net score, 색상은 분류. 빈 cell은 분석 없음.

| 캔버스/Step | BUSINESS | COMPANY | EDUCATION | INDIVIDUAL | STUDENT | UNKNOWN |
|---|---|---|---|---|---|---|
| **D1 aip_curiosity** | 🟢+32 | 🔴-32 | - | ⚪+5 | 🔴-52 | 🔴-44 |
| **D1 aip_empathy** | - | ⚪0 | - | ⚪0 | 🔴-40 | 🔴-29 |
| **D1 review_ampathy** | - | ⚪+1 | - | ⚪+8 | 🔴-29 | 🔴-38 |
| **D1 review_number** | 🟢+17 | 🟠-17 | - | 🟢+8 | 🔴-34 | 🔴-18 |
| **D1 4step_empathy** | - | 🔴-8 | - | ⚪+5 | 🔴-35 | ⚪+2 |
| **D1 4step_simplify** | ⚪0 | ⚪+7 | - | 🟢+19 | ⚪-5 | ⚪-17 |
| **D2 data_graph** | 🔴+4 | 🟢+11 | 🔴-31 | 🔴-38 | 🟢+39 | 🟢+23 |
| **D2 data_table** | ⚪+1 | 🔴-15 | 🔴-18 | ⚪-3 | 🟠+23 | 🟢+27 |
| **D2 font** | 🟢+25 | 🔴-29 | ⚪-1 | ⚪-5 | 🟢+24 | 🟠-2 |
| **D2 image_bgremove** | 🟢+20 | ⚪+11 | 🔴-16 | 🔴-29 | 🟠-5 | ⚪-14 |
| **D2 image_frame** | ⚪0 | 🟢+15 | ⚪+6 | ⚪-2 | ⚪+5 | ⚪-1 |
| **EN1 en welcome 001** | 🟢+28 | ⚪0 | 🔴-6 | ⚪+5 | 🟠+16 | ⚪+8 |
| **JA1 (4 step)** | - | ⚪0 | ⚪0 | ⚪0 | ⚪0 | ⚪0 |
| **JA_SERIES 4step_empathy** | - | 🟢+19 | - | - | - | 🟢+49 |
| **JA_SERIES aip_curiosity** | - | 🟢+20 | - | - | - | 🟢+51 |
| **JA_SERIES bgremove** | - | 🟢+10 | - | - | - | 🟢+40 |
| **JA_SERIES font** | - | 🟢+20 | - | - | - | 🟢+53 |
| **JA_SERIES graph** | - | 🟢+7 | - | - | - | 🟠+29 |
| **JA_SERIES table** | - | 🟢+12 | - | - | - | 🟠+38 |
| **JA_SERIES templatemix** | - | - | - | - | - | 🟢+24 |
| **JA_SERIES bookmark** | - | - | - | - | - | ⚪0 |
| **EDU_SERIES edu01_class** | - | - | 🟠-2 | - | - | - |
| **EDU_SERIES edu02_quiz** | - | - | 🔴-8 | - | - | - |
| **EDU_SERIES edu03_character** | - | - | ⚪-4 | - | - | - |

> JA1 모든 셀이 ⚪0인 이유: D168h_ge3 metric 등 일부 zero 값으로 z 무한대 처리되어 신호 0으로 계산. JA1은 별도 분석 필요.

---

## 8. 종합 운영 권고 (Top Action)

### 즉시 중단 권고 (🔴 강한 역효과)
| 메일 | 대상 user_type | 근거 |
|---|---|---|
| D1 aip_curiosity | STUDENT, UNKNOWN, COMPANY | 3개 세그먼트 합산 net -128 |
| D1 aip_empathy | STUDENT, UNKNOWN | 강신호 음 16+17개 |
| D1 review_ampathy | STUDENT, UNKNOWN | net -29, -38 |
| D1 review_number | STUDENT, UNKNOWN, COMPANY | net -34, -18, 혼재 |
| D1 4step_empathy | STUDENT | net -35, 강신호 음 10개 |
| D2 image_bgremove | INDIVIDUAL, EDUCATION | net -29, -16 |
| D2 data_graph | INDIVIDUAL, EDUCATION | net -38, -31 |
| D2 data_table | COMPANY, EDUCATION | net -15, -18 |
| D2 font | COMPANY | net -29 (단 Stickiness 위주 신호) |
| EDU_SERIES edu02_quiz | EDUCATION | net -8, 강신호 음 4개 |

### 적극 발송 (🟢 강한 양효과)
| 메일 | 대상 user_type | 근거 |
|---|---|---|
| JA_SERIES 전 step | UNKNOWN, COMPANY | UNKNOWN net +40~+53, COMPANY +10~+20 |
| D1 aip_curiosity | BUSINESS | net +32 (역설적!) |
| D1 review_number | BUSINESS, INDIVIDUAL | net +17, +8 |
| D1 4step_simplify | INDIVIDUAL | net +19 |
| D2 data_graph | STUDENT, UNKNOWN, COMPANY | net +39, +23, +11 |
| D2 data_table | UNKNOWN, STUDENT | net +27, +23 |
| D2 font | BUSINESS, STUDENT | net +25, +24 |
| D2 image_bgremove | BUSINESS | net +20 |
| D2 image_frame | COMPANY | net +15 |
| EN1 en welcome 001 | BUSINESS | net +28 |

### 콘텐츠 재설계 권고
| 메일/세그먼트 | 사유 |
|---|---|
| EDU_SERIES 전체 | 교육 유저에게 교육 시리즈가 안 통한다는 역설 |
| D1 review_number / COMPANY | 디자인 ↑·로그인 빈도 ↓ 혼재 — 목표 KPI 선택 |
| EN1 / STUDENT | 디자인 깊이 ↑·로그인 빈도 ↓ — 재방문 hook 필요 |

---

## 9. Caveats / 데이터 한계

1. **JA1 신호 0 문제**: JA1 4 step은 일부 metric의 zero division으로 신호 계산 0. 별도 검증 필요.
2. **n_c 작은 cell**:
   - JA_SERIES COMPANY n_c=83 (LDeep168h z=32.12 등 극단 값 등장)
   - EDU_SERIES n_c=139
   - → 방향은 신뢰, 강도는 회의적
3. **Stickiness·Return계열 잡음**: D2 font COMPANY 음 신호 8개 중 다수 Stickiness 시리즈 — 메트릭 가이드라인상 "비율의 비율, 매우 약함"으로 분류된 metric. 정성 점검 필요.
4. **개별 메일 vs 시리즈 효과 분리**: JA_SERIES 안에선 동일 유저가 여러 step 노출 — step별 분리 효과 측정 불가.
5. **L3(ad_campaign 그루핑) 미수행**: 같은 user_type 내에서도 유입 광고에 따라 효과 차이 가능.
6. **관측 윈도우 4~6주**: LRateReturn/LPU_total 등 누적 metric은 후기 코호트가 자연히 낮게 측정. 절대값 비교 시 주의.
