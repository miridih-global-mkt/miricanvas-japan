> ⚠️ **Phase 1 → Phase 2 이행 문서** (작성: 2026-05-20, 상태: 대체됨)
> 이 파일은 Phase 1 성과 분석 후 작성된 Phase 2 권고안. 핵심 C-plan(JAS + 단발 내삽)은 2026-05-22 세션에서 재채택됨.
> Phase 2 실행 기준: `[설계] 페이즈2_실험설계/설계원칙.md` + `최종설계_arm구성.md` 참조.

# 다음 시즌 온보딩 시퀀스 설계 권장안 v1

**작성**: 2026-05-20
**근거**: v7 파이프라인 cell × user_type × 40 z-able metric × Welch z + Winsorize 99% (cell-level). `L2_v7_results.csv` 7,611 row. 종합점수 = `2×강+(z≥3·cons≥0.7) + 중+(2≤z<3·cons≥0.7) − 중− − 2×강−`. 시각화: `[성과분석] 메일_활성효과/세그먼트별_메일성과_compact.html` (확산 5 + 강도 6 그룹).
**보조 데이터**: `2_cell_score_by_user_type.csv` (cell × user_type × 종합점수 163 row).

---

## 1. 목적·전제

미캔재팬 신규 가입자 중 가입 직후 이탈 큰 사용자를 **진성고객으로 전환**. 이를 위해 온보딩 메일 발송. 5개 캠페인(JA1·D1·D2·JA시리즈·EDU시리즈, 모두 ~20% randomized holdout) 실증 결과 기반.

**진성고객 신호 = 확산(채택) + 강도(활성)의 종합**. 단일 metric 단정 회피. v7 종합점수가 이 정의를 가중합으로 구현.

## 2. 핵심 발견 (종합점수 기반)

### 2.1 JAS 8 step이 거의 모든 audience에 최강

| user_type | JAS cell 종합점수 범위 | 모수 |
|---|---:|---:|
| STUDENT | 19~32 (점수 1·2위 32점, 모두 강한 양) | 14,684 |
| BUSINESS | 19~32 | 2,167 |
| EDUCATION | 8~18 | 7,071 |
| COMPANY | 3~16 | 9,547 |
| NULL (미설문) | 19~27 | 18,288 |
| INDIVIDUAL | 1~10 (약함) | 9,425 |
| INSTITUTION | **0** (효과 없음) | ~562 |

→ JAS는 7개 user_type 중 6개에 **단발 캠페인 모두 합친 것보다 강력**. INSTITUTION만 예외 (sample 작고 효과 0).

### 2.2 JAS 안에서 cell 차이 작음 — 시퀀스 누적이 driver

JAS 8 step의 종합점수 범위가 각 user_type 안에서 10점 이내. **콘텐츠(table·font·bgremove·graph·bookmark·templatemix·aip_curiosity·4step_empathy) 차이는 부차적**. 시퀀스 자체의 누적 효과가 메인.

### 2.3 단발(D1·D2·JA1)은 user_type 선별 시 효과 — 무차별 발송 금지

각 user_type별 양 신호 단발 cell:
- **STUDENT**: JA1 review(9), D2 data_table(6), JA1 4step(6) — D1 모두 음
- **BUSINESS**: D2 font(11), JA1 4step(7), JA1 review(6), D1 aip_curiosity(5) — 음 cell 없음
- **COMPANY**: D2 image_bgremove(13) — D1 모두 음(-2~-7), JA1 4step·review 음
- **INDIVIDUAL**: JA1 review(6), JA1 aip(4) — D2 거의 음
- **EDUCATION**: EDU 3 step (1~3, 약함) — D2 image_bgremove·data_graph 강한 음
- **INSTITUTION**: **D1 aip_empathy(14), D1 4step_empathy(7), D2 image_frame(6), JA1 review(5)** — JAS 효과 없음, 단발이 메인
- **NULL**: JA1 4step(8), D2 data_table(7) — D1 aip_curiosity 매우 강한 음(-23)

### 2.4 폐기 권장 캠페인

- **EDU_SERIES (3 step)**: EDUCATION에 종합점수 1~3 (JAS는 같은 audience에 8~18). **JAS가 EDUCATION에도 더 효과적**. EDU_SERIES 자원 자체 폐기 또는 콘텐츠 전면 재설계
- **JA1**: 이전 시즌 캠페인이라 다음 시즌 운영 시 사용 안 함. 단 STUDENT·INDIVIDUAL·BUSINESS·NULL에 review·4step·aip cell이 양인 점은 향후 단발 디자인 참고

---

## 3. 다음 시즌 권장 설계 (BEST balance — C안)

JAS 8 step을 메인 채널로 + user_type별 단발 1~2개 추가 + INSTITUTION만 별도 트랙.

### 3.1 audience별 발송 schedule

| user_type | D+1 단발 | D+3 단발 | D+5~D+19 JAS 시퀀스 | 총 통수 |
|---|---|---|---|---:|
| **STUDENT** | × | × | 8 step | 8 |
| **BUSINESS** | × | **D2 font** | 8 step | 9 |
| **COMPANY** | × | **D2 image_bgremove** | 8 step | 9 |
| **INDIVIDUAL** | × | × | 8 step (약함, 콘텐츠 실험 후보) | 8 |
| **EDUCATION** | × | × | 8 step (EDU_SERIES 대체) | 8 |
| **INSTITUTION** | **D1 aip_empathy** | **D2 image_frame** | × (효과 없음) | 2 |
| **NULL** (미설문) | × | × | 8 step | 8 |

