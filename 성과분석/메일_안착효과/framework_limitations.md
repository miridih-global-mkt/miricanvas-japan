# KPI 기반 분석 framework 한계 정리

**작성**: 2026-05-20
**용도**: v3.2 KPI 기반 분석에서 확인된 한계. 추후 분석·해석 시 참고.

---

## 1. 종합점수(composite score) inflation

**한계**: 9 proxy 단순합산. 같은 시점의 lo/dl/ds 셋이 phi correlation 0.6~0.7로 강한 상관.

| proxy 쌍 | corr |
|---|---:|
| lo_bw1 ↔ dl_bw1 | 0.605 |
| dl_bw1 ↔ ds_bw1 | 0.722 |
| lo_w1 ↔ ds_w1 | 0.679 |
| dl_w1 ↔ ds_w1 | 0.680 |
| 같은 metric 다른 시점 (예: lo_w0 ↔ lo_w1) | 0.36~0.47 |
| 다른 시점 다른 metric | 0.17~0.36 (낮음) |

→ 같은 시점 3 metric은 사실상 1개 underlying activity. composite +3은 실제 +1~2 underlying signal 가량.

**그래도 valid한 부분**:
- proxy count 0→9 monotonic curve로 M1 도달률 1.3% → 78%
- 모든 cell에 같은 inflation 적용 → **ranking 목적엔 OK**
- "NULL × JAS가 다른 cell보다 강한 신호" 같은 순위 결론 valid

**주의**:
- **magnitude 절대치 인용 자제**. 예: "composite 4면 retention +Y%p" 같은 직접 mapping X
- 외부 보고 시 "양효과 cluster"·"가능성 cell" 같은 ranking 언어
- 다른 framework(v7 z-tier 등)와 점수 직접 비교 X (척도 다름)

**향후 개선**:
- 시점별 OR 묶기로 9 → 3 proxy 축소 (W0 활성·W1 활성·BW1 활성 binary)
- 또는 logistic regression weight 학습 (proxy → anchor 가중치 데이터 기반)

---

## 2. BW1 측정 cohort 좁음

**한계**: BW1(가입+14~27일) proxy 측정에는 가입 +28일+ 지난 사용자 필요. 분석 시점 2026-05-20 기준 → signup_date ≤ 2026-04-22 cohort만.

- 일본 cohort 검증용 (2026-01~03 가입): 대부분 측정 가능 ✓
- JA1 audience: 04-09~04-20 시즌 → 측정 가능 ✓
- **D1·D2·JAS·EDU audience**: 04-22+ 발송 → BW1 측정 cohort 매우 작음
- 따라서 dl_bw1·ds_bw1 lift는 JA1 외 캠페인엔 신뢰 어려움

**향후**: 시즌 종료 후 +28일 지나면 BW1 재산출 가능. M1까지 +60일 추가 대기.

---

## 3. proxy의 funnel 단계 차이 무시

**한계**: 종합점수가 시간 ordering 무시. W0·W1·BW1 동일 가중.

예시 — "late developer" 패턴 미식별:
- 사용자 A: W0 안 함 + W1·BW1 함 → 점수 0+1+1 = 2 (느린 진성)
- 사용자 B: W0·W1·BW1 다 함 → 점수 3 (빠른 진성)
- 둘 다 진성이지만 점수 다름. 점수만 보면 B가 강해 보임

또: BW1 download → M1 lift +57.5%p vs W0 login → +19%p. 신호 강도 3배 차이인데 종합점수에선 같은 +1.

**향후 개선**:
- 시간 후반 proxy에 더 큰 가중치 (BW1 ×2, W1 ×1.5, W0 ×1)
- 또는 anchor lift 기반 데이터 가중치 학습

---

## 4. 시퀀스 캠페인 cell-level z 부적합

**한계**: 측정 윈도우와 메일 간격 중첩. JAS는 2일 간격 메일 + 24/72/168h 윈도우 → 윈도우 안에 다음 메일 발송됨.

- 단발 캠페인 (JA1·D1·D2): cell-level z 적합 ✓
- **시퀀스 캠페인 (JAS·EDU)**: cell-level z 부적합 — 한 사용자가 N step 모두 받음, 윈도우 중첩으로 cell 차이 식별 불가
- audience-level cohort 비교가 정답 (JAS 진입자 vs holdout)

→ JAS 8 step의 cell별 효과 차이는 측정 한계로 안 보일 뿐, 실제 차이 있을 수 있음. 다음 시즌도 cell별 비교 어려움.

---

## 5. audience confound

**한계**: 캠페인 audience pool 다름 → 캠페인 간 직접 비교 어려움.

