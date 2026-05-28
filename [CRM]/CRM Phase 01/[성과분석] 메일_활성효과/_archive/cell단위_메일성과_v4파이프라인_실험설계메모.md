# L2 cell별 메일 성과 — 세그먼트별 실험설계용

본 문서는 **(canvas × user_type) 단위 cell마다 그 안의 메일(step/treatment)들을 줄세워 비교**한다.
세그먼트별 후속 실험 구조 설계용. 캔버스 단위 평균이나 user_type 단위 평균이 아니라, **"이 캔버스를 이 user_type에 보낼 때 어느 메일이 가장 효과 있나"**가 답이 되는 cell 단위.

**근거 데이터**: `L2_v4_results.csv` (50 metric 통합 평가), 제외: open_rate/click_rate.
**필터**: ctrl_n≥80.
**컬럼 의미**:
- **net**: 2×강+ + 1×중+ − 1×중− − 2×강−  (메트릭 50개 누적 신호)
- **강+ / 강−**: |z|≥2.0 + 일관성≥70% 강신호 metric 수
- **중+ / 중−**: 1.0≤|z|<2.0 + 일관성≥70% 중간신호 metric 수
- **최강 metric**: 절대값 z 가장 큰 metric (대표 신호)

**참고 산출물**: `L2_cell_분류_요약.csv` (전수 raw)

---

## 0. 데이터 사용 가능한 (canvas × user_type) cell 목록

| 캔버스 | BUSINESS | COMPANY | EDUCATION | INDIVIDUAL | STUDENT | UNKNOWN |
|---|---|---|---|---|---|---|
| **JA1** | - | 4 step | 4 step | 4 step | 4 step | 4 step |
| **EN1** | 1 step | 1 step | 1 step | 1 step | 1 step | 1 step |
| **D1** | 3 step | 6 step | - | 6 step | 6 step | 6 step |
| **D2** | 5 step | 5 step | 5 step | 5 step | 5 step | 5 step |
| **JA_SERIES** | - | 6 step | - | - | - | 8 step |
| **EDU_SERIES** | - | - | 3 step | - | - | - |

- **EN1·EDU_SERIES**: 1~3 step만 존재 → step 간 비교 의미 약함. 절대 평가만.
- **JA1**: 모든 cell 신호 0 (D168h_ge3 zero division 의심) → 별도 검증 필요. 본 문서에선 분석 제외.
- **JA_SERIES**: BUSINESS·EDUCATION·INDIVIDUAL·STUDENT cell 없음 (n 부족). COMPANY/UNKNOWN만.
- **EDU_SERIES**: EDUCATION cell만 존재.

---

## 1. D1 (일본 1차 — 단독 캔버스)

### 1.1 D1 × BUSINESS (n_c=144)
3개 step만 측정 (4step_empathy, review_ampathy, aip_empathy 누락)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric | trt_n |
|---|---|---|---:|---:|---:|---|---:|
| 🥇 1 | **aip_curiosity** | 🟢 강한 양효과 | +32 | 5 | 0 | Activ_AUC z=+4.43 | 111 |
| 🥈 2 | **review_number** | 🟢 강한 양효과 | +17 | 6 | 0 | cLPU168h z=+6.39 | 104 |
| 3 | 4step_simplify | ⚪ 중립 | 0 | 0 | 0 | D_total_ge2 z=+2.00 (cons 0.67) | 86 |

**실험 설계 권고**:
- **winner**: aip_curiosity (Activ_AUC 차원 압도)
- 후속 실험: aip_curiosity vs review_number A/B (둘 다 강한 양효과지만 측정 차원 다름 — Activ_AUC 강세 vs LPU 강세). KPI 정의에 따라 결정.
- 4step_simplify는 control로 활용 가능 (BUSINESS엔 효과 거의 없음).
- ⚠ n_c=144로 작음. 실험 시 power 확보 위해 표본 키울 필요.

---

### 1.2 D1 × COMPANY (n_c=475)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | 4step_simplify | ⚪ 중립 | +7 | 0 | 0 | LRateTotal z=+2.33 (cons 0.75) |
| 2 | review_ampathy | ⚪ 중립 | +1 | 0 | 0 | L168h_ge3 z=+2.12 (cons 0.75) |
| 3 | aip_empathy | ⚪ 중립 | 0 | 0 | 0 | Stickiness_72h z=-1.68 |
| 🚫 4 | **4step_empathy** | 🔴 역효과 | -8 | 0 | 2 | cDPU24h z=-2.06 |
| 🚫 5 | **review_number** | 🟠 혼재 | -17 | 7 | 14 | Stickiness_168h z=-5.59 (강+7·강−14 ← 메트릭별 정반대) |
| 🚫 6 | **aip_curiosity** | 🔴 강한 역효과 | -32 | 0 | 10 | LPU24h z=-2.82 |

