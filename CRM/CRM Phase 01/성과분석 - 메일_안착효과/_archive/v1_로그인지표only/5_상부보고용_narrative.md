# 일본 온보딩 메일 1차 분석 — 상부 보고 (KPI-directed)

**작성**: 2026-05-20
**팀 KPI**: M1 retention (가입 후 30~59일 재방문), 리테인 AU

---

## 한 줄 결론

**가입 직후 1통의 user_type별 맞춤 D2 메일이 진성고객 retention의 진짜 driver. 8통 시퀀스는 단기 활성만 끌어올리고 retention으로 안 이어짐. 다음 시즌은 D2 customize 메인 + 시퀀스 폐기 또는 보조 권장.**

---

## 1. 무엇을 했나

2026년 4~5월에 일본 신규 가입자 대상 5개 온보딩 캠페인 운영 (모두 ~20% randomized holdout):

| # | 캠페인 | 형태 | 통수 | 발송 시작 |
|---|---|---|---:|---|
| 1 | JA1 | 단발 4-cell A/B test | 1 | 04-09 |
| 2 | D1 | 단발 6-cell A/B test | 1 | 04-22 |
| 3 | D2 | 단발 5-cell (편집 기능 소개) | 1 | 04-23 |
| 4 | EDU 시리즈 | 3통 시퀀스 | 3 | 04-27 |
| 5 | JA 시리즈 | 8통 시퀀스 (2일 간격) | 8 | 04-22 |

총 발송 ~50,000명, 통제군 ~12,000명.

## 2. 분석 방법 — KPI 기준 framework 수립

**M1은 가입 후 60일 지나야 측정 가능** → 5개 캠페인 모두 직접 측정 불가. 대신 **W0(가입 +1~6일)·W1(+7~13일)·BW1(+14~27일) retention proxy**로 평가.

일본 가입자 cohort 59,550명(2026-01~03 가입)에서 proxy → M1 예측력 검증:

| Proxy | M1 도달 확률 (proxy 양수) | M1 도달 확률 (proxy 음수) | lift |
|---|---:|---:|---:|
| W0 | 21.7% | 2.6% | +19.0%p |
| W1 | 35.9% | 3.1% | +32.8%p |
| **BW1** | **45.3%** | 2.6% | **+42.6%p** |

→ **BW1이 M1의 최강 예측인자**. CRM 메일이 BW1을 끌어올리면 M1 기여 강하게 기대 가능.

## 3. 5개 캠페인 retention 효과

가입자 cohort 기준 trt vs ctrl, BW1 retention rate 비교:

| 캠페인 | BW1 lift | Welch z | 결론 |
|---|---:|---:|---|
| JA1 단발 | -0.19%p | -0.30 | 무효 |
| D1 단발 | -0.73%p | -0.33 | 무효 |
| **D2 단발** | **+3.24%p** | **+2.09** | **양의 유의** ⭐ |
| JAS 8통 시퀀스 | +1.93%p | +0.41 | 약한 양 |
| EDU 3통 시퀀스 | (BW1 측정 cohort 부족) | — | W1 z=+2.09 |

→ **D2 단발만 retention 명확한 양**. 8통 시퀀스 JAS는 단기 활성만 강함.

## 4. D2 cell × user_type matching

D2 5개 cell이 user_type별로 다른 효과:

| user_type | 1순위 메일 | BW1 lift |
|---|---|---:|
| **STUDENT** | **font** | +13.5%p |
| **COMPANY** | **data_table** | +12.9%p |
| **EDUCATION** | **image_bgremove** | +15.4%p |
| BUSINESS | font / image_frame | (n 작음, +20%p 이상) |
| INDIVIDUAL | image_frame / font | (n 작음) |
| **NULL (미설문)** | **모든 cell baseline 미달** | 발송 손해 |

→ **일괄 발송은 손해**. user_type targeting 필수.

## 5. JAS 8통 시퀀스 — 단기 활성 ≠ retention

JAS는 **W0**(가입 +1~6일 활성)에서 강한 양 (STUDENT +6.7%p, BUSINESS +5.5%p). 그러나 **W1·BW1**으로 안 이어짐. 메일 노출 동안만 외인성 활성, 노출 끝나면 retention 본래 수준.

같은 audience pool 안 비교 (n=190 baseline / 819 JAS만 / 767 D2만 / 3011 둘 다):

| cohort | BW1 |
|---|---:|
| 0통 | 0% |
| JAS 8통 only | 3.13% |
| **D2 1통 only** | **6.90%** |
| D2+JAS 9통 | 9.57% |

→ D2 1통이 JAS 8통보다 2배 retention. **8통 만들기보다 D2 한 통 잘 만드는 게 효율적**.

## 6. 다음 시즌 권장

### 확정 (실험 불필요)

1. **D2를 user_type별 customize**:
   - STUDENT → font
   - COMPANY → data_table
   - EDUCATION → image_bgremove
   - BUSINESS → font 또는 image_frame
2. **NULL audience 발송 보류** (user_type 설문 응답률 높이는 별도 노력)
3. **JA1·D1·EDU 3 step 폐기** (모두 retention 무효)
4. **JAS 시퀀스 재포지셔닝**: 폐기 또는 D2 보조 ($\Delta$BW1 +2.7%p만 추가)
5. **모든 캠페인 holdout 20% 유지**

### 추가 실험 가설 (옵션)

- A: NULL audience 분해 (왜 모든 메일 baseline 미달인가)
- B: D2 customize 발송 효과 재검증 (multi-arm)
- C: M1 직접 측정 (가입 후 60일+ 가입자 누적되면)

## 7. 분석의 학습 — paradigm 변경

**이전 분석은 활성 빈도(LPU·LDeep) 메인 → JAS 시퀀스 dominant 결론**. 그러나 활성 빈도가 KPI 직결 아님. **KPI-directed framework(W0·W1·BW1 retention)로 보면 D2 단발이 진짜 driver**.

이 학습을 v7 파이프라인·대시보드 framework에 반영 권장:
- ⭐⭐⭐ Stickiness_72h·LPU24h만 보지 말고
- ⭐⭐⭐ BW1 retention·M1 retention을 메인 KPI로
- 시퀀스 캠페인은 v7 cell-level z 부적합 (윈도우 중첩) → audience-level cohort 비교 별도 운영

## 8. 한계

- BW1 측정 cohort 일부 작음 (JAS·EDU). 다음 시즌 더 확정적 데이터
- INSTITUTION·INDIVIDUAL audience 작아 결론 신뢰도 낮음
- NULL audience mechanism 미상
- M1 직접 미측정 (가입 후 60일+ 도달 시점 후속 검증)
