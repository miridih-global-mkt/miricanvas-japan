# CRM 캠페인 성과분석 프로젝트

미캔재팬/글로벌 CRM 메일 캠페인의 효과 측정·분석 프로젝트입니다. 분석 대상·메트릭·기준은 작업 요청에 따라 유연하게 조정 가능합니다.

---

## 1. 데이터·인프라 기본 정보

| 항목 | 값 |
|---|---|
| Databricks Workspace | `https://miridih-workspace.cloud.databricks.com` |
| 기본 데이터 테이블 | `temp.ejjeong_temp.crm_global_new` |
| 기본 대시보드 ID | `01f13a75c0881fa29fa2b55eaf3e00af` (CRM Global Canvas Dashboard) |
| SQL Warehouse ID | `f851823d32e682bc` (COMMON_USE_SQL_CLUSTER) |
| CLI 인증 | ✅ 완료 (`databricks --profile DEFAULT`) |

> 위 자원 외에도 필요시 다른 테이블·warehouse·workspace 자유롭게 사용 가능.

### CLI SQL 실행 템플릿

```powershell
function Run-SQL($sql) {
  $tok = (databricks auth token --profile DEFAULT | ConvertFrom-Json).access_token
  $body = @{warehouse_id='f851823d32e682bc';statement=$sql;wait_timeout='50s'} | ConvertTo-Json -Depth 10
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $r = Invoke-RestMethod -Uri 'https://miridih-workspace.cloud.databricks.com/api/2.0/sql/statements' -Method POST -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body $bytes
  $sid = $r.statement_id
  while ($r.status.state -in 'PENDING','RUNNING') {
    Start-Sleep -Seconds 3
    $r = Invoke-RestMethod -Uri "https://miridih-workspace.cloud.databricks.com/api/2.0/sql/statements/$sid" -Headers @{Authorization="Bearer $tok"}
  }
  return $r
}
```

대시보드 수정은 `databricks lakeview get/update` 사용.

### 자주 사용하는 원본 테이블

테이블 상세 정보는 아래 두 파일 참고:
- Braze 이벤트 로그: `../테이블 정보 (Braze).md`
- Databricks (미리캔버스 내부): `../테이블 정보 (Databricks).md`

### 자주 사용하는 쿼리 조각

**일본 가입자 cohort 정의 (M1 측정 가능 cohort)**:
```sql
SELECT account_id, p_date as signup_date
FROM gold.miricanvas_global.v_user_info
WHERE country = 'Japan' AND p_date BETWEEN '2026-01-01' AND '2026-03-22'
-- M1 측정 cutoff = 분석시점 - 59일
```

**Retention 단계별 binary (가입 cohort 기준)**:
```sql
LEFT JOIN gold.miricanvas_global.v_valid_login b
  ON TRY_CAST(c.account_id AS STRING) = b.account_id
  AND b.event_date BETWEEN date_add(c.signup_date,1) AND date_add(c.signup_date,59)
-- W0 = MAX(event_date BETWEEN +1 AND +6)
-- W1 = +7~+13
-- BW1 = +14~+27
-- M0 = +1~+29
-- M1 = +30~+59
-- retain (리테인 AU) = M0=1 AND M1=1
```

**다운로드 metric (가입 cohort 기준)**:
```sql
LEFT JOIN silver.miricanvas_design.download_event_version_union d
  ON TRY_CAST(c.account_id AS STRING) = TRY_CAST(d.account_id AS STRING)
  AND d.p_created_date BETWEEN c.signup_date AND date_add(c.signup_date,27)
-- D0 dl = p_created_date = signup_date
-- W0 dl = +0~+6
-- W1 dl = +7~+13
-- BW1 dl = +14~+27
```

**디자인 생성 metric (가입 cohort 기준)**:
```sql
LEFT JOIN silver.miricanvas_design.design_version_union d
  ON TRY_CAST(c.account_id AS STRING) = d.account_id
  AND d.p_created_date BETWEEN c.signup_date AND date_add(c.signup_date,27)
-- 동일 시간 윈도우. COUNT(DISTINCT d.design_id)로 생성된 design 수
```