**실험 설계 권고**:
- **clear winner 없음**. 4step_simplify가 그나마 best지만 약신호.
- 즉시 제외 후보: aip_curiosity (강신호 음 10개), 4step_empathy
- review_number는 디자인 생성↑ + 로그인 빈도↓ 혼재 — KPI에 따라 채택 분기. 디자인 결과물이 KPI면 채택, 로그인 활성이 KPI면 제외.
- 후속 실험: 4step_simplify를 baseline으로, **콘텐츠 다른 새 메일 1~2종**을 추가해서 A/B/C. 기존 D1은 COMPANY에 대체로 안 맞음.

---

### 1.3 D1 × INDIVIDUAL (n_c=342)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | **4step_simplify** | 🟢 강한 양효과 | +19 | 5 | 0 | LRateTotal z=+6.96 |
| 🥈 2 | **review_number** | 🟢 양효과 | +8 | 3 | 0 | D_total_ge3 z=+2.50 |
| 3 | review_ampathy | ⚪ 중립 | +8 | 0 | 0 | LPU24h z=+2.33 |
| 4 | 4step_empathy | ⚪ 중립 | +5 | 0 | 0 | LRateTotal z=+2.14 |
| 5 | aip_curiosity | ⚪ 중립 | +5 | 0 | 0 | DRate168h z=+1.43 |
| 6 | aip_empathy | ⚪ 중립 | 0 | 0 | 0 | D24h_ge2 z=+1.73 |

**실험 설계 권고**:
- **winner**: 4step_simplify (LRateTotal z=+6.96, 6 step 중 가장 강).
- 모든 step이 0 이상 — INDIVIDUAL은 어떤 D1 메일도 해 끼치지 않음.
- 후속 실험: 4step_simplify를 chosen treatment로, review_number를 alternative arm. 나머지 4개는 약신호라 단독 발송 가치 약.
- review_ampathy는 강신호 0인데 net +8 (중간 신호 8개) — 표본 늘리면 강신호 전환 가능성.

---

### 1.4 D1 × STUDENT (n_c=316) — **전 step 강한 역효과**

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 1 (덜 나쁨) | 4step_simplify | ⚪ 중립 | -5 | 0 | 0 | D168h_ge3 z=-2.78 |
| 🚫 2 | review_ampathy | 🔴 강한 역효과 | -29 | 0 | 7 | D168h_ge3 z=-2.71 |
| 🚫 3 | review_number | 🔴 강한 역효과 | -34 | 0 | 12 | L168h_ge3 z=-4.94 |
| 🚫 4 | 4step_empathy | 🔴 강한 역효과 | -35 | 0 | 10 | DRate72h z=-3.09 |
| 🚫 5 | aip_empathy | 🔴 강한 역효과 | -40 | 0 | 17 | L72h_ge2 z=-8.63 |
| 🚫 6 | aip_curiosity | 🔴 강한 역효과 | -52 | 0 | 16 | L72h_ge2 z=-8.81 |

**실험 설계 권고**:
- **D1 → STUDENT 발송 전면 중단**. 6 step 중 5 step이 강한 역효과, 나머지 1개도 음방향.
- 후속 실험: D1 카테고리 콘텐츠를 STUDENT용으로 **완전 재설계**. 정서·AI 어필 대신 D2 스타일 기능 어필이 통한다는 증거 있음(§D2 STUDENT 참고).
- 4step_simplify는 비교적 덜 해롭지만 양효과 아님 — control로 쓸 가치 약.

---

### 1.5 D1 × UNKNOWN (n_c=2076) — 대부분 역효과

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 1 (덜 나쁨) | 4step_empathy | ⚪ 중립 | +2 | 0 | 0 | LRateReturn z=-2.04 |
| 2 | 4step_simplify | ⚪ 중립 | -17 | 0 | 0 | D24h_ge2 z=+2.00 (cons 0.75) |
| 🚫 3 | review_number | 🔴 역효과 | -18 | 0 | 3 | L168h_ge3 z=-2.86 |
| 🚫 4 | aip_empathy | 🔴 강한 역효과 | -29 | 0 | 16 | Stickiness_72h z=-4.43 |
| 🚫 5 | review_ampathy | 🔴 강한 역효과 | -38 | 0 | 7 | L_total_ge3 z=-5.06 |
| 🚫 6 | aip_curiosity | 🔴 강한 역효과 | -44 | 0 | 18 | Stickiness_total z=-5.03 |

