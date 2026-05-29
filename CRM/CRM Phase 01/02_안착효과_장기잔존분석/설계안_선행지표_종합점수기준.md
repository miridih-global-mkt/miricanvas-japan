# 다음 시즌 일본 온보딩 메일 — Multi-segment 가설 검증 설계안 v2

**작성**: 2026-05-20 (v1 정정)
**v1과 차이**: 종합점수(9 proxy composite) 기반 재산출. 단일 proxy 절대 임계로 자르지 말고 다양한 시점·차원의 일관성을 v7 가이드라인대로 평가. 결과 — 양효과 cell 28개로 확대 (강한 양효과 3개 포함).

---

## 1. v1 → v2 핵심 변경

| 항목 | v1 (단일 proxy z≥2) | v2 (9 proxy 종합점수) |
|---|---|---|
| 양 cell 식별 수 | 1개 안정 (D2 font × EDU) + 점추정 7개 | **3개 강한 + 13개 양 + 12개 약한 = 28개** |
| NULL audience | 발송 보류 | **JAS 시퀀스 유지·확장** (강한 양효과 3 cell) |
| EDU 시리즈 | 폐기 | **EDUCATION에 양효과 → 유지** |
| STUDENT 권장 | (없음) | **D2 data_table 추가** (composite 3) |
| 전체 negativeness | "메일 lever 아님" 강함 | **일부 segment에 명확 양효과 확정** |

---

## 2. 종합점수 기반 가설 분류 (Tier 재구성)

종합점수 = 9 proxy의 누적 (강+ +2, 중+ +1, 중- -1, 강- -2). v7 가이드라인 그대로.

### Tier ⭐⭐⭐ 강한 양효과 (composite ≥ 4) — 3 cell, 우선 검증

| 캠페인 | cell | user_type | composite | n_T | 핵심 신호 |
|---|---|---|---:|---:|---|
| **JAS** | **4step_empathy** | **NULL** | **4** | **2,307** | W0/W1/BW1 login·dl 다수 양 (각 z 1.5~2.5) |
| **JAS** | **aip_curiosity** | NULL | 4 | 2,121 | 동일 일관 양 |
| **JAS** | **font** | NULL | 4 | 1,917 | 동일 일관 양 |

→ **JAS 8 step이 NULL audience(가입자의 ~30%, 가장 큰 모수)에 가장 강한 안착 신호**. v1에서 "NULL 발송 보류"라 한 결론 정반대.

### Tier ⭐⭐ 양효과 (composite 2~3) — 13 cell

| 캠페인 | cell | user_type | composite | n_T |
|---|---|---|---:|---:|
| JA1 | ja onboarding review | BUSINESS | 3 | 77 |
| JAS | bgremove | NULL | 3 | 1,617 |
| JAS | table | NULL | 3 | 1,371 |
| **D2** | **data_table** | **STUDENT** | 3 | 284 |
| JAS | font | STUDENT | 2 | 292 |
| JAS | bookmark | NULL | 2 | 785 |
| JAS | templatemix | NULL | 2 | 936 |
| JAS | graph | NULL | 2 | 1,149 |
| JAS | 4step_empathy | STUDENT | 2 | 342 |
| **EDU** | **edu02_quiz** | **EDUCATION** | 2 | 661 |
| JAS | aip_curiosity | STUDENT | 2 | 323 |
| JAS | bookmark | INSTITUTION | 2 | 24 |
| **EDU** | **edu01_class** | **EDUCATION** | 2 | 767 |

→ **EDU 시리즈 EDUCATION에 양효과** (v1 폐기 권장 정정). **STUDENT엔 D2 data_table·JAS 일부**.

### Tier ⭐ 약한 양효과 (composite 1) — 12 cell

대부분 BUSINESS·INDIVIDUAL의 JA1·D1 cell. 신호 약하지만 일부 가설로 검증 가능.

### 단일 proxy 안정 통과 (보너스)
- **D2 × font × EDUCATION × W1 download**: z=+2.25 (composite는 0이지만 단일 시점에서 안정 양의 유의)

