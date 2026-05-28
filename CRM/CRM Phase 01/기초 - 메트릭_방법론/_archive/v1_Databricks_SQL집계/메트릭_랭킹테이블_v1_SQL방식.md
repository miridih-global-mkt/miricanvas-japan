# 44개 후보 메트릭 — L1·L2 랭킹 종합 테이블

본 테이블은 메트릭 선정 가이드라인에 따라 L1(캔버스 단위)·L2(캔버스 × user_type 단위)에서 산출된 ranking 결과이다. 종합 점수 = 0.6 × (일관성 ≥ 70% 통과율) + 0.4 × (강신호 통과율).

**⭐ = 최종 선정 핵심 9개 메트릭**

| 순번 | 한국어명 | 영어 ID | 정의 | 카테고리 | L1 순위 | L2 순위 | 코어 9 | 비고 |
|---|---|---|---|---|---|---|---|---|
| 1 | 유저수 | user_count | COUNT(DISTINCT external_user_id) | 모수 | - | - | ⭐ | 모든 cell의 분모. ranking 대상 아님 |
| 2 | 열람률 | open_rate | AVG(is_open='1') | 메일 진단 | (1)* | (1)* | | Treatment 내부 진단용. Control 미수신이라 A/B 무효 |
| 3 | 클릭률 | click_rate | AVG(is_clicked='1') | 메일 진단 | (2)* | (8)* | | Treatment 내부 진단용 |
| 4 | 열람대비클릭률 | open_to_click | SUM(is_clicked='1')/SUM(is_open='1') | 메일 진단 | - | - | | Treatment 내부 진단용 |
| 5 | 로그인비율D1 | LRate24h | AVG(login_24h_yn='1') | 로그인 도달 (binary) | 15 | 7 | | binary는 정보량 적음 |
| 6 | 로그인비율D3 | LRate72h | AVG(login_72h_yn='1') | 로그인 도달 (binary) | 17 | 11 | | |
| 7 | 로그인비율D7 | LRate168h | AVG(login_168h_yn='1') | 로그인 도달 (binary) | 12 | 17 | | |
| 8 | (총)로그인비율 | LRateTotal | AVG(login_total_yn='1') | 로그인 도달 (binary) | 25 | 28 | | 누적 binary는 약함 |
| 9 | 로그인평균일수D1 | LPU24h | AVG(login_days_24h) | 로그인 평균 (raw) | 20 | **2** | | cap 제거 raw |
| 10 | **로그인평균일수D3** | **LPU72h** | AVG(login_days_72h) | 로그인 평균 (raw) | 14 | **3** | ⭐ | L2 매우 강함 |
| 11 | **로그인평균일수D7** | **LPU168h** | AVG(login_days_168h) | 로그인 평균 (raw) | **7** | **4** | ⭐ | Universal champion |
| 12 | **(총)로그인평균일수** | **LPU_total** | AVG(login_days_total) | 로그인 평균 (raw) | **5** | 10 | ⭐ | L1 매우 강, 장기 |
| 13 | **로그인2일이상비율D3** | **L72h_ge2** | AVG(login_days_72h>=2) | 로그인 깊이 | **4** | 5 | ⭐ | Universal strong |
| 14 | 로그인2일이상비율D7 | L168h_ge2 | AVG(login_days_168h>=2) | 로그인 깊이 | 13 | 16 | | |
| 15 | (총)로그인2일이상비율 | L_total_ge2 | AVG(login_days_total>=2) | 로그인 깊이 | 11 | 15 | | |
| 16 | **로그인3일이상비율D7** | **L168h_ge3** | AVG(login_days_168h>=3) | 로그인 깊이 | **3** | 9 | ⭐ | L1 최강 |
| 17 | (총)로그인3일이상비율 | L_total_ge3 | AVG(login_days_total>=3) | 로그인 깊이 | 25 | 18 | | |
| 18 | 디자인비율D1 | DRate24h | AVG(design_24h_yn='1') | 디자인 도달 (binary) | 15 | 26 | | binary 한계 |
| 19 | 디자인비율D3 | DRate72h | AVG(design_72h_yn='1') | 디자인 도달 (binary) | 21 | 19 | | |
| 20 | 디자인비율D7 | DRate168h | AVG(design_168h_yn='1') | 디자인 도달 (binary) | 28 | 38 | | |
| 21 | (총)디자인비율 | DRateTotal | AVG(design_total_yn='1') | 디자인 도달 (binary) | 48 | 31 | | 매우 약함 |
| 22 | 디자인평균개수D1 | DPU24h | AVG(design_count_24h) | 디자인 평균 (raw) | 30 | 30 | | |
| 23 | **디자인평균개수D3** | **DPU72h** | AVG(design_count_72h) | 디자인 평균 (raw) | 26 | **12** | ⭐ | L2 디자인 최강 |
| 24 | **디자인평균개수D7** | **DPU168h** | AVG(design_count_168h) | 디자인 평균 (raw) | 43 | 17 | ⭐ | L2 mid 디자인 |
| 25 | (총)디자인평균개수 | DPU_total | AVG(design_count_total) | 디자인 평균 (raw) | 46 | 42 | | 구 상한DPU(cap 제거) |
| 26 | 디자인복수생성비율D1 | D24h_ge2 | AVG(design_count_24h>=2) | 디자인 깊이 | 18 | 48 | | |
| 27 | 디자인복수생성비율D3 | D72h_ge2 | AVG(design_count_72h>=2) | 디자인 깊이 | 27 | 46 | | |
| 28 | 디자인복수생성비율D7 | D168h_ge2 | AVG(design_count_168h>=2) | 디자인 깊이 | 34 | 25 | | |
| 29 | (총)디자인복수생성비율 | D_total_ge2 | AVG(design_count_total>=2) | 디자인 깊이 | 35 | 33 | | |
| 30 | 디자인3개이상비율D7 | D168h_ge3 | AVG(design_count_168h>=3) | 디자인 깊이 | 25 | 29 | | |
| 31 | (총)디자인3개이상비율 | D_total_ge3 | AVG(design_count_total>=3) | 디자인 깊이 | 45 | 41 | | 구 D>3 원본 |
| 32 | 디자인주간평균도달률 | Activ_AUC | (DRate24h+DRate72h+DRate168h)/3 | 활성화 곡선 | 9 | 43 | | L1 강함, L2 약함 |
| 33 | 로그인&디자인비율D1 | LD24h | AVG(login_24h_yn='1' AND design_24h_yn='1') | 조합 활성 | 16 | 21 | | |
| 34 | 로그인&디자인비율D3 | LD72h | AVG(login_72h_yn='1' AND design_72h_yn='1') | 조합 활성 | 24 | 13 | | |
| 35 | 로그인&디자인비율D7 | LD168h | AVG(login_168h_yn='1' AND design_168h_yn='1') | 조합 활성 | 37 | 36 | | |
| 36 | (총)로그인&디자인비율 | LD_total | AVG(login_total_yn='1' AND design_total_yn='1') | 조합 활성 | 47 | 34 | | |
| 37 | 로그인2&디자인2비율D7 | LDeep168h | AVG(login_days_168h>=2 AND design_count_168h>=2) | 조합 활성 (deep) | 10 | 35 | | L1 강함 |
| 38 | (총)로그인2&디자인2비율 | LDeep_total | AVG(login_days_total>=2 AND design_count_total>=2) | 조합 활성 (deep) | 33 | 40 | | |
| 39 | 로그인일당디자인수D1 | Stickiness_24h | SUM(design_count_24h)/SUM(login_days_24h) | 활성 강도 (ratio) | 44 | 50 | | 비율의 비율 |
| 40 | 로그인일당디자인수D3 | Stickiness_72h | SUM(design_count_72h)/SUM(login_days_72h) | 활성 강도 (ratio) | 23 | 44 | | |
| 41 | 로그인일당디자인수D7 | Stickiness_168h | SUM(design_count_168h)/SUM(login_days_168h) | 활성 강도 (ratio) | 38 | 32 | | |
| 42 | (총)로그인일당디자인수 | Stickiness_total | SUM(design_count_total)/SUM(login_days_total) | 활성 강도 (ratio) | 49 | 37 | | 구 Stickiness 원본 |
| 43 | **포스트W1재로그인률** | **LRateReturn** | AVG(login_days_total>login_days_168h) | 장기 재방문 | 39 | 47 | ⭐ | 약하지만 CRM anchor |
| 44 | 포스트W1재디자인률 | DRateReturn | AVG(design_count_total>design_count_168h) | 장기 재방문 | 40 | 49 | | |