**실험 설계 권고**:
- **D1 → UNKNOWN 발송도 거의 전면 중단** 권고.
- 4step_empathy만 중립 — 실험할 가치 있는 유일 후보.
- 후속 실험: 4step_empathy를 baseline 삼고, UNKNOWN용 신규 콘텐츠 1~2개 추가해 A/B.
- n_c=2076로 모수 크니 약신호도 신뢰 ↑.

---

## 2. D2 (일본 2차 — 기능 소개)

### 2.1 D2 × BUSINESS (n_c=184)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | **font** | 🟢 강한 양효과 | +25 | 7 | 0 | DRateTotal z=+2.94 |
| 🥈 2 | **image_bgremove** | 🟢 양효과 | +20 | 4 | 0 | DRateTotal z=+2.82 |
| 3 | data_graph | 🔴 강한 역효과 | +4 | 0 | 5 | L72h_ge2 z=-2.46 (cons 0.75) |
| 4 | data_table | ⚪ 중립 | +1 | 0 | 0 | LPU168h z=+1.84 |
| 5 | image_frame | ⚪ 중립 | 0 | 0 | 0 | LRateReturn z=+1.75 |

**실험 설계 권고**:
- **winner**: font (D2 BUSINESS에서 가장 강).
- 후속 실험: font vs image_bgremove A/B (둘 다 양효과지만 신호 강도 차).
- data_graph는 net +4이지만 강신호 음 5개 — 단기 metric만 음방향 (장기엔 +). 정성 점검 후 결정.
- image_frame은 baseline control 후보.

---

### 2.2 D2 × COMPANY (n_c=581)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | **image_frame** | 🟢 양효과 | +15 | 4 | 0 | cLPU72h z=+2.25 |
| 🥈 2 | image_bgremove | ⚪ 중립 | +11 | 0 | 0 | Stickiness_168h z=+2.54 |
| 🥈 2 | **data_graph** | 🟢 양효과 | +11 | 3 | 0 | D_total_ge2 z=+3.46 |
| 🚫 4 | data_table | 🔴 강한 역효과 | -15 | 0 | 7 | DPU168h z=-4.69 |
| 🚫 5 | font | 🔴 강한 역효과 | -29 | 0 | 8 | Stickiness_168h z=-3.13 |

**실험 설계 권고**:
- **winner**: image_frame, data_graph (양효과). 두 메일 A/B 가능.
- 즉시 제외: font, data_table.
- 흥미: **D2 font가 BUSINESS엔 강 양, COMPANY엔 강 역**. user_type 분리 발송 필수.
- image_bgremove는 net +11이지만 강신호 0개 — 신뢰 약. 추가 데이터 누적 후 재평가.

---

### 2.3 D2 × EDUCATION (n_c=325) — 양효과 0개

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 1 (덜 나쁨) | image_frame | ⚪ 중립 | +6 | 0 | 0 | D168h_ge3 z=+1.91 |
| 2 | font | ⚪ 중립 | -1 | 0 | 0 | LRateReturn z=+2.24 |
| 🚫 3 | image_bgremove | 🔴 역효과 | -16 | 0 | 4 | D24h_ge2 z=-2.47 (cons 0.75) |
| 🚫 4 | data_table | 🔴 강한 역효과 | -18 | 0 | 6 | LD24h z=-2.76 |
| 🚫 5 | data_graph | 🔴 강한 역효과 | -31 | 0 | 9 | DRate24h z=-2.76 (cons 0.75) |

**실험 설계 권고**:
- **5개 중 양효과 cell 없음**. image_frame이 그나마 중립.
- 후속 실험: D2 카테고리 → EDUCATION 발송 전면 재검토. 콘텐츠 재설계 후 새로 A/B 필요.
- image_frame을 control로 두고 신규 콘텐츠 도입 가능.

---

