# MiriCanvas Japan CRM — 프로젝트 히스토리 & 맥락

**최종 업데이트**: 2026-05-22  
**범위**: Phase 1 전체 + Phase 2 현재 상태

---

## 1. 프로젝트 개요

**목적**: 일본 신규 가입자의 가입 직후 이탈을 줄이고 진성고객으로 전환.  
**진성고객 정의**: 템플릿 생성 + 편집 두 경험을 모두 한 유저 (잔존율·NPS 압도적 차이).  
**접근**: 온보딩 이메일 캠페인 A/B 실험 → 성과 분석 → 다음 시즌 설계 개선.

**성과 측정 두 축**

| 축 | 측정 윈도우 | 의미 |
|---|---|---|
| **액티베이션 성과** | 발송 후 72~168h | 메일이 즉각적인 활성 행동을 이끌었나 (Welch z-rank + Winsorize 99%) |
| **리텐션 성과** | 가입 후 30~60일 | 메일이 장기 안착에 기여했나 (M1 retention 기반 KPI) |

둘 다 긍정 = A등급, 리텐션만 = B, 액티베이션만 = C, 역효과 = D/E.

**세그먼트**: 7개 (NULL, STUDENT, COMPANY, INDIVIDUAL, EDUCATION, BUSINESS, INSTITUTION).  
NULL = 가입 시 user_type 설문 미응답 (가장 큰 모수, 18,288명).

---

## 2. Phase 1 — 실험 캠페인 목록

| 캔버스 ID | 형태 | 내용 | 발송 시작 |
|---|---|---|---|
| JA1 (JA260407) | 단발 A/B/N, 4 step | 이전 시즌 온보딩 | 2026-04-09 |
| EN1 (EN260407) | 단발 1 step | Welcome (영문 설계) | 2026-04-09~ |
| D1 (D1JA260417) | 단발 A/B/N, 6 step | 소구점별 단발 테스트 | 2026-04-22 |
| D2 (D2JA260417) | 단발 A/B/N, 5 step | 소구점별 단발 테스트 2차 | 2026-04-23 |
| JA_SERIES (JA260417) | 8 step 시퀀스 | JAS 온보딩 시리즈 | 2026-04-22~05-06 |
| EDU_SERIES (JA260427) | 3 step 시퀀스 | 교육 특화 시리즈 | 2026-04-27~05-01 |

모든 캠페인 ~20% randomized holdout 통제군 포함.

---

## 3. 분석 방법론 발전 히스토리

Phase 1 분석은 총 3단계를 거쳐 현재 방법론으로 정착.

| 버전 | 방식 | 폐기 이유 | 위치 |
|---|---|---|---|
| v1 코호트분석 | 코호트 단위 집계 | 통제군 baseline N 너무 작아 오류 | `[성과분석] 온보딩_시퀀스/_archive_v1_코호트오류/` |
| Databricks SQL | SQL 집계 방식 | 유저 단위 randomization 미반영 | `[기초] 메트릭_방법론/_archive/v1_Databricks_SQL집계/` |
| v6 Welch전용 | Welch z-test만 | Winsorize 미적용 → 이상치 영향 | `[기초] 메트릭_방법론/_archive/v6_Welch전용_Winsorize미적용/` |
| **v7 (현행)** | Welch z + Winsorize 99% | — | `[기초] 파이프라인_산출물/` |

**리텐션 분석도 2단계 거침**

| 버전 | 방식 | 결론 변화 |
|---|---|---|
| v1 로그인지표 only | 로그인 지표만 | "D2가 리텐션 driver" → 오류 |
| v2 다운로드 추가 | 로그인 + 디자인 다운로드 | D2 효과 약화 → "이메일은 로그인까지만 끌어올림. 진성고객 직접 driver 아님" |

→ **메일의 역할 재정의**: 즉각 활성화 유도 + 안착 보조. 진성고객 전환의 직접 원인은 아님.

---

## 4. Phase 1 핵심 발견

### 4-1. JAS 시리즈의 압도적 우위

7개 세그먼트 중 6개에서 모든 단발 캠페인을 합친 것보다 강력.

| 세그먼트 | JAS 액티베이션 | 차위 단발 |
|---|---|---|
| STUDENT | 19~32 | D2 data_table 6 |
| BUSINESS | 19~32 | D2 font 11 |
| NULL | 19~27 | EN1 5 |
| COMPANY | 3~16 | D2 image_bgremove 13 |
| INDIVIDUAL | 1~10 (약함) | D1 4step_simplify 19 (액티베이션만) |
| INSTITUTION | 0 (효과 없음) | D1 aip_empathy 14 |

JAS 안에서 step별 콘텐츠 차이는 작음 — 시퀀스 누적 자체가 driver.

### 4-2. 세그먼트 분리 없이 보내면 위험 — 충돌 셀

| 메일 | 양효과 | 역효과 |
|---|---|---|
| D1 aip_curiosity | BUSINESS +32 | COMPANY -32, STUDENT -52 |
| D2 data_graph | STUDENT +39 | INDIVIDUAL -38, EDUCATION -31 |
| D2 font | BUSINESS +25 | COMPANY -29 |
| D2 image_bgremove | BUSINESS +20 | INDIVIDUAL -29 |

### 4-3. EDUCATION 역설

- 액티베이션: EDU 시리즈 역효과(-8), JAS도 데이터 없음
- 리텐션: EDU 시리즈 B-tier (M1 retention 긍정)
- 원인: 현재 콘텐츠가 비즈니스 자료 중심 → 교육 use case와 미스매치. 교육자는 즉각 활성화 없이 천천히 안착.

