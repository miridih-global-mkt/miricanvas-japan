# 온보딩 시퀀스 효과 분석 v2 (cell × user_type)

**분석 일자**: 2026-05-20
**v1과 차이**: v1은 user-cohort 단위 평균으로 메일별 효과를 묶었음 → 메일 사이 효과 천차만별이 묻혀 잘못된 결론 도출. v2는 v7 L2 cell × user_type × z 결과 직접 활용. v1은 `_archive_v1_cohort잘못된분석/`로 격리.

## 데이터 소스

`[기초] 파이프라인_산출물/L2_v7_results.csv` (7611 row) 직접 사용. v7 파이프라인은 cell 단위 처리/통제 비교 z 산출했으므로 그게 정확.

핵심 metric: LPU168h (1주일 활성일수, 시퀀스 효과 측정에 적합한 윈도우).

## user_type별 cell ranking (LPU168 z)

전체 결과: `1_cell_x_user_type_z_v2.csv` (1190 row, 7 metric × 5 canvas × 7 user_type × cell들).

### 핵심 매트릭스 — 각 user_type에서 양/음 cell

(z>+2 = 양의 유의, z<-2 = 음의 유의)

| user_type | 양의 유의 cell (TOP) | 음의 유의 cell (BOTTOM) |
|---|---|---|
| **STUDENT** | JAS 8 step 모두 (z=+2.7~+3.0) | D1 review_number (z=-2.47), aip_empathy (-2.21), aip_curiosity (-1.78), 거의 D1 전부 음 |
| **BUSINESS** | JAS 8 step 모두 (+2.67~+3.09), D1 aip_curiosity (+2.21) | (없음) |
| **EDUCATION** | D2 font (+2.12), JAS 8 step (+1.34~+1.70, 양의 유의 근접) | JA1 review (-1.57), JA1 aip (-1.17) |
| **INDIVIDUAL** | JAS 8 step (+1.03~+1.79, 약함) | **JA1 4step (-2.03)** |
| **COMPANY** | JAS 8 step (+1.81~+2.60) | (없음, JA1 free 약한 음 -1.46) |
| **INSTITUTION** | D1 aip_empathy (+1.78), 다른 D1 (+1.21~+1.43) | (없음) |
| **NULL (미설문)** | JAS 8 step (+2.41~+3.37) | (없음) |

### JAS 8 step 안에서 cell 차이 — 거의 없음

각 user_type에서 JAS 8 step의 z range가 모두 좁다 (0.3 이내). 어느 step 받아도 비슷한 효과.

→ **시퀀스 누적 효과가 메인**. cell 콘텐츠 (4step·aip·font·bgremove·table·graph·templatemix·bookmark) 차이는 작음.

### EDU_SERIES (3 step) 의외 발견 — 약함

EDUCATION user_type에 대한 EDU_SERIES z=−0.01~+0.37 (거의 무효). 같은 EDUCATION에 D2 font 단발은 z=+2.12 양의 유의. 즉 **education user_type을 위해 만든 EDU_SERIES가 D2 font 한 통보다 효과 약함**.

## 5가지 인사이트 (정정 포함)

1. **JAS 8 step 시퀀스가 가장 강력한 캠페인**.
   거의 모든 user_type에 LPU168 양 (STUDENT·BUSINESS·NULL z>+2.4, COMPANY +1.8~+2.6, EDUCATION +1.3~+1.7, INDIVIDUAL +1.0~+1.8). 단 INSTITUTION만 약함 (0.05~0.88).

2. **시퀀스 길이가 진짜 driver. cell 콘텐츠는 부차적.**
   JAS 안에서 8 cell의 z 차이가 0.3 미만. 콘텐츠 mix·소구점이 큰 변수가 아님. **충분히 긴 시퀀스 자체가 효과**.

3. **D1·D2는 audience selective.**
   - STUDENT엔 D1 모든 cell 음 (-1.5~-2.5)
   - INSTITUTION엔 D1 단발 양 (+1.2~+1.8)
   - EDUCATION엔 D2 font만 단독 양 (+2.12)
   - BUSINESS엔 D1 aip_curiosity (+2.21)
   - 그 외 거의 0
   → 일괄 발송 NO. user_type filter 필수.

