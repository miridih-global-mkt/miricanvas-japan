# 개별 메일별 양효과·역효과 분석

본 문서는 6개 캔버스(JA1·EN1·D1·D2·JA_SERIES·EDU_SERIES) 18개 step별로 메일 효과의 방향(양/역)과 강도, 영향 받는 유저 세그먼트, 콘텐츠 가설, 운영 권고를 정리한다.

**근거 데이터**: `분석산출물/L1_final_results.csv`, `L2_final_results.csv`. 강신호 필터: L1 |z|≥2 + 일관성≥70%, L2 |z|≥2.5 + 일관성≥70% + 통제군 N≥80.
**전체 추출 결과**: `강신호_cell_전수.csv` (120행 = L1 56 + L2 64)

---

## Executive Summary

### 강한 양효과 (즉시 채택·확대)
| 캔버스/Step | 핵심 신호 | 비고 |
|---|---|---|
| **JA_SERIES 전 step** | bgremove·font·table·aip_curiosity·4step_empathy 모두 LPU 시리즈 z>3, 일관성 100% | 시리즈 통째 양효과. step별 분리 효과는 약 (콘텐츠 차별 어려움) |
| **D2 / font** | BUSINESS cDPU168h z=+4.74 (L2), L1 LPU 시리즈 z>3 | 디자인 행동까지 끌어올린 유일한 D2 step |
| **EN1 / en welcome 001 / STUDENT** | cDPU_total z=+5.61 | 학생 코호트가 영어 온보딩에 디자인으로 응답 |
| **D2 / data_graph / BUSINESS** | LRateTotal z=+8.69 | 단, INDIVIDUAL 세그먼트에선 정반대 → 세그먼트 분리 필요 |

### 강한 역효과 (즉시 배제·정성 점검)
| 캔버스/Step | 핵심 신호 | 가설 |
|---|---|---|
| **D2 / image_bgremove** | INDIVIDUAL LRateTotal z=-7.70, 10개 metric 모두 음 | **콘텐츠 자체 문제**. 같은 bgremove 콘텐츠가 JA_SERIES 맥락에선 +, D2 단독 캔버스에선 - (아래 §3 분석) |
| **D1 / review_number / STUDENT** | L168h_ge3 z=-9.55, L168h_ge2 z=-3.45 | 학생에게 "타인 리뷰 수" 보여주는 어필이 역효과 |
| **D1 / aip_curiosity** | COMPANY Activ_AUC z=-4.11, UNKNOWN cDPU168h z=-3.66 (디자인 행동 ↓) | D1 단독 발송 시 호기심 자극 어필이 디자인 행동까지 위축 |
| **EDU_SERIES / edu01_class·edu02_quiz** | cLPU_total z=-4.11/-2.90 (L1, n_c=103) | 에듀 시리즈 초반 step 모두 역효과. ⚠ 단 통제군 규모 작음 (n_c=103) → 재검증 필요 |
| **D2 / data_table** | COMPANY cDPU168h z=-4.00 | 회사 유저에게 표 데이터 어필이 디자인 행동 위축 |

### Mixed (세그먼트 분기)
| 캔버스/Step | 분기 양상 |
|---|---|
| **D2 / data_graph** | BUSINESS +, INDIVIDUAL - (LRateTotal/cLPU계열 모두 반대) |
| **EN1 / en welcome 001** | STUDENT cDPU_total +5.61이지만 STUDENT cLPU168h -3.34 (디자인↑ + 로그인 횟수↓ — 활성 강도 변화) |
| **D1 / 4step_simplify** | INDIVIDUAL +, UNKNOWN - |

---

## 1. JA_SERIES (일본 시리즈) — 시리즈 누적 양효과

### 1.1 종합 효과
JA_SERIES 5 step(4step_empathy, aip_curiosity, bgremove, font, table) **모두 L1에서 cLPU_total / cLPU168h / L168h_ge2/ge3 양효과 z>2.5**, 일관성 100%. 가장 강한 효과는:

| Step | cLPU_total z | cLPU168h z | L168h_ge2 z | L168h_ge3 z |
|---|---|---|---|---|
| table | +6.34 | +4.55 | +4.08 | +3.10 |
| bgremove | +5.34 | +3.81 | +3.45 | +2.24 |
| 4step_empathy | +4.01 | +3.00 | +2.54 | - |
| font | +3.69 | +3.11 | +3.00 | +2.07 |
| aip_curiosity | +3.62 | +3.32 | +3.09 | +2.09 |

