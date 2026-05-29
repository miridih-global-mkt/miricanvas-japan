# CRM Phase 01 — 메일 캠페인 성과분석 (완료)

---

## 프로젝트 개요

**목적**: 일본 신규 가입자의 가입 직후 이탈을 줄이고 진성고객으로 전환.  
**진성고객 정의**: 템플릿 생성 + 편집 두 경험을 모두 한 유저 (잔존율·NPS 압도적 차이).

**성과 측정 두 축**

| 축 | 측정 윈도우 | 의미 |
|---|---|---|
| **활성효과** | 발송 후 72~168시간 | 메일이 즉각적인 활성 행동(로그인·디자인 생성)을 이끌었나 |
| **안착효과** | 가입 후 30~60일 | 메일이 장기 잔존에 기여했나 (M1 복합지표 기반) |

등급 기준: 둘 다 긍정 = A, 안착만 = B, 활성만 = C, 역효과 = D/E.

**세그먼트**: 가입 시 설문으로 분류된 7개 유저 유형.

| 세그먼트 | 의미 |
|---|---|
| NULL | 설문 미응답 (가장 큰 모수) |
| STUDENT | 학생 |
| COMPANY | 기업 재직자 |
| INDIVIDUAL | 개인 프리랜서 |
| EDUCATION | 교육 종사자 |
| BUSINESS | 사업자 |
| INSTITUTION | 기관 종사자 |

---

## 실험 캠페인 목록

| 캔버스 | 형태 | 내용 | 발송 시작 |
|---|---|---|---|
| JA1 | 단발 A/B/N, 4종 | 이전 시즌 온보딩 | 2026-04-09 |
| EN1 | 단발 1종 | 영문 웰컴 메일 | 2026-04-09~ |
| D1 | 단발 A/B/N, 6종 | 소구점별 단발 테스트 1차 | 2026-04-22 |
| D2 | 단발 A/B/N, 5종 | 소구점별 단발 테스트 2차 | 2026-04-23 |
| JAS | 8통 시퀀스 | 온보딩 시리즈 (순차 발송) | 2026-04-22~05-06 |
| EDU | 3통 시퀀스 | 교육 특화 시리즈 | 2026-04-27~05-01 |

모든 캠페인 ~20% 무작위 통제군(holdout) 포함.

---

## 분석 방법론 발전 히스토리

**활성효과 파이프라인**

| 버전 | 방식 | 폐기 이유 |
|---|---|---|
| v1 코호트분석 | 코호트 단위 집계 | 통제군 모수 너무 작아 오류 |
| Databricks SQL | SQL 집계 방식 | 유저 단위 무작위 배정 미반영 |
| v6 Welch 전용 | Welch z-test만 | 이상치(헤비유저) 영향 보정 없음 |
| **v7 (현행)** | Welch z + 상위 1% 이상치 보정 | — |

> **Welch z**: 처리군(메일 받은 유저) vs 통제군의 평균 차이를 통계적으로 검증.  
> z값이 클수록 효과가 크고 우연이 아닐 가능성 높음.

**안착효과 분석**

| 버전 | 방식 | 변화 |
|---|---|---|
| v1 | 로그인 지표만 | "D2가 안착 핵심" → 오류 |
| v2 | 로그인 + 다운로드 추가 | D2 효과 약화 |
| **v3 (현행)** | M1 복합지표 (가입 30~60일 잔존·빈도·디자인 생성 등 7개 종합) | KPI composite 확정. BW1 다운로드가 M1의 가장 강한 선행지표(lift +57%p) |

→ **메일의 역할**: 즉각 활성화 유도 + 안착 보조. 진성고객 직접 전환의 원인은 아님.

---

## 핵심 발견

### JAS 시퀀스의 압도적 우위

7개 세그먼트 중 6개에서 모든 단발 캠페인을 합친 것보다 강력.

