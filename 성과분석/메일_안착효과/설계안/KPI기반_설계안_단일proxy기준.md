# 다음 시즌 일본 온보딩 메일 — Multi-segment 가설 검증 설계안 v1

**작성**: 2026-05-20
**근거**: v3 분석에서 cell × user_type × 안착 proxy 매트릭스. **z 연속값** 기준 양 가능성 보인 cell들.

---

## 1. 핵심 디자인 철학

- **multi-arm이 아니라 multi-segment dedicated**: 각 user_type에 가설 cell 1개 발송. segment끼리 arm 분리 (segment 내부는 1 arm + holdout).
- **모든 segment에 ~20% holdout 고정** — segment별 trt vs ctrl 산출 가능.
- **NULL audience(미설문, ~30%)는 발송 보류** — 모든 cell baseline 미달 확인. user_type 식별 UX 우선.
- **콘텐츠는 가설 cell 그대로 (변형 X)** — 다음 시즌 결과를 v3 결과와 직접 비교 가능 (재현성).

---

## 2. 가설 8개 — 신뢰도 분류

### Tier ⭐ 안정 통과 (1개) — 우선 검증

| # | 캠페인 | cell | audience | proxy | v3 z | 가설 |
|---|---|---|---|---|---:|---|
| 1 | D2 | font | EDUCATION | W1 dl | +2.25 | D2 font가 EDUCATION audience의 W1 download retention을 끌어올림 |

### Tier ★ 양 신호이나 신뢰도 중 (3개) — 함께 검증

| # | 캠페인 | cell | audience | proxy | v3 z | 가설 |
|---|---|---|---|---|---:|---|
| 2 | JA1 | aip | INDIVIDUAL | BW1 dl + ds | +1.61 | JA1 aip가 INDIVIDUAL BW1 download·design 끌어올림 |
| 3 | D1 | aip_curiosity | BUSINESS | W1 dl | (C n작) | D1 aip_curiosity가 BUSINESS W1 download |
| 4 | JA1 | 4step | BUSINESS | BW1 ds | (n작) | JA1 4step이 BUSINESS BW1 design 생성 |

### Tier △ 양 신호이나 신뢰도 낮음 (3개) — 검증 가치 점검

| # | 캠페인 | cell | audience | proxy | v3 z | 비고 |
|---|---|---|---|---|---:|---|
| 5 | JA1 | review | BUSINESS | BW1 dl | (n=75, C NULL) | n 한계, 운영비 vs 가치 점검 |
| 6 | JA1 | 4step | INSTITUTION | BW1 ds | (n≈35) | INSTITUTION 모수 매우 작음 |
| 7 | JAS 8 step | (8개 cell) | STUDENT | W1 dl | (cell 분리 불가) | 시퀀스 통째 검증 가능. 콘텐츠 차이는 측정 한계 |

### Tier ✕ 보류 (Holdout만 운영)

NULL audience — 모든 cell baseline 미달. 발송 안 함. user_type 식별 UX 강화 우선.

---

## 3. 발송 schedule (구체)

### 3.1 segment별 발송 매트릭스 (4개 메일 × 6 user_type)

| 발송시점 | EDUCATION | INDIVIDUAL | BUSINESS | INSTITUTION | STUDENT | NULL |
|---|---|---|---|---|---|---|
| 가입 +1일 | — | — | — | D1 aip_empathy* | — | (발송 X) |
| 가입 +2일 | **D2 font** ★ | — | — | — | — | — |
| 가입 +3일 | — | — | **D1 aip_curiosity** | — | — | — |
| 가입 +5일 | — | **JA1 aip**(D1 발송 안 함) | **JA1 4step** | — | (JAS 시퀀스 시작) | — |
| 가입 +7일 ~ 가입 +21일 | — | — | — | — | **JAS 8 step (2일 간격)** | — |

(* INSTITUTION은 v3에서 D1 aip_empathy도 약한 양 cohort × user_type 효과 있었음. 가설 외 추가 trial로 운영 권장)

### 3.2 audience filter logic (Braze 자동 분기)

```
가입 시점 → user_type 확인
  ├─ EDUCATION → arm1 (D2 font) vs holdout (20%)
  ├─ INDIVIDUAL → arm2 (JA1 aip 단발) vs holdout
  ├─ BUSINESS → arm3a (D1 aip_curiosity) + arm3b (JA1 4step) vs holdout  ※ BUSINESS는 2-arm
  ├─ INSTITUTION → arm4 (D1 aip_empathy or JA1 4step) vs holdout
  ├─ STUDENT → arm5 (JAS 8 step 시퀀스) vs holdout
  └─ NULL (미설문) → all holdout (발송 X)
```

→ 총 6 segment × 평균 1~2 arm + holdout. BUSINESS만 2-arm A/B.

### 3.3 holdout 비율

