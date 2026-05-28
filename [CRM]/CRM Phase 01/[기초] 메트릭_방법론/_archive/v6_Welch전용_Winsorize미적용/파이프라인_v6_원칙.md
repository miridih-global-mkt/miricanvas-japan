# 성과분석 파이프라인 v6 — 원칙·계산 방법

작성: 2026-05-19. 본 문서는 `_crm_pipeline_v6.ps1`의 계산 방법론과 v4(기존 ad-hoc Databricks 산출)와의 차이를 기록.

---

## 1. 입력 데이터

- 테이블: `temp.ejjeong_temp.crm_global_new` (Databricks)
- 단위: 1 row = 1 (user × canvas × treatment)
- 핵심 컬럼: `canvas_name`, `canvas_step_name`, `is_control`, `user_type`, `signup_time`, `login_*`, `design_*`, `is_open/clicked`

## 2. 분석 대상 캔버스 (6개, ASCII suffix 식별)

| 실험번호 | key | DB suffix | 표시명 |
|---:|---|---|---|
| 1 | JA1 | `%JA260407` (NOT EN) | 1차실험 |
| 2 | D1 | `%D1JA260417` | D1 |
| 3 | D2 | `%D2JA260417` | D2 |
| - | EN1 | `%EN260407` | 영문온보딩 |
| 4 | JA_SERIES | `%JA260417` (NOT D1/D2) | 시리즈실험 |
| 5 | EDU_SERIES | `GlobalJA260427%` | 에듀실험 |

제외 캔버스: `Global 온보딩 20260328/20260330` (이전 캠페인), `GlobalJA2605웨비나` (control 없음), `Global다운로드JA260409` (n<100).

## 3. 분석 단위 (L2)

(canvas × user_type × treatment_step) cell 별로 통제군(is_control='Y') 대비 비교.

- 7 user_type: BUSINESS / COMPANY / EDUCATION / INDIVIDUAL / INSTITUTION / STUDENT / "" (NULL → '_NULL_')
- INSTITUTION cell은 n 작아 통계적 신뢰도 낮음 (별도 caveat)

## 4. 메트릭 (44개 중 z 산출 대상 43개)

기준: `[기초] 메트릭_방법론/44_메트릭_랭킹테이블.csv`.

**모든 metric을 per-user expression으로 변환**하여 일관된 통계 가능하게 함:

- 도달 binary (LRate*, DRate*, LD*, LDeep*, LRateReturn/DRateReturn): `CAST(COALESCE(yn,'')='1' AS DOUBLE)` (NULL → 0)
- 깊이 binary (L*_ge2/ge3, D*_ge2/ge3): `CAST(COALESCE(count,0)>=N AS DOUBLE)` (NULL → 0)
- 평균 numeric (LPU*, DPU*): `CAST(COALESCE(count,0) AS DOUBLE)` (NULL → 0)
- 활성화 (Activ_AUC): 3개 도달 binary 평균
- Stickiness (4개): `count_d / NULLIF(count_l, 0)` per-user (분모 0인 user는 NULL → AVG·STDDEV 자동 제외, 실효 n 줄어듦)
- 메일 진단 (open_rate, click_rate, open_to_click): trt-only — z 산출 안 함, raw diff만 보고
- user_count: 모수 (z 산출 대상 아님)

> v4와 차이: v4는 binary metric에서 NULL/empty 처리가 부정확 (denominator 줄어들어 rate 부풀려짐). v6는 일관되게 NULL→0.

## 5. 통계 방법

### 5.1 효과 크기 (diff)

```
diff = mean_trt − mean_ctrl
```

### 5.2 효과 유의성 (z) — Welch two-sample

```
SE = sqrt(sd_trt² / n_trt_eff + sd_ctrl² / n_ctrl_eff)
z  = diff / SE
```

- `sd_*` = `STDDEV(per_user_expr)` per cell
- `n_*_eff` = non-NULL count per metric (Stickiness 등에서는 cell n보다 작음)
- 조건: `n_trt_eff > 1`, `n_ctrl_eff > 1`, `SE > 0`. 미충족 시 z = NULL
- trt_only metric (open_rate 등)은 z 산출 안 함