---

## 3. 다음 시즌 운영 권장 (segment별)

### 3.1 segment × 가설 메일 매트릭스

| user_type | 모수 | 권장 메일 | 근거 | tier |
|---|---:|---|---|---|
| **NULL** | 18,288 | **JAS 8 step 시퀀스 (font·aip·4step·bgremove·table·graph·templatemix·bookmark 그대로)** | 강한 양효과 3 cell + 양효과 5 cell | ⭐⭐⭐ |
| **STUDENT** | 3,373 | **JAS 8 step + D2 data_table 보강** | JAS 3 cell + D2 1 cell 양효과 | ⭐⭐ |
| **EDUCATION** | 4,348 | **EDU 시리즈 (edu01·edu02 유지) + D2 font 단발 보강** | EDU 2 cell 양효과 + D2 font 단일 안정 (z=+2.25) | ⭐⭐ |
| **BUSINESS** | 1,404 | **JA1 review 단발 + (option) D1 aip_curiosity** | composite 3 (n=77 작음) | ⭐ |
| **INDIVIDUAL** | 3,536 | **JA1 aip 단발** | composite 1, 약한 양 (BW1 dl/ds) | ⭐ |
| **INSTITUTION** | 562 | **검증 보류** | n 한계, JAS × bookmark만 양효과(n=24 매우 작음) | △ |

### 3.2 holdout

- 모든 segment에 **~20% randomized holdout** 고정
- 가장 중요한 NULL audience(18k)도 holdout 20% — 다음 시즌 trt vs ctrl 검증 가능
- holdout 절대 줄이지 말 것

### 3.3 발송 schedule (구체)

```
가입 시점 → user_type 확인 (Braze 자동 분기)
  ├─ NULL (미설문)
  │   ├─ 80% → JAS 8 step 시퀀스 (D+1·D+3·D+5·D+7·D+9·D+11·D+13·D+15)
  │   └─ 20% → holdout
  ├─ STUDENT
  │   ├─ 70% → JAS 8 step 시퀀스
  │   ├─ 10% → D2 data_table 단발 (D+3)
  │   └─ 20% → holdout
  ├─ EDUCATION
  │   ├─ 70% → EDU 3 step + D2 font (D+3) 보강
  │   └─ 20% → holdout
  │   (10%은 EDU vs JAS arm 추가 비교 옵션)
  ├─ BUSINESS
  │   ├─ 40% → JA1 review 단발 (D+3)
  │   ├─ 40% → D1 aip_curiosity 단발 (D+3) ← A/B 비교
  │   └─ 20% → holdout
  ├─ INDIVIDUAL
  │   ├─ 80% → JA1 aip 단발 (D+3)
  │   └─ 20% → holdout
  └─ INSTITUTION → 100% holdout (n 한계, 검증 불가)
```

---

## 4. 측정 framework

### 4.1 KPI 계층

| 우선순위 | KPI | 산출 시점 |
|---|---|---|
| 1 (메인) | **종합점수** (9 proxy composite) | 가입 +28일 후 |
| 2 | BW1 download binary | 가입 +28일 후 |
| 3 | BW1 design create + login binary | 가입 +28일 후 |
| 4 (조기) | W1 download + login | 가입 +14일 후 |
| 5 (사후) | retain (M0 AND M1) | 가입 +60일 후 |
| 6 (사후) | **M1 retention 직접** | 가입 +60일 후 |

### 4.2 v7 가이드라인 (z 연속값 + 종합점수)

- 강+: z≥+3 & cons≥0.7 → +2점
- 중+: 2≤z<+3 & cons≥0.7 → +1점
- 약+: 1≤z<+2 → 신호 표시 (점수 미반영)
- |z|<1: 무효
- 음 대칭

→ **단일 proxy 임계로 자르지 말 것**. 9 proxy 종합점수로 robust 평가.

### 4.3 의사결정 룰

다음 시즌 종료 후 v3 framework로 재산출:

