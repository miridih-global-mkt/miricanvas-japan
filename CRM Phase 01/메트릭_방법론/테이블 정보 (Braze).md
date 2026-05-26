# 테이블 정보 — Braze (`bronze.braze_miricanvas`)

> 스키마: `bronze.braze_miricanvas`  
> 용도: Braze에서 S3로 export된 캠페인 이벤트 로그. CRM 성과측정의 핵심 source.

---

## 핵심 테이블

### `users_canvas_experimentstep_splitentry` — 캔버스 실험 분기 진입 로그

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `external_user_id` | string | 미리캔버스 account_id (string 타입) |
| `user_id` | string | Braze 내부 user_id |
| `canvas_name` | string | 캔버스명 |
| `experiment_split_name` | string | 실험 분기명 (발송 스텝명과 일치하면 최종 분기) |
| `in_control_group` | boolean | TRUE = 통제군, FALSE = 처리군 |
| `time` | bigint | 분기 진입 시각 (Unix timestamp) → `FROM_UNIXTIME(time)` |
| `p_date` | string | 파티션 (필수 필터) |

**주요 패턴:**
- 통제군 추출: `WHERE in_control_group IS TRUE`
- 처리군 최종 분기 판정: `users_messages_email_send`의 `canvas_step_name`과 `experiment_split_name` 일치 여부로 확인
- 캔버스 필터: `canvas_name RLIKE '(?i)global'` (대소문자 무시)

---

### `users_messages_email_send` — 이메일 발송 로그

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `external_user_id` | string | 미리캔버스 account_id |
| `user_id` | string | Braze 내부 user_id |
| `dispatch_id` | string | 발송 단위 ID (open/click JOIN 키) |
| `email_address` | string | 수신자 이메일 주소 |
| `canvas_name` | string | 캔버스명 |
| `canvas_step_name` | string | 발송 스텝명 |
| `time` | bigint | 발송 시각 (Unix timestamp) |
| `p_date` | string | 파티션 (필수 필터) |

> ⚠ **이메일로 account_id 역조회 불가**: `email_address`는 발송 기록이 있는 유저에만 존재. 내부 직원처럼 캠페인을 받은 적 없는 유저는 조회 안 됨.

---

### `users_messages_email_open` — 이메일 오픈 로그

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `user_id` | string | Braze 내부 user_id |
| `dispatch_id` | string | `email_send`와 JOIN 키 |
| `time` | bigint | 오픈 시각 (Unix timestamp) |
| `p_date` | string | 파티션 |

**JOIN 패턴:**
```sql
LEFT JOIN (
    SELECT user_id, dispatch_id, MIN(time) AS time
    FROM bronze.braze_miricanvas.users_messages_email_open
    WHERE p_date >= '2026-02-05'
    GROUP BY 1, 2
) o ON s.user_id = o.user_id AND s.dispatch_id = o.dispatch_id
```

---

### `users_messages_email_click` — 이메일 클릭 로그

`email_open`과 동일한 구조. `dispatch_id`로 `email_send`와 JOIN.

---

### `users_canvas_entry` — 캔버스 진입 로그

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `external_user_id` | string | 미리캔버스 account_id |
| `user_id` | string | Braze 내부 user_id |
| `canvas_name` | string | 캔버스명 |
| `canvas_step_name` | string | 진입 스텝명 |
| `in_control_group` | boolean | 통제군 여부 |
| `time` | bigint | 진입 시각 (Unix timestamp) |
| `p_date` | string | 파티션 |

> `experimentstep_splitentry`와 달리 `experiment_split_name` 없음. 실험 분기 분석엔 splitentry 사용.

---

## 그 외 테이블 (참고)

| 테이블 | 용도 |
|---|---|
| `users_messages_email_bounce` | 반송 로그 |
| `users_messages_email_unsubscribe` | 수신거부 로그 |
| `users_messages_email_delivery` | 전달 확인 로그 |
| `users_campaigns_conversion` | 캠페인 전환 로그 |
| `users_behaviors_subscription_globalstatechange` | 구독 상태 변경 로그 |

---

## 공통 주의사항

- **파티션 필터 필수**: 모든 테이블에 `p_date` 파티션. `WHERE p_date >= 'YYYY-MM-DD'` 없으면 전체 스캔으로 느려짐
- **time 컬럼**: Unix timestamp (bigint) → `FROM_UNIXTIME(time)` 또는 `CAST(time AS TIMESTAMP)` 변환 필요
- **external_user_id vs user_id**: `external_user_id`가 미리캔버스 account_id. `user_id`는 Braze 내부 ID
- **이메일 조회**: 이메일→account_id 역조회는 Braze 발송 기록 있는 유저만 가능. 내부 직원 등 캠페인 미수신자는 **Braze 대시보드 Audience > Search Users** 에서 직접 확인
