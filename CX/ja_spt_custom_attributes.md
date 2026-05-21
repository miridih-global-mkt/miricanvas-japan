# JP サポーターズ Custom Attributes 생성 목록

생성 경로: Braze > Settings > Custom Data > Custom Attributes > + Create Custom Attribute
설명 추가: 속성 우측 [...] > Edit > Description 입력 후 Save

---

## String 타입 (12개)

| 속성명 | Description에 입력할 내용 |
|--------|--------------------------|
| `ja_spt_industry` | 2026-05-22 / ejjeong / JP サポーターズ応募: 業種 |
| `ja_spt_job` | 2026-05-22 / ejjeong / JP サポーターズ応募: 職種 |
| `ja_spt_frequency` | 2026-05-22 / ejjeong / JP サポーターズ応募: 利用頻度 |
| `ja_spt_tenure` | 2026-05-22 / ejjeong / JP サポーターズ応募: 利用期間 |
| `ja_spt_referral_offline` | 2026-05-22 / ejjeong / JP サポーターズ応募: 口コミ実績 |
| `ja_spt_referral_online` | 2026-05-22 / ejjeong / JP サポーターズ応募: SNS発信実績 |
| `ja_spt_acquisition` | 2026-05-22 / ejjeong / JP サポーターズ応募: 認知経路 |
| `ja_spt_strengths` | 2026-05-22 / ejjeong / JP サポーターズ応募: 強み |
| `ja_spt_weaknesses` | 2026-05-22 / ejjeong / JP サポーターズ応募: 改善点 |
| `ja_spt_expectations` | 2026-05-22 / ejjeong / JP サポーターズ応募: 期待すること |
| `ja_spt_accounts` | 2026-05-22 / ejjeong / JP サポーターズ応募: SNSアカウント |
| `ja_spt_comments` | 2026-05-22 / ejjeong / JP サポーターズ応募: その他コメント |

## Boolean 타입 (2개)

> ⚠️ 반드시 **Boolean** 타입으로 생성할 것. String으로 만들면 `"true"` 문자열이 되어 세그먼트 필터 `= is true` 조건이 동작하지 않음.

| 속성명 | Description에 입력할 내용 |
|--------|--------------------------|
| `ja_spt_agree_line` | 2026-05-22 / ejjeong / JP サポーターズ応募: LINE友だち追加同意 |
| `ja_spt_agree_privacy` | 2026-05-22 / ejjeong / JP サポーターズ応募: 個人情報取扱同意 |

## Array 타입 (4개)

| 속성명 | Description에 입력할 내용 |
|--------|--------------------------|
| `ja_spt_usage` | 2026-05-22 / ejjeong / JP サポーターズ応募: 主な用途(複数選択) |
| `ja_spt_features` | 2026-05-22 / ejjeong / JP サポーターズ応募: 主な機能(複数選択) |
| `ja_spt_target` | 2026-05-22 / ejjeong / JP サポーターズ応募: 紹介対象(複数選択) |
| `ja_spt_channels` | 2026-05-22 / ejjeong / JP サポーターズ応募: 紹介チャンネル(複数選択) |