| 결과 | 의사결정 |
|---|---|
| Tier ⭐⭐⭐ (NULL × JAS) composite 4+ 재현 | **확정** — 메인 채널 |
| Tier ⭐⭐ (STUDENT × D2, EDU × EDUCATION) composite 2+ 재현 | **확정** — segment 운영 |
| Tier ⭐ (BUSINESS A/B) 한쪽 z≥2 도달 | **승자 확정** |
| Tier △ INDIVIDUAL composite 안 잡힘 | **폐기** |
| 모든 가설 재현 실패 | **메일 lever 본질적 약함**. in-app·UX로 자원 전환 |

---

## 5. v1 권장 정정 요약

| v1 권장 | v2 정정 |
|---|---|
| NULL audience 발송 보류 | **NULL에 JAS 시퀀스가 가장 강한 양효과 — 핵심 채널** |
| EDU 시리즈 폐기 | **EDUCATION에 양효과 cell 있음 → 유지** |
| D2 font × EDUCATION만 (단일 가설) | + **STUDENT × D2 data_table, EDU × EDUCATION** 추가 |
| JAS 8 step 폐기 또는 보조 | **NULL·STUDENT에 메인 채널** |
| 메일이 안착 lever 아님 (강한 negative) | **일부 segment·cell에 명확 양효과 확정** — 약화된 negative |

---

## 6. 운영 비용 vs 가치 (재추산)

| 가설 | 다음 시즌 추정 audience | 운영 비용 | 검증 가치 |
|---|---:|---|---|
| Tier ⭐⭐⭐ NULL × JAS 8 step | ~18,000명 | 중간 (8통 시퀀스) | **★★★★ 가장 큰 cohort + 강한 신호** |
| Tier ⭐⭐ STUDENT × JAS + D2 data_table | ~3,400명 | 중간 | ★★★ |
| Tier ⭐⭐ EDUCATION × EDU + D2 font | ~4,300명 | 낮음~중간 | ★★★ |
| Tier ⭐ BUSINESS A/B (JA1 review vs D1 aip_curiosity) | ~1,400명 | 중간 | ★★ |
| Tier ⭐ INDIVIDUAL × JA1 aip | ~3,500명 | 낮음 | ★ |
| INSTITUTION | 검증 불가 | 낮음 | ✕ |

**총 비용**: JAS 시퀀스 NULL·STUDENT에 운영. EDU 유지. D2 BR 다수 segment 발송. 운영 부담 증가하지만 **검증 가치도 큼**.

---

## 7. 메트릭 관점에서 본 정직한 메시지

### 무엇이 보였나
- 일본 5개 캠페인의 일부 cell × user_type 조합에서 **안착 KPI 선행지표 9개의 다수 시점에서 일관 양 신호**
- 가장 강한 cluster: **JAS 8 step × NULL audience** (composite 4, 3 cell)
- 다음: STUDENT·EDUCATION의 일부 cell

### 무엇이 안 보였나
- 강+ (z≥3, 단일 proxy 강한 양) 안정 통과 0건
- 단일 proxy로 z>+2 통과는 D2 × font × EDU × W1 dl 1건
- BUSINESS·INDIVIDUAL·COMPANY는 약함 (composite 0~1)

### 어떻게 받아들이나
- **종합 신호로 보면 negative-only 아닌 게 분명**. 다만 안전한 결론은 NULL·STUDENT·EDUCATION의 ⭐⭐ 이상 cell만
- BUSINESS·INDIVIDUAL은 추가 가설 시험 (운영 비용 낮을 때만)
- INSTITUTION은 N 한계로 검증 미가능
- M1 직접 측정은 다음 시즌 종료 + 60일 도달 시점부터 누적

---

## 8. 산출물

- 본 문서: `[성과분석] 메일_안착효과/설계안/다음시즌_multi_arm_설계안_v2.md`
- 이전 버전: `[성과분석] 메일_안착효과/설계안/다음시즌_multi_arm_설계안_v1.md` (단일 proxy 임계 기반, 종합점수 적용 전)