(*) 메일 진단 metric은 Control이 메일 미수신이라 A/B 비교 시 구조적으로 z 매우 큼. ranking은 참고용.

---

## 카테고리별 강약 패턴

| 카테고리 | L1 평균 | L2 평균 | 평가 |
|---|---|---|---|
| 로그인 평균 (LPU) | 11.5 | 4.75 | ⭐⭐⭐ 가장 강함, 시간 윈도우 시리즈 모두 강 |
| 로그인 깊이 (≥N) | 11.2 | 12.6 | ⭐⭐ 강함, 특히 ge2 D3, ge3 D7 |
| 로그인 도달 binary | 17.2 | 15.7 | △ 중간 |
| 디자인 평균 | 36.2 | 25.2 | △ L2에선 D3·D7 mid, 전반적 약 |
| 디자인 깊이 (≥N) | 30.7 | 37 | ❌ 약함 |
| 디자인 도달 binary | 28 | 28.5 | ❌ 약함 |
| 조합 활성 | 31.2 | 29.7 | ❌ 약함 (L1 LDeep168h만 #10) |
| 활성 강도 (Stickiness) | 38.5 | 40.7 | ❌ 매우 약함 (ratio of ratios 한계) |
| 장기 재방문 | 39.5 | 48 | ⚠ 매우 약함 (관측기간 한계, anchor용) |
| 메일 진단 | (별도) | (별도) | Treatment 내부용 |

---

## 핵심 발견

1. **로그인 평균일수(LPU)가 최강 카테고리** — 전 시간 윈도우(D1·D3·D7·총)에서 모두 강
2. **로그인 깊이(threshold) 강세** — L72h_ge2 (L1 #4), L168h_ge3 (L1 #3)
3. **디자인 카테고리 전반적 약함** — 메일이 디자인 행동을 직접 유도하는 효과 제한적
4. **L2에서는 D3 시간 윈도우가 강세** — segment 분석엔 단기 윈도우가 더 잘 잡음
5. **Stickiness 무력화** — 비율의 비율 구조로 잡음 폭증, L1 #38, L2 #40
6. **누적(총) 시리즈는 코호트 편향으로 약함** — 가입 시점 차이가 잡음