### 1.2 해석
- **시리즈 노출이 활성화에 강하게 기여.** 단, step별 효과 분리는 어려움 — 같은 user가 여러 step 받음.
- **COMPANY 세그먼트가 가장 큰 수혜**: font/bgremove에서 LDeep168h z=+10.01/+4.16 (로그인+디자인 동시 활성). 단 n_c=83으로 작아 강도는 절대값보다 방향만 신뢰.
- **UNKNOWN 세그먼트 LRateReturn 음효과(z≈-8.7) 캐비어트**: 3개 step 모두 거의 동일 z. 같은 control(n=347)이 여러 행에 등장 + UNKNOWN의 post-W1 관측 윈도우 차이로 인한 코호트 artifact 가능성 높음. **메일 자체 역효과로 단정 금물**.

### 1.3 권고
- **JA_SERIES 계속 운영, 콘텐츠 변경 불필요.**
- step별 콘텐츠 우열을 가리고 싶다면 별도 hold-out A/B (이 데이터로는 step 분리 불가).
- LRateReturn UNKNOWN artifact는 향후 3개월+ 누적 후 재검증.

---

## 2. D1 (일본 1차 온보딩 — 단독 캔버스) — 역효과 우세

### 2.1 cell별 결과
| Step | 신호 (양+/역-) | max\|z\| | 핵심 발견 |
|---|---|---|---|
| aip_curiosity | 0+/9- | 4.11 | **호기심 어필이 모든 metric에서 역효과**. COMPANY Activ_AUC ↓, UNKNOWN 디자인 ↓, LRateReturn ↓ |
| review_number | 2+/8- | 9.55 | **STUDENT L168h_ge3 z=-9.55**. 학생 코호트에 "리뷰 숫자" 어필 강한 거부 반응 |
| review_ampathy | 0+/1- | 3.94 | L1 LDeep168h z=-3.94 |
| 4step_simplify | 2+/3- | 5.18 | INDIVIDUAL LRateTotal +5.18 (단독으론 +), UNKNOWN L168h_ge2 -4.75 |
| aip_empathy | 0+/2- | 2.67 | 약한 역효과 |
| 4step_empathy | 0+/0- | - | 강신호 없음 (중립) |

### 2.2 콘텐츠 가설
- **aip_curiosity**: AI 기능 호기심 어필이 학습 부담 → 이탈. **JA_SERIES 안에선 +였지만 D1 단독 발송 시 -**. 시리즈 맥락 없이 단독으로 "새 기능"을 들이밀면 거부감.
- **review_number ↔ STUDENT**: 학생에게 "수만 명이 썼다" 식의 소셜 프루프 어필이 도리어 부담. 학생은 개인 학습 도구로 인식, 대중 어필이 반감.
- **review_ampathy**: 사용자 공감형 리뷰도 LDeep168h z=-3.94, 로그인+디자인 동시 활성을 누름. 콘텐츠 점검 필요.
- **4step_simplify**: INDIVIDUAL엔 통하지만 UNKNOWN(미분류 = 활성 낮은 신규)엔 역효과. 타겟팅 필요.

### 2.3 권고
- **즉시 중단 후보**: aip_curiosity (D1 단독), review_number STUDENT 타겟
- **콘텐츠 수정**: review_ampathy, aip_empathy
- **세그먼트 분기**: 4step_simplify는 INDIVIDUAL만 발송

---

## 3. D2 (일본 2차 — 기능 소개) — Mixed, 콘텐츠 의존 강함

### 3.1 cell별 결과
| Step | 신호 | max\|z\| | 양상 |
|---|---|---|---|
| **font** | 2+/0- | 4.74 | **D2 유일한 양효과 step**. BUSINESS cDPU168h z=+4.74 |
| **image_bgremove** | 0+/10- | 7.70 | **D2 전체 최악**. INDIVIDUAL LRateTotal z=-7.70 등 전 metric 음 |
| data_table | 0+/3- | 4.00 | COMPANY cDPU168h z=-4.00, cDPU_total z=-3.03 |
| image_frame | 0+/1- | 3.89 | COMPANY cDPU168h z=-3.89 |
| data_graph | 3+/6- | 8.69 | **세그먼트 분기**: BUSINESS LRateTotal +8.69, INDIVIDUAL cLPU168h -5.25 |