> v4와 차이 (중요): v4는 **weekly cohort SE** (주별 trt-ctrl diff의 SD / √weeks) 사용. 이 방법은 (a) 주가 적으면 SE 매우 작아 z 부풀려짐 (예: v4의 |z|=8~32), (b) JA1처럼 주 적은 캔버스에서 fallback 처리로 z=0 강제. v6는 표준 Welch 사용해 안정적·보수적·일관적.

### 5.3 일관성 (consistency)

`signup_time` 기준 주별 cohort 묶음 → 각 주 (trt 평균 − ctrl 평균) 부호가 전체 diff 부호와 일치하는 주 비율.

- 주별 최소 cell n=10 (양쪽 다) 충족 주만 카운트
- consistency 분자/분모 = (부호 일치 주 수) / (유효 주 수)
- 값 범위: 0~1. 1=완벽 일관, 0.5=무관

> v4 consistency도 유사 방식인 듯하나 정확한 정의 미공개. v6는 명시.

### 5.4 ctrl_n / trt_n

cell의 전체 user 수 (COUNT(*)). metric별 effective n과는 다름. effective n은 내부 SE 계산용으로만 사용.

### 5.5 필터

- v6 산출 자체는 필터 없이 모든 row 출력 (downstream에서 결정)
- 일반적인 활용 (compact·HTML): `ctrl_n >= 80` 권장. INSTITUTION 예외 (소n)
- 표시 시 |z|≥1 → 약신호, |z|≥2 → 중신호, |z|≥3 → 강신호 (Welch z 기준)

## 6. 산출물

`[기초] 파이프라인_산출물/L2_v6_results.csv` — 7,611 row × 10 컬럼:
```
canvas, user_type, treatment, metric, weeks, ctrl_n, trt_n, diff, consistency, z
```

## 7. v4 → v6 주요 차이 요약

| 사항 | v4 (기존) | v6 (신규) |
|---|---|---|
| z 산출 | weekly cohort empirical SE | user-level Welch SE |
| Binary NULL 처리 | 분모 축소 (잠재 버그) | 명시적 0 처리 |
| JA1 z | 모두 0 (버그) | 정상 산출 |
| JA_SERIES bookmark/templatemix | 0 (weeks 부족) | 정상 산출 |
| 극단 z (|z|≥8) | 빈번 | 거의 없음 |
| 코드 추적 가능 | 어려움 (ad-hoc) | `_crm_pipeline_v6.ps1` |

## 8. 재실행 방법

```powershell
$sp = 'C:\Users\USER\Downloads\[미리디 미캔재팬]\[CRM]\성과분석\[기초] 파이프라인_산출물\_crm_pipeline_v6.ps1'
Invoke-Expression ([System.IO.File]::ReadAllText($sp))
```

데이터 변경 시 (DB row 추가, 캔버스 추가 등) 위 1 줄로 재산출. 로그는 `_pipeline_v6_log.txt`.

## 9. 알려진 제한·caveat

- **Stickiness metric**: per-user d/NULLIF(l,0) — login 0회 user 제외되어 cell n 줄어듦. 의미 변형됨 (cell-level SUM/SUM과 다름). 분석문서 인용 시 명시 필요
- **EDU_SERIES 작은 n**: ctrl_n=179 (전체), per user_type cell은 더 작음. z 신뢰도 낮음
- **JA_SERIES bookmark/templatemix 신호**: 발송 늦어 observation window 짧음 — z는 정상 산출됐지만 후속 데이터로 재검 필요
- **EN1**: 1 step (`en welcome 001`) + 1 control (`en control`). raw 신호 정상 산출되나 step간 비교 불가
- **데이터 갱신 시점**: 본 분석 = `crm_global_new` 2026-05-19 시점 스냅샷. 이후 발송분 반영 위해 재실행 필요