### 3.2 음 cell 명시적 발송 금지 목록

| user_type | 발송 금지 cell |
|---|---|
| STUDENT | D1 4step_empathy·review_number·aip_curiosity·aip_empathy, D2 image_bgremove |
| COMPANY | **D1 전체**, JA1 4step·review |
| INDIVIDUAL | D2 image_bgremove·image_frame·data_graph, D1 4step_empathy·4step_simplify·aip_empathy·review_number |
| EDUCATION | D2 image_bgremove·data_graph·data_table·font, JA1 review·4step |
| INSTITUTION | D1 aip_curiosity (유일한 음) |
| NULL | **D1 aip_curiosity (z 매우 강한 음 -23)**, D1 aip_empathy·review_ampathy·4step_empathy, D2 image_frame |

### 3.3 사용자 등록 시 자동 분기 logic

```
가입 시점 → user_type 확인
  ├─ INSTITUTION → D1 aip_empathy(D+1) → D2 image_frame(D+3) → 종료
  ├─ BUSINESS → D2 font(D+3) → JAS 8 step(D+5~D+19)
  ├─ COMPANY → D2 image_bgremove(D+3) → JAS 8 step(D+5~D+19)
  └─ 그 외 (STUDENT·INDIVIDUAL·EDUCATION·NULL) → JAS 8 step(D+5~D+19)
```

**holdout**: 각 audience pool에 ~20% randomized holdout 고정. 다음 시즌 효과 재측정 가능.

## 4. 가설·다음 실험 후보

다음 시즌이 끝난 뒤 다시 평가할 실험 가설들:

### 가설 A: JAS dose-response (길이 효과 plateau 검증)
"JAS 8 step → 12 step으로 늘리면 효과 더 커지나, plateau인가?"
- 현재 8 step이 강한 양. 추가 step의 marginal value?
- 디자인: 50% audience 8 step (현행) vs 50% 12 step 또는 multi-arm
- 측정: 동일 종합점수 framework

### 가설 B: INDIVIDUAL 약점 mechanism
"INDIVIDUAL은 왜 JAS 효과 약한가? (1~10점)"
- INDIVIDUAL audience 콘텐츠 customization (예: 개인용 템플릿 강조 vs 비즈니스 템플릿) 효과?
- 디자인: INDIVIDUAL 한정 콘텐츠 swap A/B

### 가설 C: D2 user_type customization 효과
"D2 cell이 user_type별 다른 효과 — 통합 단일 D2 vs user_type별 customized D2"
- 현재 권장은 BUSINESS=font, COMPANY=image_bgremove. 운영 비용 증가
- 가치 vs 비용 평가 위해 직접 A/B

### 가설 D: 발송 간격
"D1(D+1)·D2(D+3) 사이 1~2일 간격 vs 3~5일 간격"
- 현재 짧음. 더 띄우면 audience fatigue 줄어드나?
- INSTITUTION처럼 단발 2통 트랙에서 검증 가능

## 5. 측정 framework

- **파이프라인**: v7 그대로 (Welch + 9 metric Winsorize 99%)
- **시각화**: `세그먼트별_메일성과_compact.html` 자동 재생성 (다음 시즌 데이터 입력)
- **종합점수**: 2/1/-1/-2 가중치, cons≥0.7 필터, 40 z-able metric 누적
- **단일 KPI 보고가 필요할 때**: ⭐⭐⭐ Stickiness_72h(강도) + LPU24h(빈도) 둘 다 표기
- **모든 캠페인 holdout ~20% 유지** (절대 줄이지 말 것)

## 6. Caveat·한계

- **INSTITUTION sample 작음** (모수 ~562). 권장 D1 aip_empathy·D2 image_frame은 score 6~14이지만 trt_n 30~50대. 다음 시즌에도 sample 부족 가능성 — 효과 재확인 어렵다. 운영 비용 대비 가치 점검 권장
- **INDIVIDUAL JAS 효과 약함 (1~10점)**. 다른 audience(BUSINESS·STUDENT=19~32)와 격차 큼. JAS 콘텐츠가 INDIVIDUAL에 잘 안 맞을 가능성 — 가설 B로 따로 검증
- **NULL audience 가장 큼 (18,288)** — user_type 설문 응답률 높이는 별도 노력이 장기 ROI 큼. 응답 받으면 다른 audience와 동일 framework 적용
- **JAS 8 step 콘텐츠 차이 작음** — 콘텐츠 개편 우선순위 낮음. 다만 INDIVIDUAL용 콘텐츠 swap은 별도 가치 가능
- **종합점수는 가중합 합의된 framework** — z 임계(2·3) + cons 임계(0.7) 변경하면 ranking 달라질 수 있음. 현재 가이드라인은 v7 [[pipeline-v7]] 정의에 일관

## 7. 산출물 인덱스 (이 폴더)

- `0_시퀀스설계_권장안_v1.md` (본 문서)
- `1_cell_x_user_type_z_v2.csv` — 7 metric 추출
- `1_cell_x_user_type_z_v3_full_metric.csv` — 11 핵심 metric 추출
- `2_cell_score_by_user_type.csv` — cell × user_type × 종합점수 163 row
- `_archive_v1_cohort잘못된분석/` — 폐기된 v1 분석 (cohort-level, baseline n 작아 잘못)

원본 시각화: `[성과분석] 메일_활성효과/세그먼트별_메일성과_compact.html` — 같은 데이터 인터랙티브 view.