**CRM 캠페인 audience 라벨링 (5개 일본 캠페인)**:
```sql
WITH labeled AS (
  SELECT external_user_id, MIN(CAST(signup_date AS DATE)) signup_date, MAX(COALESCE(NULLIF(user_type,''),'NULL')) user_type,
    MAX(CASE WHEN canvas_name LIKE '%JA260407%' THEN 1 ELSE 0 END) in_ja1,
    MAX(CASE WHEN canvas_name LIKE '%D1JA260417%' THEN 1 ELSE 0 END) in_d1,
    MAX(CASE WHEN canvas_name LIKE '%D2JA260417%' THEN 1 ELSE 0 END) in_d2,
    MAX(CASE WHEN canvas_name LIKE '%JA260417%' AND canvas_name NOT LIKE '%D1JA260417%' AND canvas_name NOT LIKE '%D2JA260417%' THEN 1 ELSE 0 END) in_jas,
    MAX(CASE WHEN canvas_name LIKE '%JA260427%' THEN 1 ELSE 0 END) in_edu,
    MAX(is_control) is_ctl  -- N=처리 Y=통제
  FROM temp.ejjeong_temp.crm_global_new
  WHERE canvas_name RLIKE 'JA260407|D1JA260417|D2JA260417|JA260417|JA260427'
  GROUP BY external_user_id
)
```

**v7 코어 metric 정의 (v7 가이드라인)**:
```sql
-- Stickiness_72h = design_count_72h / login_days_72h (where login_days_72h > 0)
-- LPU24h = login_days_24h (raw)
-- L72h_ge2 = (login_days_72h >= 2 AS DOUBLE)
-- LDeep168h = (login_days_168h >= 2 AND design_count_168h >= 2 AS DOUBLE)
-- LRateReturn = (login_days_total > login_days_168h AS DOUBLE) — 가입 후 1주+ 이후 재방문
-- DRateReturn = (design_count_total > design_count_168h AS DOUBLE) — 1주+ 이후 재디자인
```

**Welch z 계산 (T vs C lift)**:
```sql
-- per-cohort metric AVG, n
-- z = (avg_T - avg_C) / sqrt(var_T/n_T + var_C/n_C)
-- binary metric: var = p*(1-p)
-- Winsorize 적용 metric: DPU·Stickiness·LPU_total은 cell 상위 1% cap
```

### 글로벌 대시보드 활용

- 메인 대시보드: `01f1284c62241c6d9b12cd4c2e7cec54` (글로벌 미캔재팬, AARRR Summary 포함)
- AARRR Summary dataset에 retention 정의·M1 SQL 포함 (`v_valid_login` 기준)
- `[성과분석] 메일_안착효과/dashboard/_dashboard_queries/` 27개 SQL 별도 저장 (Retention·Activation·Acquisition 시리즈)

---

## 2. ⚠ PowerShell·환경 주의사항 (실수 회피용)