### 3.2 핵심 발견: 같은 콘텐츠, 정반대 효과
**bgremove**는 동일 기능을 다루는데:
- **JA_SERIES 안의 bgremove**: cLPU_total z=+5.34 (강한 +)
- **D2 단독 image_bgremove**: LRateTotal z=-3.81, INDIVIDUAL z=-7.70 (강한 -)

→ 같은 기능 메일이 **시리즈 맥락에선 효과 발현, 기능 캠페인 단독으론 역효과.** 가설:
1. D2는 이미 활성화된 유저 대상 → "이미 알고 있는" 유저가 추가 발송에 피로감
2. JA_SERIES는 신규 유저 활성화 윈도우 → 콘텐츠 자체 친밀도 증가
3. D2 발송 타이밍이 활성→비활성 전환 구간을 건드림

### 3.3 D2 / data_graph 세그먼트 분기
- BUSINESS (n_c=138): LRateTotal +8.69, **하지만 L168h_ge2 -3.28** (이상한 패턴)
- INDIVIDUAL (n_c=372): cLPU168h/cLPU_total/LRate168h/LRateTotal 모두 음 z=-3.3~-5.3
- → **BUSINESS만 발송, INDIVIDUAL 제외** 권고

### 3.4 권고
- **즉시 중단**: D2 image_bgremove (전 metric 역효과)
- **세그먼트 분기**: D2 data_graph → BUSINESS만, D2 data_table → COMPANY 제외
- **유지**: D2 font (BUSINESS 강한 +)
- **image_frame 콘텐츠 점검**: COMPANY 대상 디자인 행동 위축 원인 분석

---

## 4. EN1 (영어 1차) — Mixed

### 4.1 결과
- L1: cLPU168h z=-3.64, LRate168h z=-2.79 (전체적 약한 역효과)
- L2 / STUDENT: **cDPU_total z=+5.61 (디자인 행동 강한 +)**, **cLPU168h z=-3.34, LRate168h z=-4.21 (로그인은 ↓)**
- 단, 이 안에서 cDPU_total +2.42 (L1)도 있음

### 4.2 해석
**학생 코호트가 디자인 행동은 늘렸으나 로그인 빈도는 줄임** — "한 번 와서 깊게 디자인하고 가는" 패턴. CRM 활성화 정의를 무엇으로 보느냐에 따라 평가 달라짐.

### 4.3 권고
- 디자인 결과물 생성을 KPI로 본다면 **STUDENT 대상 유지**
- 로그인 빈도(LPU)가 KPI라면 **콘텐츠 수정** — 더 자주 들어오게 하는 hook 추가
- 다른 user_type 효과 미약(약신호 → 모니터링)

---

## 5. EDU_SERIES (에듀 시리즈) — 초반 step 역효과

### 5.1 결과
| Step | 신호 |
|---|---|
| edu01_class | L1 cLPU_total z=-4.11, EDUCATION cLPU_total z=-3.41 |
| edu02_quiz | L1 cLPU_total z=-2.90 |
| edu03_character | 강신호 없음 (단, 핸드오버에서 양효과 언급됨 → v4 50-metric에서 확인 필요) |

### 5.2 ⚠ 경고: 통제군 규모 작음
- ctrl_n=103 (L1), ctrl_n=102 (L2 EDUCATION). 잡음 가능성.
- 일관성 100%이긴 하나, weeks=4 기준이라 N×주가 적은 편.

### 5.3 권고
- **즉시 중단보단 데이터 누적 후 재검증** — 통제군 100명대는 신뢰 한계
- 단, **방향성은 일관 음** → 동시에 콘텐츠 정성 점검 권장
- edu03_character 양효과 가설은 50-metric 원본(`L1_v4_results.csv`)에서 확인 필요

---

## 6. JA1 (일본 1차 온보딩 — 시리즈 wrapper) — 강신호 없음