- 모든 segment: **~20% randomized holdout**
- 절대 줄이지 말 것 — 다음 시즌 trt vs ctrl 측정 가능성 보장.
- 신뢰도 낮은 가설 (INSTITUTION·JAS×STUDENT) cohort 작아도 holdout 20% 유지

---

## 4. 측정 KPI · 분석 framework

### 4.1 KPI 계층 (우선순위)

| 우선순위 | KPI | 산출 시점 |
|---|---|---|
| 1 (메인) | **BW1 download** binary (가입+14~27일 ≥1 다운로드) | 가입 +28일 후 |
| 2 (보조) | BW1 design create binary | 가입 +28일 후 |
| 3 (보조) | BW1 login binary | 가입 +28일 후 |
| 4 (조기) | W1 download binary | 가입 +14일 후 (조기 신호) |
| 5 (사후) | retain (M0 AND M1) | 가입 +60일 후 |
| 6 (사후) | **M1 retention 직접** | 가입 +60일 후 (시즌 종료 시점 도달 후) |

### 4.2 z 평가 (v7 가이드라인 그대로)

- 강+: z≥+3 & consistency≥0.7 → +2점 (강한 양의 유의)
- 중+: +2≤z<+3 & cons≥0.7 → +1점 (양의 유의)
- 약+: +1≤z<+2 → 신호로 인정 (점수 미반영)
- |z|<1: 무효
- 약-/중-/강-: 동일 대칭

→ z 단순 임계 자르지 말고 **연속값 + cons로 종합 판정**. v3 분석에서 사용한 framework 유지.

### 4.3 cell-level vs audience-level

- 본 설계는 **segment 내부 1~2 arm**이라 segment-level cohort 비교가 메인 (audience-level)
- BUSINESS만 2-arm A/B → arm 간 z 비교도 산출
- 시퀀스(JAS)는 cell-level 비교 부적합 (윈도우 중첩). audience-level cohort만.

### 4.4 의사결정 룰

다음 시즌 후 v3 재산출:

| 결과 | 의사결정 |
|---|---|
| 가설 1 (D2 font × EDU)에서 z≥+2 재현 | **확정** — 후속 운영 |
| 가설 2 (JA1 aip × INDIVIDUAL)에서 z≥+2 도달 | **확정** — 후속 운영 |
| 가설 3·4 (BUSINESS arm A/B)에서 어느 한쪽 z≥+2 | **승자 확정** |
| 가설 5·6·7 신호 안정 통과 | **확정**. 아니면 **폐기** |
| 어느 가설도 z≥+2 미도달 | **메일이 안착 lever 아님 확정**. 자원 in-app·UX로 전환 |

---

## 5. 운영 비용 vs 가치 추산

| 가설 | 추정 audience (다음 시즌) | 운영 비용 | 검증 가치 |
|---|---:|---|---|
| 1: D2 font × EDU | ~7,000명 | 낮음 (단발 1통) | ★★★ (안정 통과) |
| 2: JA1 aip × INDIVIDUAL | ~9,500명 | 낮음 | ★★ (양 근접) |
| 3+4: BUSINESS A/B | ~2,200명 | 중간 (2 arm 운영) | ★★ |
| 5: JA1 review × BUSINESS | 가설 3·4와 함께 | 중간 | ★ (n 한계) |
| 6: INSTITUTION | ~600명 | 낮음 | ✕ (n 한계로 검증 어려움) |
| 7: JAS × STUDENT | ~14,700명 | **높음** (8통 시퀀스) | ★ (cell 분리 불가) |

**권장 우선순위**:
1. Tier ⭐ + ★ (가설 1·2·3·4) — 운영비 낮고 검증 가치 높음
2. Tier △ (5·7) — 운영비 부담. 검증 가치 점검 후 결정
3. Tier ✕ (NULL) — 발송 안 함

---

## 6. 정직한 caveat

- **검증 가능성 자체가 낮음**: 1,500+ cell×user_type×proxy 조합에서 z≥+2 안정 통과한 게 1건. 메일이 안착 KPI에 본질적 lever 아닐 수 있음
- **다음 시즌도 negative result 가능**: 모든 가설 z<+2면 메일 자원 전반 재조정 필요
- **메일 외 lever (in-app 온보딩·디자인 추천·NULL 식별)이 더 큰 ROI** 가능성 — 본 multi-arm과 별도로 진행 권장
- **M1 직접 측정은 시즌 종료 + 60일** 도달 시점. 다음 분석에서 proxy → M1 변환 비율 확정

---

## 7. 산출물 위치

- 본 문서: `[성과분석] 메일_안착효과/설계안/다음시즌_multi_arm_설계안_v1.md`
- v3 분석 raw: `raw_csv/` (12개 CSV 포함 z값)
- v3 분석 HTML: `0_종합보고서_v3.html`
- v3 분석 md: `0_종합보고서_v3_메트릭트리.md`