| 세그먼트 | JAS 활성효과(z 범위) | 차위 단발 최고 |
|---|---|---|
| STUDENT | +19~+32 | D2 data_table +6 |
| BUSINESS | +19~+32 | D2 font +11 |
| NULL | +19~+27 | EN1 +5 |
| COMPANY | +3~+16 | D2 image_bgremove +13 |
| INDIVIDUAL | +1~+10 (약함) | D1 4step_simplify +19 (활성효과만) |
| INSTITUTION | 0 (효과 없음) | D1 aip_empathy +14 |

JAS 8통 안에서 메일별 콘텐츠 차이는 작음 — 시퀀스 누적 자체가 효과의 핵심.

### 세그먼트 분리 필수 — 같은 메일이 반대 효과

| 메일 | 양효과 | 역효과 |
|---|---|---|
| D1 aip_curiosity | BUSINESS +32 | COMPANY -32, STUDENT -52 |
| D2 data_graph | STUDENT +39 | INDIVIDUAL -38, EDUCATION -31 |
| D2 font | BUSINESS +25 | COMPANY -29 |
| D2 image_bgremove | BUSINESS +20 | INDIVIDUAL -29 |

### EDUCATION 역설

- 활성효과: EDU 시리즈 역효과(-8)
- 안착효과: EDU 시리즈 B등급 (M1 리텐션 긍정)
- 원인: 콘텐츠가 비즈니스 자료 중심 → 교육 use case 미스매치. 교육자는 즉각 활성화 없이 천천히 안착.

### 단발 캠페인 금지 목록

| 세그먼트 | 보내지 말 것 |
|---|---|
| STUDENT | D1 전 5종, D2 image_bgremove |
| COMPANY | D1 전종, D2 data_table, D2 font |
| INDIVIDUAL | D2 image_bgremove, D2 data_graph |
| EDUCATION | D2 data_graph, D2 data_table, D2 image_bgremove |
| NULL | D1 aip_curiosity |

---

## 폴더 구조

| 폴더 | 내용 | 핵심 파일 |
|---|---|---|
| `00_기초_메트릭선정+파이프라인/` | 메트릭 22개 평가 → v7 파이프라인 설계 | `01_메트릭선정_22개평가_2레이어설계.md` |
| `00_기초_파이프라인_산출물/` | 분석 원본 산출물 | `파이프라인_최종결과.csv` (L2_v7, 7,611행) |
| `00_기초_대시보드_백업/` | Databricks Lakeview JSON 백업 | — |
| `01_활성효과_캠페인셀x세그먼트_발송후168h/` | v7 z-rank · 캠페인×cell×세그먼트 | `성과시각화_세그먼트별_v7활성지표.html` |
| `02_안착효과_M1리텐션_가입후30-60일/` | KPI v3.2 · 코호트 57,344명 | `종합보고서_v3_9proxy×7안착후보_메트릭트리.md` |
| `03_시퀀스효과_JAS누적발송_셀x세그먼트/` | JAS 8통 누적효과 분석 | `분석요약_v2_셀x세그먼트_z점수.md` |

---

## 인프라 정보

| 항목 | 값 |
|---|---|
| Databricks Workspace | `https://miridih-workspace.cloud.databricks.com` |
| 기본 데이터 테이블 | `temp.ejjeong_temp.crm_global_new` |
| 기본 대시보드 ID | `01f13a75c0881fa29fa2b55eaf3e00af` |
| SQL Warehouse ID | `f851823d32e682bc` (COMMON_USE_SQL_CLUSTER) |
| CLI 인증 | `databricks --profile DEFAULT` |

테이블 상세: `00_기초_메트릭선정+파이프라인/테이블정보_Braze.md` · `테이블정보_Databricks.md`

### SQL 실행 템플릿

