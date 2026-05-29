# 테이블 정보 — Databricks (미리캔버스 자체 데이터)

> 스키마: `bronze.miridih_miricanvas`, `silver.miricanvas_*`, `gold.miridih_analytics`, `gold.miricanvas_global`  
> Braze 테이블은 → `테이블 정보 (Braze).md` 참고

---

## 유저 기본 정보

### `bronze.miridih_miricanvas.account` — 계정 마스터

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | int | account_id (미리캔버스 유저 고유 ID) |
| `email` | string | 이메일 주소 (**column mask 적용** — SELECT 시 `***@domain.com` 으로 마스킹됨) |
| `name` | string | 이름 |
| `grade` | string | 등급 |
| `status` | string | 계정 상태 |
| `sign_up_date_tz` | string | 가입 일시 (timezone 포함 문자열) → `TO_DATE(sign_up_date_tz)` |

> ⚠ **email 컬럼 마스킹**: SELECT에서 `***@domain.com`으로 표시되지만 WHERE 조건은 실제 값으로 작동. 특정 이메일로 WHERE를 걸어도 0건이 나오면 그 이메일로 가입된 계정이 없는 것.

---

### `gold.miridih_analytics.mican_user_info_hst` — 유저 정보 이력 (스냅샷)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | bigint | 유저 ID |
| `p_date` | date | 파티션 (매일 스냅샷) |
| `country` | string | 국가 (`'JP'` = 일본) |
| `language_setting` | string | 언어 설정 (`'ja'` = 일본어) |
| `main_user_type` | string | 주 유저타입 (설문 미응답 시 NULL) |
| `sub_user_type` | string | 부 유저타입 |
| `purpose` | array\<string\> | 사용 목적 |
| `company_size` | string | 회사 규모 |
| `gender` | string | 성별 |

**최신 스냅샷 조회 패턴:**
```sql
WHERE p_date = (SELECT MAX(p_date) FROM gold.miridih_analytics.mican_user_info_hst)
```

---

### `gold.miridih_analytics.mican_sign_up_session_ga_hst` — 가입 세션 GA 이력

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | int | 유저 ID |
| `p_date` | date | 파티션 (가입일 기준) |
| `be_sign_up_timestamp_kst` | timestamp | 가입 시각 (KST) |
| `country` | string | 국가 (`'Japan'` = 일본) |
| `language` | string | 언어 |
| `utm_source/medium/campaign/content/term` | string | UTM 파라미터 |
| `page_referrer` | string | 가입 직전 referrer |

**일본 유저 cohort 정의 패턴:**
```sql
FROM bronze.miridih_miricanvas.account a
LEFT JOIN gold.miridih_analytics.mican_sign_up_session_ga_hst s ON a.id = s.account_id
WHERE s.country = 'Japan'
  AND TO_DATE(a.sign_up_date_tz) BETWEEN DATE('2026-01-01') AND DATE('2026-01-31')
```

---

### `gold.miridih_analytics.mican_pre_sign_up_session_abr_hst` — 가입 전 세션 (Airbridge)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | - | 유저 ID |
| `session_id` | string | 세션 ID |
| `campaign_id_final` | string | 광고 캠페인 ID |
| `channel_final` | string | 유입 채널 (google/meta/yahoo/a8 등) |
| `is_signup_session` | string | 가입 세션 여부 (`'Y'` 필터 필수) |
| `be_signup_time` | timestamp | 가입 시각 |
| `device_type` | string | 기기 유형 |
| `campaign` | string | 캠페인명 |

---

### `gold.miridih_analytics.mican_ad_entity_id_map` — 광고 캠페인 ID→명칭 매핑

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `campaign_id` | string | 광고 캠페인 ID |
| `campaign_name` | string | 캠페인 표시명 |
| `max_date` / `min_date` | - | 데이터 유효 기간 |

**중복 제거 패턴 (최신 기준 1개만):**
```sql
QUALIFY ROW_NUMBER() OVER (PARTITION BY campaign_id ORDER BY max_date DESC, min_date DESC) = 1
```

---

### `gold.miridih_analytics.mican_design_action_daily_stats_hst` — 유저 일별 액티비티 집계

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | - | 유저 ID |
| `p_date` | date | 파티션 (액티비티 발생일) |
| `signup_date` | date | 가입일 |
| `country` | string | 국가 |
| `language_setting` | string | 언어 |
| `login_retention_type` | string | 리텐션 유형 (`'retain'` = 리테인 유저) |

---

## 로그인 로그

### `silver.miricanvas_user.login_micandb` — 로그인 로그 (상세)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | int | 유저 ID |
| `requested_time` | string/timestamp | 로그인 요청 시각 |
| `p_date` | date | 파티션 |