### 4-4. 단발 캠페인 운영 금지 목록 (세그별)

| 세그먼트 | 절대 금지 |
|---|---|
| STUDENT | D1 전 5종, D2 image_bgremove |
| COMPANY | D1 전종, D2 data_table, D2 font |
| INDIVIDUAL | D2 image_bgremove, D2 data_graph |
| EDUCATION | D2 data_graph, D2 data_table, D2 image_bgremove |
| NULL | D1 aip_curiosity (액티베이션 z 매우 강한 음) |

---

## 5. Phase 1 → Phase 2 이행 결정

### 5-1. 설계 원칙 전환

**메인 트랙**: 리텐션 검증된 것 (A/B등급) 중심으로 운영. 효과 입증된 단발은 JAS 안에 내삽.  
**실험 트랙**: 액티베이션만 확인된 것(C등급) 또는 신규 아이디어 → "JAS only vs JAS + 단발" 구조로 검증.

단독 기여 분리 측정은 포기. 시퀀스 내 특정 메일이 역효과 의심되면 ABN으로 분리해 제거 가능.

### 5-2. 시퀀스 내삽 타이밍

```
D+1 (JAS1) → D+2 (단발 내삽) → D+3 (JAS2) → D+5 (JAS3) → ... → D+24 (JAS8)
```
D+1/D+2 연속 부담 시 D+4~5로 밀 수 있음.

### 5-3. 측정 계속

- 동일 파이프라인(v7) 유지
- 모든 캠페인 holdout ~20% 고정
- 1달 후 리뷰: winner 확인 → 다음 cohort 비중 조정

---

## 6. Phase 2 현재 상태 (2026-05-22)

### 6-1. Braze Canvas 설계 (메인 트랙 초안)

| 세그먼트 | 메인 트랙 | 근거 등급 |
|---|---|---|
| NULL | JAS 8통 | A |
| STUDENT | JAS 8통 + D2_data_table 내삽(D+2) | A (data_table A-tier) |
| COMPANY | JAS 8통 (+ D2_image_frame 내삽 검토) | C (image_frame 리텐션 미검증) |
| INDIVIDUAL | JAS 8통 (+ D1_4step_simplify 내삽 검토) | C (4step_simplify 리텐션 미검증) |
| EDUCATION | EDU 3통 | B (리텐션만) |
| BUSINESS | JA1_review + EN1 내삽(D+4) | B + C |
| INSTITUTION | D1_aip_empathy 단발 50% | C |

### 6-2. 실험 트랙 후보 (미확정)

| 세그먼트 | 실험 후보 | 상태 |
|---|---|---|
| NULL | JAS vs JAS+EN1 | 확정 후보 |
| INDIVIDUAL | JAS+4step_simplify vs JAS+JA1_review | 비교 후보 |
| COMPANY | JAS+image_frame vs JAS 단독 | image_bgremove와 선택 |
| STUDENT | D2_data_graph 추가 검토 | 액티베이션·리텐션 교차확인 필요 |

### 6-3. 미결 결정 사항

| # | 결정 | 옵션 A | 옵션 B |
|---|---|---|---|
| 1 | COMPANY 내삽 | D2_image_frame (액티베이션 검증, 리텐션 미측정) | D2_image_bgremove (실험 트랙으로) |
| 2 | INDIVIDUAL 내삽 | D1_4step_simplify (액티베이션 +19, 리텐션 미측정) | JA1_review (약하지만 양쪽 확인됨) |
| 3 | STUDENT 실험 | D2_data_graph 추가 (액티베이션 최강 +39) | 현재 data_table 내삽으로 충분 |
| 4 | EDUCATION | EDU 유지 + 교육특화 실험 병행 | JAS로 교체 (리텐션 미측정이지만 액티베이션 강함) |
| 5 | 신규 아이디어 | 아이데이션 6개 중 이번 시즌 투입 대상 선정 | — |

---

## 7. 파일 인덱스

### CRM Phase.01 (성과 분석 + 실험 설계)

| 파일 | 용도 |
|---|---|
| `[설계] 페이즈2_실험설계/설계원칙.md` | Phase 2 실험 설계 마스터 |
| `[설계] 페이즈2_실험설계/최종설계_arm구성.md` | Arm 구성 초안 (확정안은 Phase.02에서) |
| `[설계] 페이즈2_실험설계/선정_데이터정리.md` | 메일 A/B/C 등급 분류 데이터 |
| `[성과분석] 메일_활성효과/캠페인_성과_활성지표기반.html` | 액티베이션 성과 인터랙티브 시각화 |
| `[성과분석] 온보딩_시퀀스/시퀀스설계_권장안.md` | Phase 1 → 2 이행 권장안 (이행 문서) |

### CRM Phase.02 (콘텐츠 + 메일 제작)

| 파일 | 용도 |
|---|---|
| `콘텐츠시스템.md` | 소구점·카피 뱅크·세그먼트별 전략 통합 |
| `디자인시스템.md` | HTML 구조, 디자인 토큰, 일본 규정 |
| `모듈화시스템.md` | 템플릿 레시피 10종, 모듈 라이브러리 |
| `레퍼런스.md` | 글로벌 SaaS 이메일 사례 15개 |
| `아이데이션_온보딩메일_202605221302.md` | 신규 온보딩 메일 아이디어 6개 |