### 2.4 D2 × INDIVIDUAL (n_c=459)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 1 (덜 나쁨) | image_frame | ⚪ 중립 | -2 | 0 | 0 | LRateReturn z=-1.53 |
| 2 | data_table | ⚪ 중립 | -3 | 0 | 0 | DRateReturn z=+1.98 |
| 3 | font | ⚪ 중립 | -5 | 0 | 0 | LD_total z=-1.74 |
| 🚫 4 | image_bgremove | 🔴 강한 역효과 | -29 | 0 | 15 | DRate168h z=-2.97 |
| 🚫 5 | data_graph | 🔴 강한 역효과 | -38 | 0 | 12 | DRateTotal z=-4.45 |

**실험 설계 권고**:
- **양효과 cell 0개**. 3개 중립 + 2개 강 역.
- 즉시 제외: image_bgremove, data_graph.
- 중립 3개는 약신호 — INDIVIDUAL은 D2 기능 메일에 거의 무반응. **D2 → INDIVIDUAL 발송 우선순위 낮춤**.
- INDIVIDUAL에겐 D1 4step_simplify(net +19)가 검증된 winner (§1.3).

---

### 2.5 D2 × STUDENT (n_c=423) — **D2의 핵심 타겟**

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | **data_graph** | 🟢 강한 양효과 | +39 | 14 | 0 | LRate168h z=+7.81 |
| 🥈 2 | **font** | 🟢 강한 양효과 | +24 | 6 | 0 | LD168h z=+3.38 |
| 🥉 3 | **data_table** | 🟠 혼재 | +23 | 12 | 2 | L_total_ge2 z=+6.75 |
| 4 | image_frame | ⚪ 중립 | +5 | 0 | 0 | L168h_ge3 z=-1.99 |
| 5 | image_bgremove | 🟠 혼재 | -5 | 2 | 5 | D168h_ge2 z=-2.53 (cons 0.75) |

**실험 설계 권고**:
- **winner**: data_graph 압도적 (강+ 14개, 50 metric의 28%).
- 후속 실험: **data_graph vs font vs data_table 3-arm A/B/C**. 세 메일 다 강 양효과지만 영향 차원 다름:
  - data_graph: LRate168h 등 로그인 도달 → 단기 활성화
  - font: LD168h 등 로그인×디자인 조합 → 종합 활성
  - data_table: L_total_ge2 등 누적 깊이 → 장기 retention
- KPI에 따라 winner 결정.
- image_bgremove 제외, image_frame은 control 또는 추가 후보.

---

### 2.6 D2 × UNKNOWN (n_c=2382)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | **data_table** | 🟢 강한 양효과 | +27 | 5 | 0 | LDeep_total z=+3.08 |
| 🥈 2 | **data_graph** | 🟢 양효과 | +23 | 4 | 0 | DRateTotal z=+3.57 |
| 3 | image_frame | ⚪ 중립 | -1 | 0 | 0 | LPU24h z=-2.19 |
| 4 | font | 🟠 혼재 | -2 | 3 | 2 | D168h_ge3 z=+3.72 |
| 🚫 5 | image_bgremove | ⚪ 중립 | -14 | 0 | 0 | LRateReturn z=-2.20 |

**실험 설계 권고**:
- **winner**: data_table, data_graph 모두 양효과.
- 후속 실험: data_table vs data_graph A/B (둘 다 강신호).
- font는 강+ 3개·강− 2개 혼재 — 다지표 일관성 검증 필요. 메트릭별 분기 패턴 추가 분석 권장.
- image_bgremove는 강신호 0개이지만 중− 14개로 일관 음방향. 약하지만 발송 가치 낮음.

---

## 3. JA_SERIES (일본 시리즈) — 시리즈 누적 효과

JA_SERIES는 같은 user가 여러 step 노출 → step 간 효과 분리 어려움. 그러나 step별 effect size 차로 우선순위는 가늠 가능.

### 3.1 JA_SERIES × COMPANY (n_c=111 ⚠ 작음)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | **font** | 🟢 강한 양효과 | +20 | 7 | 0 | LPU72h z=+7.03 |
| 🥇 1 | **aip_curiosity** | 🟢 강한 양효과 | +20 | 6 | 0 | LPU72h z=+5.79 |
| 🥉 3 | **4step_empathy** | 🟢 강한 양효과 | +19 | 5 | 0 | LPU72h z=+4.77 |
| 4 | table | 🟢 강한 양효과 | +12 | 5 | 0 | LDeep168h z=+32.12 ⚠ |
| 5 | bgremove | 🟢 강한 양효과 | +10 | 5 | 0 | LDeep168h z=+6.69 |
| 6 | graph | 🟢 양효과 | +7 | 2 | 0 | LDeep168h z=+6.76 |