**send_time 기준 로그인일수 측정 패턴 (CRM 성과분석):**
```sql
LEFT JOIN silver.miricanvas_user.login_micandb l
  ON a.external_user_id = CAST(l.account_id AS STRING)
  AND l.p_date >= TO_DATE(a.send_time)
  AND CAST(l.requested_time AS TIMESTAMP) >= a.send_time
```

---

### `gold.miridih_analytics.mican_loginsession_ga_hst` — GA 로그인 세션

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | - | 유저 ID |
| `user_pseudo_id` | string | GA 익명 ID (가입경로 추적에 사용) |

---

### `silver.miricanvas_user.all_events_global` — GA 이벤트 로그 (전체)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `user_pseudo_id` | string | GA 익명 ID |
| `event_time` | timestamp | 이벤트 발생 시각 (UTC) → `FROM_UTC_TIMESTAMP(event_time, 'Asia/Seoul')` |
| `event_name` | string | 이벤트명 |
| `page_location` | string | 이벤트 발생 URL |
| `label1` | string | 이벤트 레이블1 (예: `'회원가입팝업'`) |
| `action1` / `action2` | string | 이벤트 액션 |
| `location1` / `location2` / `location4` | string | 위치 정보 |

**가입 직전 이벤트 필터 패턴:**
```sql
WHERE (event_name = 'generic_event_mican' AND label1 IN ('회원가입팝업','로그인팝업'))
   OR (event_name = 'ma_sign_up' AND location1 = '회원가입' AND action1 = '완료')
```

---

## 디자인 관련

### `silver.miricanvas_design.design_version_union` — 디자인 생성 이벤트 (1.0+2.0 통합)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | string | 유저 ID |
| `design_id` | string | 디자인 ID (2.0 기준) |
| `design_created_date_tz` | timestamp | 생성 시각 (timezone 포함) |
| `p_created_date` | date | 파티션 (생성일) |
| `template_key` | string | 사용한 템플릿 KEY |
| `template_type_id` | string | 템플릿 타입 (예: `'presentation'`) |
| `width` / `height` | int | 디자인 크기 |
| `page_id` | string | 페이지 ID |

---

### `bronze.miridih_miricanvas.design_history_v2` — 캔버스 1.0 편집 로그

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | int | 유저 ID |
| `design_idx` | int | 1.0 디자인 인덱스 (2.0의 design_id와 다름) |
| `created_date_tz` | string | 편집 시각 (timezone 포함) → `DATE(created_date_tz)` |
| `page_idx_list` | string | 편집된 페이지 인덱스 목록 (comma-separated) |

> ⚠ `design_idx`(1.0) ↔ `design_id`(2.0) 변환은 `bronze.miridih_miricanvas.design_v2_map` 필요

---

### `silver.miricanvas_design.history_major_version` — 캔버스 2.0 편집 로그

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | - | 유저 ID |
| `design_id` | string | 2.0 디자인 ID |
| `p_created_date` | date | 파티션 (편집일) |

---

### `silver.miricanvas_design.download_event_version_union` — 다운로드 이벤트

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | mixed | 유저 ID (타입 혼재 → `CAST(account_id AS STRING)`) |
| `design_id` | string | 디자인 ID |
| `download_idx` | string | 다운로드 단위 ID |
| `p_created_date` | date | 파티션 |

---

### `silver.miricanvas_design.download_page_version_union` — 다운로드 페이지 단위

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `download_event_idx` | - | `download_event_version_union`의 `download_idx`와 JOIN |
| `design_id` | string | 디자인 ID |
| `template_key` | string | 다운로드 시 사용한 템플릿 KEY |

---

### `bronze.miridih_miricanvas.design_v2_map` — 1.0↔2.0 디자인 ID 매핑

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `design_idx` | string | 캔버스 1.0 design_idx |
| `design_id` | string | 캔버스 2.0 design_id |

---

## 템플릿 · AIP

### `gold.miridih_analytics.mican_template_tier_mst` — 템플릿 정보 마스터

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `template_idx` | string | 템플릿 IDX (= design_version_union의 template_key) |
| `category` | string | 템플릿 카테고리 (프레젠테이션/웹 포스터/인스타그램 등) |
| `purpose` | string | 목적 (`'WEB'` 필터 권장) |

**디자인 유형 분류 패턴:**
```sql
CASE
  WHEN aip.design_id IS NOT NULL                        THEN 'aip'
  WHEN c.category IN ('프레젠테이션','프레젠테이션 4:3','자기소개') THEN 'web_ppt'
  WHEN c.category IN ('웹 포스터','웹 배너','카드뉴스')       THEN 'web_contents'
  WHEN c.category IN ('소셜 미디어 정사각형','인스타그램','유튜브') THEN 'web_sns'
  WHEN c.category IS NOT NULL                          THEN 'web_other'
  ELSE 'etc'
END AS lable
```

---

### `bronze.miridih_miricanvas.ai_presentation_design_statistics` — AIP 생성 통계

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `design_idx` | string | 1.0 design_idx (→ design_v2_map으로 2.0 ID 변환 필요) |
| `account_id` | - | 유저 ID |
| `created_date_tz` | string | AIP 생성 시각 |