```powershell
function Run-SQL($sql) {
  $tok = (databricks auth token --profile DEFAULT | ConvertFrom-Json).access_token
  $body = @{warehouse_id='f851823d32e682bc';statement=$sql;wait_timeout='50s'} | ConvertTo-Json -Depth 10
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $r = Invoke-RestMethod -Uri 'https://miridih-workspace.cloud.databricks.com/api/2.0/sql/statements' `
    -Method POST -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body $bytes
  $sid = $r.statement_id
  while ($r.status.state -in 'PENDING','RUNNING') {
    Start-Sleep 3
    $r = Invoke-RestMethod -Uri "https://miridih-workspace.cloud.databricks.com/api/2.0/sql/statements/$sid" `
      -Headers @{Authorization="Bearer $tok"}
  }
  return $r
}
```

---

## 핵심 쿼리 조각

**일본 가입자 cohort (M1 측정 가능 기간)**
```sql
SELECT account_id, p_date AS signup_date
FROM gold.miricanvas_global.v_user_info
WHERE country = 'Japan' AND p_date BETWEEN '2026-01-01' AND '2026-03-22'
```

**Retention 윈도우 (W0/W1/BW1/M0/M1)**
```sql
-- W0=+1~+6  W1=+7~+13  BW1=+14~+27  M0=+1~+29  M1=+30~+59
-- retain(리테인AU) = M0=1 AND M1=1
LEFT JOIN gold.miricanvas_global.v_valid_login b
  ON TRY_CAST(c.account_id AS STRING) = b.account_id
  AND b.event_date BETWEEN date_add(c.signup_date,1) AND date_add(c.signup_date,59)
```

**캠페인 audience 라벨링**
```sql
SELECT external_user_id,
  MAX(CASE WHEN canvas_name LIKE '%JA260407%'   THEN 1 ELSE 0 END) in_ja1,
  MAX(CASE WHEN canvas_name LIKE '%D1JA260417%' THEN 1 ELSE 0 END) in_d1,
  MAX(CASE WHEN canvas_name LIKE '%D2JA260417%' THEN 1 ELSE 0 END) in_d2,
  MAX(CASE WHEN canvas_name LIKE '%JA260417%'
        AND canvas_name NOT LIKE '%D1JA260417%'
        AND canvas_name NOT LIKE '%D2JA260417%'  THEN 1 ELSE 0 END) in_jas,
  MAX(CASE WHEN canvas_name LIKE '%JA260427%'   THEN 1 ELSE 0 END) in_edu
FROM temp.ejjeong_temp.crm_global_new
WHERE canvas_name RLIKE 'JA260407|D1JA260417|D2JA260417|JA260417|JA260427'
GROUP BY external_user_id
```

---

## 메트릭 set (v7)

파이프라인: `00_기초_파이프라인_산출물/_scripts/_crm_pipeline_v7.ps1`  
방법: Welch two-sample z + 9개 metric 상위 1% 이상치 보정 (DPU·Stickiness·LPU_total)

| Tier | 개수 | 메트릭 |
|---|---|---|
| ⭐⭐⭐ 최중요 | 2 | Stickiness_72h · LPU24h |
| ⭐⭐ 코어 | 6 | +LPU72h · L72h_ge2 · DPU24h · LDeep168h |
| ⭐ compact | 11 | +LPU168h · L168h_ge3 · LRate168h · DPU72h · LRateReturn |

상세: `00_기초_메트릭선정+파이프라인/03_메트릭랭킹테이블_v7.md`

---

## PowerShell 주의사항

- **한글·특수문자 경로**: `Get-Content` 등엔 `-LiteralPath` 필수. 대안: `[System.IO.File]::ReadAllText()`
- **`[기초]` 등 대괄호 포함 경로**: `-LiteralPath` 없으면 wildcard로 해석되어 실패
- **`$pid`**: 시스템 예약 변수 → `$pageId` 등으로 대체
- **스크립트 실행**: `.ps1` 직접 실행 불가 → `Invoke-Expression ([System.IO.File]::ReadAllText('path.ps1'))`
- **CSV Excel용**: UTF-8 with BOM → `New-Object System.Text.UTF8Encoding($true)`

---

## 작업 원칙

- **단순 질문엔 질문만 답할 것** — SQL 돌리고 HTML 재생성까지 자동으로 하지 말 것
- **추가 작업은 먼저 물어볼 것** — 제안 후 확인받고 진행
- **불확실성 명시** — 모수 부족·관측 기간 한계 등은 caveat으로 명시
- **큰 변경 전 컨펌** — 대시보드 수정·파일 대량 변경 등