**실험 설계 권고**:
- **6 step 모두 양효과**. 우열은 net으로 가늠 가능 (font·aip_curiosity·4step_empathy 동률 top).
- ⚠ n_c=111로 작음 + LDeep168h z=+32.12 같은 극단치 등장 (n 작은 cell의 분산 폭증).
- 후속 실험: step별 hold-out 그룹 만들어 어느 step이 가장 기여하는지 분리. 시리즈 전체 누적 효과 vs 개별 step contribution 분해.
- 표본 키우면 (3개월+ 누적) 더 정밀 비교 가능.

---

### 3.2 JA_SERIES × UNKNOWN (n_c=493)

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 🥇 1 | **font** | 🟢 강한 양효과 | +53 | 23 | 0 | LPU24h z=+5.83 |
| 🥈 2 | **aip_curiosity** | 🟢 강한 양효과 | +51 | 21 | 0 | cLPU24h z=+5.63 |
| 🥉 3 | **4step_empathy** | 🟢 강한 양효과 | +49 | 19 | 0 | cLPU24h z=+5.13 |
| 4 | bgremove | 🟢 강한 양효과 | +40 | 20 | 0 | D24h_ge2 z=+8.10 |
| 5 | table | 🟠 혼재 | +38 | 22 | 3 | LPU24h z=+9.55 |
| 6 | graph | 🟠 혼재 | +29 | 15 | 3 | LPU24h z=+12.86 |
| 7 | templatemix | 🟢 강한 양효과 | +24 | 10 | 0 | LPU72h z=+9.09 |
| 8 | bookmark | ⚪ 중립 | 0 | 0 | 0 | D168h_ge3 z=0 |

**실험 설계 권고**:
- 8 step 중 7 step이 강 양효과. **bookmark만 중립** — 콘텐츠 점검 또는 제외 후보.
- table·graph는 강신호 음 3개씩 — 디자인 카테고리 일부 metric에서 음방향. 다지표 일관성 검증.
- 후속 실험: 시리즈 step 순서·발송 간격 최적화 실험 (step 단독 분리는 어렵지만 노출 순서·tempo는 통제 가능).
- bookmark 제거 후 시리즈 비교: 7-step vs 8-step.

---

## 4. EN1 (영어 1차) — 단일 step

EN1은 step 1개(en welcome 001)뿐이라 step 간 비교 불가. user_type 간 절대 평가만.

| user_type | 분류 | net | 강+ | 강− | 최강 metric | n_c |
|---|---|---:|---:|---:|---|---:|
| 🥇 BUSINESS | 🟢 강한 양효과 | +28 | 10 | 0 | D168h_ge3 z=+5.27 | 152 |
| 🥈 STUDENT | 🟠 혼재 | +16 | 13 | 5 | cDPU_total z=+6.90 | 2071 |
| UNKNOWN | ⚪ 중립 | +8 | 4 | 0 | Stickiness_72h z=+3.16 | 18834 |
| INDIVIDUAL | ⚪ 중립 | +5 | 0 | 0 | Stickiness_total z=+2.32 | 631 |
| COMPANY | ⚪ 중립 | 0 | 0 | 0 | LPU_total z=-1.14 | 254 |
| 🚫 EDUCATION | 🔴 역효과 | -6 | 0 | 2 | LD72h z=-3.04 | 367 |

**실험 설계 권고**:
- BUSINESS·STUDENT 타겟 발송 ✓.
- EDUCATION 발송 중단.
- STUDENT 혼재 (강+13·강−5): 디자인 행동 ↑·로그인 빈도 ↓ — KPI 정의 따라.
- EN1은 step 1개라 콘텐츠 variant 추가 (welcome v2, v3 등) 후속 실험 권장.

---

## 5. EDU_SERIES (에듀 시리즈) — EDUCATION 전용

| 순위 | 메일 | 분류 | net | 강+ | 강− | 최강 metric |
|---|---|---|---:|---:|---:|---|
| 1 (덜 나쁨) | edu01_class | 🟠 혼재 | -2 | 3 | 4 | L_total_ge3 z=-4.72 |
| 2 | edu03_character | ⚪ 중립 | -4 | 0 | 2 | L_total_ge3 z=-4.54 |
| 🚫 3 | edu02_quiz | 🔴 역효과 | -8 | 0 | 4 | L_total_ge3 z=-4.58 |