---

### `bronze.miridih_miricanvas.ai_async_content_generation` — AIP 비동기 생성

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | - | 유저 ID |
| `created_date_tz` | string | 생성 시각 |
| `status` | string | `'COMPLETE'` 필터 필수 |
| `type` | string | `'PRESENTATION_CONTENT'` 필터 필수 |

**AIP design_id 판정 패턴** (stats + async 통합):
```sql
-- stats 기반
SELECT DISTINCT j.account_id, j.design_id
FROM bronze.miridih_miricanvas.ai_presentation_design_statistics s
LEFT JOIN bronze.miridih_miricanvas.design_v2_map m ON CAST(s.design_idx AS STRING) = CAST(m.design_idx AS STRING)
INNER JOIN japan_design j ON j.design_id = COALESCE(m.design_id, CAST(s.design_idx AS STRING))

UNION

-- async 기반 (template 없고, 1920×1080 presentation 타입인 것)
SELECT DISTINCT j.account_id, j.design_id
FROM bronze.miridih_miricanvas.ai_async_content_generation c
INNER JOIN japan_design j ON j.account_id = c.account_id
  AND j.p_created_date = DATE(FROM_UTC_TIMESTAMP(c.created_date_tz, 'Asia/Seoul'))
WHERE c.status = 'COMPLETE' AND c.type = 'PRESENTATION_CONTENT'
  AND j.template_key IS NULL AND j.width = 1920 AND j.height = 1080
  AND j.template_type_id = 'presentation'
```

---

## 결제 · 쿠폰

### `bronze.miridih_miricanvas.payment_orders` — 결제 주문

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | - | 유저 ID |
| `order_idx` | - | 주문 인덱스 |
| `order_status` | string | 주문 상태 (`'ORDER_COMPLETE'` 필터) |
| `order_type` | string | 주문 유형 (`'PLAN'` 필터) |
| `order_amount` | - | 결제 금액 (`> 0` 필터) |
| `currency` | string | 통화 (`'JPY'` = 일본) |
| `start_date_tz` / `end_date_tz` | string | 플랜 시작/종료 일시 |

**유료 이용일수 계산:**
```sql
SUM(DATEDIFF(
  DATE(FROM_UTC_TIMESTAMP(end_date_tz, 'Asia/Seoul')),
  DATE(FROM_UTC_TIMESTAMP(start_date_tz, 'Asia/Seoul'))
)) AS payment_days
```

---

### `bronze.miridih_miricanvas.issued_coupons` — 발급 쿠폰

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | - | 유저 ID |
| `used_at_tz` | string | 쿠폰 사용 시각 (NULL이면 미사용) |
| `ended_at_tz` | string | 쿠폰 만료 시각 |

---

## KPI · 집계 지표

### `gold.miricanvas_global.v_user_info` — 글로벌 가입자 view

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | int | 유저 ID |
| `p_date` | date | 가입일 (파티션) |
| `country` | string | 국가 |
| `medium` / `channel` / `campaign_name` | string | 유입 경로 |
| `device_type` | string | 기기 유형 |

> 2023-01부터 데이터 존재. M1 retention 측정 기준 cohort로 주로 사용.

---

### `gold.miricanvas_global.v_valid_login` — 글로벌 로그인 이벤트

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `account_id` | string | 유저 ID |
| `event_date` | date | 로그인 날짜 |

> M1 retention 산출 source. AARRR Summary 대시보드 기준.

---

### `gold.miridih_analytics.mican_au_ex_miricle_agg` — MAU/리테인 AU 집계

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `event_date` | date | 날짜 |
| `country` | string | 국가 |
| `mau` | int | MAU |
| `new` | int | 신규 유저 수 |
| `retain` | int | 리테인 AU (M0+M1 모두 로그인) |
| `return` | int | 복귀 유저 수 |

> 사용자 KPI "리테인 AU" = `retain` 컬럼

---

## 공통 주의사항

- **account_id 타입 혼재**: 테이블마다 int/bigint/string 다름. JOIN 시 `CAST(account_id AS STRING)` 또는 `TRY_CAST` 사용
- **캔버스 1.0 vs 2.0**: design_idx(1.0) ↔ design_id(2.0) 별도 관리. 통합 시 `design_v2_map` 경유
- **timezone**: DB 저장은 UTC 기준이 많음. 한국/일본 시간 표시 시 `FROM_UTC_TIMESTAMP(col, 'Asia/Seoul')`
- **파티션 필터**: `p_date`, `p_created_date` 등 파티션 컬럼 필터 없으면 전체 스캔
- **CRM 마트 테이블**: `temp.ejjeong_temp.crm_global_new` — 위 테이블들을 전처리해서 CRM 분석용으로 결합한 최종 마트. 컬럼 상세는 `CLAUDE.md` 참고