JA1 ja onboarding 4종(4step, aip, free, review) 모두 핵심 metric에서 |z|≥2 강신호 없음. 약신호 위주, 모니터링.

→ JA1은 시리즈 wrapper로 step 분리 어려움 + 효과 모호. JA_SERIES와 중복되는 측정인지 데이터 정의 확인 필요.

---

## 7. 운영 의사결정 매트릭스

### 즉시 액션 (이번 주)
| 우선순위 | 액션 | 대상 | 근거 |
|---|---|---|---|
| 🔴 즉시 중단 | D2 image_bgremove | 전체 | LRateTotal z=-3.81 (L1), INDIVIDUAL z=-7.70 (L2), 10 metric 모두 음 |
| 🔴 즉시 중단 | D1 review_number → STUDENT | STUDENT만 | L168h_ge3 z=-9.55 |
| 🔴 즉시 중단 | D1 aip_curiosity | 전체 | L1 cDPU168h z=-2.76, Activ_AUC z=-2.50, L2 COMPANY Activ_AUC z=-4.11 — 9개 cell 모두 음 |
| 🟡 세그먼트 분기 | D2 data_graph | BUSINESS만 발송 | INDIVIDUAL 강한 - |
| 🟡 세그먼트 분기 | D1 4step_simplify | INDIVIDUAL만 발송 | UNKNOWN L168h_ge2 z=-4.75 |
| 🟢 유지·확대 | JA_SERIES 전 step | 전체 | 모든 step 강한 + (단, 시리즈 통합 효과) |
| 🟢 유지·확대 | D2 font | BUSINESS 중심 | BUSINESS cDPU168h z=+4.74 |

### 콘텐츠 수정 후보 (월간)
| 대상 | 수정 방향 |
|---|---|
| D1 review_ampathy | 공감형 리뷰가 LDeep168h 누름 → 톤/CTA 개선 |
| D1 aip_empathy | 약한 역효과 — 카피 점검 |
| D2 data_table → COMPANY | 디자인 행동 위축 — 콘텐츠 재설계 |
| D2 image_frame → COMPANY | 같은 위축 — 재설계 |
| EN1 → STUDENT | 디자인↑ 로그인↓ — 재방문 hook 추가 |

### 재검증 (분기)
| 대상 | 사유 |
|---|---|
| EDU_SERIES edu01·edu02 | 통제군 N=103, 데이터 누적 후 재평가 |
| JA_SERIES UNKNOWN LRateReturn | 코호트 artifact 가능성, 3개월+ 누적 후 |
| 모든 약신호 cell | 분기별 ranking 재산출 |

### 추가 분석 필요
1. **bgremove 콘텐츠 동일성 검증**: JA_SERIES bgremove(+5.34) vs D2 image_bgremove(-3.81) — 같은 메일 콘텐츠인지, 발송 타이밍/세그먼트 차이인지 확인. 결과에 따라 D2 image_bgremove 콘텐츠 그대로 두고 발송 컨텍스트만 바꿔도 +로 전환 가능성.
2. **aip_curiosity 동일성**: JA_SERIES vs D1 동일 비교. 시리즈 진입 vs 단독 발송이 카운트 결정 변수일 수 있음.
3. **L3(ad_campaign 그루핑)**: 위 cell들이 광고 유입 코호트별로 어떻게 다른지 — 퍼포먼스 마케터 협업 필요.

---

## 부록: 데이터 caveat

1. **L2 작은 N cell**: JA_SERIES font COMPANY n_c=83. 절대 z는 크지만 모수가 작아 방향만 신뢰.
2. **JA_SERIES step별 효과 분리 불가**: 같은 user가 여러 step 노출 → 시리즈 통합 효과 측정만 가능.
3. **LRateReturn 관측 한계**: 4~6주 관측, 후기 코호트는 자연히 낮게 측정. 통계적 약신호 ≠ 실제 약효과.
4. **capped 변형(cLPU, cDPU) 사용**: outlier 극값 영향 줄인 버전. raw LPU/DPU와 약간 다른 ranking 가능.
5. **핸드오버 prompt의 z값 일부 불일치** (예: D2 font BUSINESS DRateTotal z=+15.97): final 26-metric 셋에서 DRateTotal 제외됨. v4 50-metric 원본 참조 시에만 확인 가능.