**실험 설계 권고**:
- **3 step 모두 음방향**. 양효과 0개.
- edu01_class는 강+ 3개도 있지만 강− 4개로 상쇄 — 일부 metric엔 효과, 일부엔 역효과.
- 후속 실험: 시리즈 콘텐츠 전면 재설계 후 새로 측정. 현 시리즈로 추가 발송은 비추.
- n_c=139로 작아 신뢰 한계 — 데이터 누적 후 재평가 옵션도 있음.

---

## 6. JA1 (일본 1차 wrapper) — 분석 보류

JA1 ja onboarding 4종(4step, aip, free, review) 모든 (canvas, user_type) cell에서 신호 0. D168h_ge3 등 metric이 zero division으로 z 계산 무효 처리됐을 가능성. **별도 데이터 점검 필요** — 본 문서 비교에서 제외.

---

## 7. 실험 설계 우선순위 (Top 후속 실험 후보)

> "다음 분기에 어디에 실험 리소스 투입할까"에 답하는 우선순위.

| 우선순위 | 실험 cell | arm 후보 | 가설 | 기대 효과 |
|---|---|---|---|---|
| ⭐⭐⭐ 1 | **D2 × STUDENT** | data_graph vs font vs data_table | 3 step 모두 강 양, 차원 분리 가능 | KPI별 winner 도출 |
| ⭐⭐⭐ 2 | **D1 × INDIVIDUAL** | 4step_simplify vs review_number | 2 step 모두 양, 강도 차 | 다음 발송 콘텐츠 결정 |
| ⭐⭐⭐ 3 | **D1 × BUSINESS** | aip_curiosity vs review_number | Activ_AUC vs LPU 차원 | KPI별 winner 도출 |
| ⭐⭐ 4 | **D2 × BUSINESS** | font vs image_bgremove | 둘 다 양효과, 강도 차 | 다음 발송 우선순위 |
| ⭐⭐ 5 | **D2 × COMPANY** | image_frame vs data_graph | 양효과 2개 | 다음 발송 우선순위 |
| ⭐⭐ 6 | **D2 × UNKNOWN** | data_table vs data_graph | 양효과 2개, n 큼 | 모수 큰 세그먼트 검증 |
| ⭐⭐ 7 | **JA_SERIES × UNKNOWN** | step 노출 순서·tempo 실험 | 7 step 모두 양, 시리즈 최적화 | 시리즈 운영 ROI ↑ |
| ⭐ 8 | **D2 × EDUCATION 콘텐츠 재설계** | 신규 콘텐츠 vs image_frame baseline | 현 5 step 양효과 0개 | 교육 세그먼트 콘텐츠 발굴 |
| ⭐ 9 | **D1 × COMPANY 콘텐츠 재설계** | 신규 vs 4step_simplify baseline | 현 6 step 양효과 0개 | 회사 세그먼트 콘텐츠 발굴 |
| ⭐ 10 | **EDU_SERIES 전면 재설계** | 신규 콘텐츠 vs current edu01_class | 3 step 모두 음 | 교육 시리즈 가치 회복 |

### 발송 중단 권고 (실험 대상에서 제외)
- D1 × STUDENT 전체 (6 step 모두 강 역)
- D1 × UNKNOWN: aip_curiosity, review_ampathy, aip_empathy
- D2 × INDIVIDUAL: image_bgremove, data_graph
- D2 × EDUCATION: data_graph, data_table

---

## 8. Caveats

1. **n_c 작은 cell**: JA_SERIES COMPANY n_c=111, EDU_SERIES n_c=139, D1 BUSINESS n_c=144. 방향만 신뢰, 강도는 회의적.
2. **JA1 신호 0 문제**: 별도 데이터 정합성 점검 필요. 현 분석에서 비교 제외.
3. **시리즈 캔버스 step 분리 한계**: JA_SERIES·EDU_SERIES는 다중 노출 → step별 contribution 분리 불가. 시리즈 운영 최적화 실험은 step 순서·tempo로 우회.
4. **Stickiness·Return계열 잡음**: 일부 음효과 신호가 Stickiness 시리즈 위주 — 메트릭 가이드라인상 "매우 약함" 분류. 정성 점검 권장.
5. **메트릭 차원 분기**: 같은 cell 안에서도 metric별 정반대 신호인 경우 다수 (예: D1 × COMPANY × review_number 강+ 7개·강− 14개). 단일 KPI 선정 후에야 명확한 winner 가능.
6. **L3(ad_campaign) 미수행**: 같은 (canvas, user_type) cell 안에서도 유입 광고별 효과 차이 가능 — 추가 분석 필요.