- **한글 경로**: 작업 폴더가 `[미리디 미캔재팬]\[CRM]\성과분석\`처럼 대괄호·한글 포함. `Get-Content`, `Out-File` 등엔 **`-LiteralPath` 필수** (없으면 wildcard 해석으로 실패). 대안: `[System.IO.File]::ReadAllText()` / `WriteAllText()`
- **변수명**: `$pid`는 read-only 시스템 변수. `$pageId`, `$processId` 등으로 사용
- **스크립트 실행**: `-ExecutionPolicy Bypass` 차단됨. `.ps1` 파일 직접 실행 불가 → `Invoke-Expression ([System.IO.File]::ReadAllText('path.ps1'))` 으로 inline 실행
- **인코딩**: 한글 데이터 다룰 땐 UTF-8 명시 (`[System.Text.Encoding]::UTF8`)
- **SQL wait_timeout**: 최대 50초. 더 긴 쿼리는 polling 패턴 (위 템플릿 참고)
- **CSV 저장 시 Excel용**: UTF-8 with BOM 필요 (`New-Object System.Text.UTF8Encoding($true)`)
- **`Get-Content -Raw`**: 구버전 PowerShell엔 없음. `[System.IO.File]::ReadAllText()` 대체

---

## 3. 산출물 폴더 안내

작업 거점: `C:\Users\USER\Downloads\[미리디 미캔재팬]\[CRM]\성과분석\`

폴더 안에 이전 분석 산출물·문서들이 있습니다. **필요시 자유롭게 탐색·참고**하세요. 주요 자료:

- 메트릭 정의·분류 부록
- 메트릭 선정 가이드라인·의사결정 근거
- 메트릭 ranking 테이블 (L1·L2)
- 분석산출물/ 하위: cell-level raw CSV, weekly aggregation JSON, ranking CSV 등 (v3·v4·final 등 여러 버전 존재)
- 대시보드 정의 JSON 백업 (변경 이력별)

### 산출물 저장·폴더링 가이드

- **새 산출물은 본 성과분석 폴더 안에 저장** (외부 임시 경로 X)
- **주제별 하위 폴더 활용 권장** — 루트엔 다음 카테고리로 분류됨 (`[그룹] 주제` 네이밍):
  - **[기초]**: `[기초] 메트릭_방법론/`, `[기초] 파이프라인_산출물/`, `[기초] 대시보드_백업/`
  - **[성과분석]**: `[성과분석] 메일_활성효과/`, `[성과분석] 온보딩_시퀀스/`, `[성과분석] 메일_안착효과/`
  - **[설계]**: `[설계] 다음시즌/`
  - **[웨비나]**: `[웨비나] 분석/`
  - 기존 카테고리에 들어맞으면 거기에, 새 주제면 같은 `[그룹] 주제` 형식으로 신규 폴더 만들어도 OK
- **억지로 분류하진 말 것** — 한두 개짜리 임시 파일·진행 중 자료는 루트에 둬도 됨. 분석 한 묶음(리포트 md + raw csv 여러 개) 완성됐을 때 정리하면 충분
- **중간 산출물 (`_*.csv`, `_*.json`, `_*.txt` 등 언더스코어 prefix)도 가능한 한 해당 분석 폴더 안에**. 루트가 잡다해지면 다음 세션에서 식별이 어려워짐
- 옛 버전 보관 필요시 해당 폴더 안에 `_archive/` 하위에 정리

---

## 4. 방법론 자료 (참고용, 강제 아님)

이전 세션에서 수립된 자료가 있습니다 (폴더 안에 문서로 존재):

- **메트릭 선정 가이드라인**: 신호/잡음 비율(z값), 일관성·명료성 평가 기준
- **분석 층위 정의**: L1(캔버스 단위), L2(캔버스 × user_type), L3(보류)
- **메트릭 ranking 산출 방법**: weekly cohort 기반 empirical SE
- **핵심 메트릭 선정 근거**: 현재 9개 선정됐으나 변경 가능

> 단, 새 분석에선 **다른 방법론·다른 분석 단위·다른 메트릭** 자유롭게 도입 가능. 위 자료는 컨텍스트로 참고하되 강제 아님.

---

## 4.5. 기본 메트릭 set (v7, 2026-05-19 갱신)

### 기본 메트릭 (44개)
분석의 기본 메트릭 set은 **44개**. 정의는 `[기초] 메트릭_방법론/메트릭_후보리스트_부록.md`, 랭킹은 `44_메트릭_랭킹테이블_v7.md` 참고. 구성:

- 모수 1개 (user_count)
- 메일 진단 3개 (open_rate, click_rate, open_to_click — trt-only, z 산출 안 함)
- 실제 분석용 40개 (LPU·DPU·LRate·DRate·L_ge2/ge3·D_ge2/ge3·LD·LDeep·Stickiness·재방문·Activ_AUC)

### 핵심 메트릭 — 3 tier 정의 (v7)

선정 근거·redundancy·차원 분석: `메트릭_선정_의사결정_근거_v7.md`

| Tier | 명칭 | 개수 | 용도 |
|---|---|---:|---|
| 🥇 | **최중요 ⭐⭐⭐** | 2 | 단일 KPI 보고 |
| 🥈 | **중요 (코어)** | 6 | 대시보드 위젯 메인 |
| 🥉 | **유의미 (compact)** | 11 | 리포트 HTML 상세 표 |
| (전체) | 백엔드 measures | 44 | 대시보드 SQL 정의 |

#### 🥇 최중요 ⭐⭐⭐ (2개)
- **Stickiness_72h** (로그인일당디자인수D3) — composite 78, 활성 강도 측정 최강
- **LPU24h** (로그인평균일수D1) — composite 73, 가장 많은 cell에 일관 신호

#### 🥈 중요 코어 6개 (대시보드 위젯)
위 2개 + LPU72h · L72h_ge2 · DPU24h · LDeep168h

#### 🥉 유의미 11개 (Compact HTML 표시)
위 6개 + LPU168h · L168h_ge3 · LRate168h · DPU72h · LRateReturn

### 분석 파이프라인 (v7)

- 코드: `[기초] 파이프라인_산출물/_scripts/_crm_pipeline_v7.ps1`
- 산출: `L2_v7_results.csv` (7,611 row)
- z 방법: **Welch two-sample (user-level SE)** + 9 metric에 cell-level Winsorize 99%
- Winsorize 대상: DPU24h/72h/168h/total · Stickiness 24h/72h/168h/total · LPU_total
- 가이드라인: 1순위 일관성 (cons≥0.7), 2순위 명료성 (|z|≥2). 양·음 무관
- 자세히: `파이프라인_v7_원칙.md`

> v4(Databricks ad-hoc, weekly cohort SE, JA1 z=0 버그)·v6(Welch only, outlier 영향)는 폐기. 모두 `_archive/` 보관.

> 메트릭 set·tier는 현재 시점 기준. **분석 의도·새 발견에 따라 유연하게 변경 가능**.

---

## 5. 자유롭게 변경 가능한 분석 변수

다음 항목들은 분석 목적·사용자 요청에 따라 자유롭게 조정 가능:

- **분석 대상 캔버스**: 현재 6개(EN1, JA1, D1, D2, JA_SERIES, EDU_SERIES) 중심이지만 다른 캔버스 추가·일부만 선택 등 자유
- **메트릭 set**: 44개 외에도 새 메트릭 정의·기존 변형·새 시간 윈도우 등 가능
- **분석 단위**: L1·L2·L3 외 새로운 슬라이싱(예: 디바이스별, 가입일자별, 광고 그루핑 등) 가능
- **모수 임계치·시간 윈도우·통계 기준**: 분석 의도에 맞게 조정
- **시각화·산출물 포맷**: md, csv, html, excel, 대시보드 직접 수정 등 적절한 형태

---

## 6. 일반적 작업 원칙

- **사용자 의도 우선**: 요청 모호하면 짚어 묻기. 큰 변경 (대시보드 수정·파일 대량 이동 등) 전 컨펌
- **폴더 자료 자유 탐색**: 필요한 컨텍스트는 폴더 안 문서 읽어 확보
- **백업**: 대시보드·중요 산출물은 변경 전 백업 권장
- **결과 저장**: 분석 결과는 적절한 포맷(md/csv/html/xlsx)으로 저장. 필요시 HTML 변환으로 보고 가독성 ↑
- **불확실성 명시**: 모수 부족·관측 기간 한계 등 caveat은 결과 보고 시 명시
- **인사이트에 열린 자세**: 기존 결론에 얽매이지 않고 새로운 발견·해석에 열려 있을 것

### ⚠ 자동 진행 금지 — 토큰·시간 소모 큰 작업

사용자가 **단순 질문·확인을 했을 때 멋대로 후속 작업을 진행하지 말 것.**

- 질문엔 **질문에만** 답할 것. "X 있지 않아?" → 있는지 확인하고 답만. SQL 돌리고 표 만들고 HTML 재생성까지 하지 말 것
- 추가 작업이 필요해 보이면 **"이렇게 할 수 있는데 진행할까?"로 먼저 물을 것**. 추천·제안은 OK, 자동 실행은 NO
- "다시 생각해보니 이렇게 할 수 있겠네, 진행할게" 패턴 금지. 그냥 대화로 의견 교환 → 사용자 확인 → 그 다음 실행
- 특히 다음 작업은 사용자 명시 요청 없이 시작하지 말 것:
  - 대규모 SQL 쿼리 (특히 새 metric 계산·전수 집계)
  - 파일 대량 생성·재생성 (CSV·HTML·md 여러 개)
  - 대시보드 수정
  - 새 분석 파이프라인 구축

사용자 통제권 우선. 효율적인 협업이 자동 실행보다 중요.

---

작업 시작하실 때 사용자 요청을 듣고, 위 자료·인프라를 활용해 적절히 진행하시면 됩니다.