4. **JA1 (이전 시즌 단발)은 거의 효과 없음 또는 음.**
   가장 양인 cell도 z=+1.26 (BUSINESS의 review). 대부분 0 또는 약한 음. INDIVIDUAL엔 4step이 z=-2.03 (음의 유의). **JA1 디자인 폐기 권장**.

5. **EDU_SERIES (3 step) 재설계 또는 폐기 권장.**
   EDUCATION에 z=0~+0.4, 같은 EDUCATION에 D2 font 단발이 z=+2.12. 3 step짜리 짧은 시퀀스 + 콘텐츠 한계로 효과 거의 없음.

## v1 잘못된 결론 정정

| v1 결론 | 정정 (v2 cell-level) |
|---|---|
| "COMPANY는 모든 메일에 음" | **틀림**. COMPANY × JAS 8 step 모두 z=+1.81~+2.60 (양의 유의) |
| "BUSINESS는 일관 양" | OK (양). 단 모든 cell이 아니라 JAS+D1 aip_curiosity |
| "STUDENT는 양" | OK이긴 한데 D1은 음 (-1.5~-2.5). 메일 가려서 |
| "EDU 분석 불가" | EDU_SERIES는 효과 약함이 명확. D2 font가 EDUCATION엔 더 좋음 |
| "JA1 LPU168 음의 유의 근접" | OK. 정정 cell-level도 일관 |

v1 cohort 분석에서 baseline을 D1·D2 중복 통제로 좁게 잡은 게 SE 폭주의 원인. v7 framework가 cell 단위 캠페인 holdout 활용해 baseline 안정적.

## 시퀀스 설계 권장안 (다음 시즌)

### 권장 1: JAS 8 step 시퀀스를 메인 채널로

- 거의 모든 user_type에 강한 양의 효과
- 콘텐츠는 현재 cell 그대로 또는 한 두 개 swap (cell 차이 작으므로 콘텐츠 개편 우선순위 낮음)
- holdout 20% 유지

### 권장 2: user_type별 단발 추가 권장

- **STUDENT**: JAS만. D1 보내지 말 것 (음의 효과)
- **BUSINESS**: JAS + D1 aip_curiosity 단발 추가 가능
- **EDUCATION**: JAS + D2 font 단발 추가
- **INSTITUTION**: D1 단발 (특히 aip_empathy) 우선. JAS 약하므로 무리 안 함
- **INDIVIDUAL**: JAS만, 그러나 약하므로 콘텐츠 mix 실험 후보
- **COMPANY**: JAS만
- **NULL**: JAS만 + user_type 설문 응답률 높이는 별도 노력

### 권장 3: 폐기 또는 재설계 후보

- **JA1**: 거의 효과 없음. 다음 시즌 디자인 자원 다른 곳에
- **EDU_SERIES**: 의외로 약함. 폐기 후 EDUCATION을 JAS에 통합 또는 D2 font 단발 + 후속 시퀀스 재설계

### 권장 4: 다음 실험 가설

**가설 A**: "JAS를 12 step으로 늘리면 효과 더 커지나?" 현재 8 step에서 충분히 양인데 dose-response가 plateau인지 확인.
**가설 B**: "user_type 가르고 dedicated 시퀀스 vs 통합 JAS" 어느 게 더 효율적인가.
**가설 C**: "D1·D2 발송 간격 1일 → 2일로 늘리면 JAS와 비슷한 효과?"

## Caveat

- Stickiness_72h은 cell·user_type에 따라 +1.4 ~ -16 큰 변동. 시퀀스 효과 측정에 부적합 가능성 (분모 login_days 증가 영향). v7 metric tier 재평가 후보 ([[pipeline-v7]] 메모에 반영 필요)
- EDU_SERIES audience filter가 csv에 BUSINESS·STUDENT도 일부 포함됨 (n 작음, audience 정의 모호)
- 본 분석은 LPU168 메인. LPU24h⭐ + Stickiness_72h⭐ 두 ⭐⭐⭐ metric 시각도 다를 수 있음. 후속 cross-check 필요
- L2_v7_results.csv는 winsorize 적용된 결과. 일부 metric 분포 제어됨