- D1 audience vs JAS audience: mutually exclusive (랜덤 양분) → 같은 시즌 다른 사용자
- baseline retention 차이 큼: D1 audience baseline LPU168 ≈ 0.24, JAS audience ≈ 0.11 (절반)
- 즉 "JAS audience baseline cold" → 같은 메일 효과여도 lift 비율상 다름

**그래도 valid한 부분**:
- 각 캠페인 audience 안의 trt vs holdout 비교는 randomized → audience confound 없음
- "캠페인 효과 자체" 판단은 OK
- "JAS와 D1 어느 게 더 좋나" 직접 비교는 confound

**향후**: 다음 시즌 같은 audience pool 안에서 multi-arm randomization으로 확정 비교 가능.

---

## 6. NULL audience 식별 한계

**한계**: user_type 미설문(NULL) audience가 전체의 ~30% (가장 큰 모수). 분석에서 가장 강한 양효과 cluster(NULL × JAS) 발견.

- NULL은 user_type 식별 가능한 사용자(STUDENT·BUSINESS·EDUCATION 등)와 다른 행동 가능성
- baseline retention 낮음 (cold audience 가능성)
- 식별 못 한 채로 큰 cohort라 마케팅 의사결정 어려움

**향후**:
- 가입 UX에서 user_type 설문 응답률 향상 (가장 큰 ROI 가능성)
- NULL 안에 디바이스·inflow·ad_channel 같은 다른 segment 분해 시도
- NULL × JAS 결론은 직접 검증 (다음 시즌)

---

## 7. M1 직접 측정 불가 (분석 시점 한계)

**한계**: M1 = 가입 +30~59일 재방문. 측정에 가입 후 60일+ 대기 필요.

- 5개 일본 캠페인 (04-09~04-22 시작): 분석 시점 2026-05-20 기준 M1 측정 거의 불가
- 일반 가입자 cohort (2026-01~03 가입)에서 검증 가능했지만 캠페인 효과는 X
- 따라서 W0·W1·BW1 proxy로 안착 예측

**향후**: 다음 시즌 종료 + 60일 도달하면 캠페인 audience M1 직접 측정 가능. proxy → M1 변환 비율 확정.

---

## 8. 편집(edit) metric 제외

**한계**: 디자인 편집 횟수는 에디터 1.0/2.0 카운트 방식 상이 (사용자 명시). 분석 제외.

- 본 분석은 design 생성(`design_version_union`) + 다운로드(`download_event_version_union`)만 사용
- 편집 깊이 측정 가능했다면 더 정확한 안착 신호 가능

**향후**: 에디터 카운트 방식 통일되거나 1.0·2.0 별도 분석 framework 만들면 추가 가능.

---

## 9. 단일 metric 절대 임계의 함정 (v3 시도해서 실패한 접근)

**확인된 한계**: 단일 proxy의 |z|≥2 임계 binary cut으로 분석하면 "안정 통과 1개"만 결론 → 너무 negative.

- v7 가이드라인은 본래 "강+ z≥3 + cons≥0.7" 같은 multi-criteria
- 종합점수 framework가 더 robust (단 inflation 한계 - 위 1번)
- **단일 metric 임계로 자르지 말 것**

---

## 10. 메일 자체의 본질적 한계

발견 — 메일 노출은 funnel 첫 단계만 끌어올림. 깊은 engagement(다운로드·진짜 작업 완료)는 메일이 못 만드는 경우 많음.

- 활성 빈도(LPU)는 메일이 끌어올림
- retention proxy(BW1)는 일부 segment·cell에 한정
- 다운로드 retention은 메일 효과 더 약함

→ 메일 외 lever (in-app 온보딩 UX·디자인 추천 personalization)이 더 큰 ROI 가능성. 메일을 진성고객 직접 driver로 위치시키지 말 것.

---

## 종합 — 어떻게 활용할까

| 목적 | framework 적용 |
|---|---|
| cell 간 순위 매기기 | 종합점수 그대로 OK |
| 다음 시즌 multi-arm 후보 식별 | 종합점수 기반 ranking + v7 z 보완 |
| 외부 magnitude 보고 | "양효과 cluster" 같은 ranking 언어, 절대치 caveat |
| 캠페인 간 직접 비교 | 같은 audience pool 안에서만 |
| 시퀀스 효과 평가 | audience-level cohort (cell-level X) |
| 안착 직접 측정 | M1 누적 cohort 도달 후 |
| 의사결정 기준 | 단일 metric 임계 X, 다양한 proxy 일관성 + monotonic 패턴 |
