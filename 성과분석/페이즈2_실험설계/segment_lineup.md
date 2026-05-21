# Segment별 메일 lineup (v7 + KPI 통합 분류)

**분류 룰**:
- A 검증: KPI 양 (composite ≥2) AND v7 양 (composite ≥3)
- B KPI 신뢰: KPI 양 only
- C v7 실험: v7 양 only
- D 제외: 양쪽 음 (KPI ≤ -2 AND v7 ≤ -3)
- E 제외 검토: 한쪽이 강한 음 (KPI ≤ -4 OR v7 ≤ -7), 다른 쪽이 양이어도 검토
- F~H: 중립/약한 음/미측정


## NULL


### A 검증 (양쪽 양효과)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JAS | font | 4 | 23 | 🥈 2위 강한 양효과 | 1917 |
| JAS | aip_curiosity | 4 | 22 | 4위 강한 양효과 | 2121 |
| JAS | 4step_empathy | 4 | 22 | 5위 강한 양효과 | 2307 |
| JAS | table | 3 | 27 | 🥇 1위 강한 양효과 | 1371 |
| JAS | bgremove | 3 | 21 | 6위 강한 양효과 | 1617 |
| JAS | graph | 2 | 23 | 🥉 3위 강한 양효과 | 1149 |
| JAS | bookmark | 2 | 19 | 7위 강한 양효과 | 785 |
| JAS | templatemix | 2 | 19 | 8위 강한 양효과 | 936 |

### C v7 실험 (v7만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | data_table | -1 | 7 | 10위 양효과 | 1875 |
| JA1 | ja onboarding 4step | 0 | 8 | 9위 강한 양효과 | 744 |
| EN1 | en welcome 001 | — | 5 | 11위 양효과 | 103613 |
| D2 | font | 0 | 3 | 12위 중립 | 3681 |

### D 제외 (양쪽 음)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | aip_empathy | 1 | -7 | 22위 역효과 | 1586 |
| D1 | review_ampathy | 0 | -9 | 🔻 23위 강한 역효과 | 1554 |
| D1 | aip_curiosity | 0 | -23 | 🔻 24위 강한 역효과 | 1547 |

## STUDENT

### A 검증 (양쪽 양효과)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | data_table | 3 | 6 | 10위 양효과 | 284 |
| JAS | aip_curiosity | 2 | 32 | 🥈 2위 강한 양효과 ⚠N작음 | 323 |
| JAS | font | 2 | 30 | 🥉 3위 강한 양효과 ⚠N작음 | 292 |
| JAS | 4step_empathy | 2 | 28 | 4위 강한 양효과 ⚠N작음 | 342 |

### D 제외 (양쪽 음)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | review_number | -1 | -8 | 22위 강한 역효과 | 245 |
| D2 | image_bgremove | 0 | -9 | 🔻 23위 강한 역효과 | 278 |
| D1 | 4step_empathy | 0 | -10 | 🔻 24위 강한 역효과 | 252 |

## COMPANY

### C v7 실험 (v7만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JAS | font | 1 | 16 | 🥇 1위 강한 양효과 ⚠N작음 | 385 |
| JAS | bgremove | 1 | 11 | 5위 강한 양효과 ⚠N작음 | 344 |
| JAS | bookmark | 1 | 10 | 6위 강한 양효과 ⚠N작음 | 229 |
| JAS | graph | 1 | 8 | 8위 강한 양효과 ⚠N작음 | 278 |
| JAS | table | 1 | 8 | 7위 강한 양효과 ⚠N작음 | 304 |
| JAS | 4step_empathy | 0 | 16 | 🥈 2위 강한 양효과 ⚠N작음 | 501 |
| JAS | aip_curiosity | 0 | 15 | 🥉 3위 강한 양효과 ⚠N작음 | 440 |
| D2 | image_bgremove | 0 | 13 | 4위 강한 양효과 | 374 |

### D 제외 (양쪽 음)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | review_number | 0 | -7 | 🔻 24위 역효과 | 318 |

## INDIVIDUAL

### C v7 실험 (v7만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JAS | bookmark | 0 | 10 | 🥇 1위 강한 양효과 ⚠N작음 | 164 |
| JAS | aip_curiosity | 0 | 8 | 🥉 3위 강한 양효과 ⚠N작음 | 352 |
| JAS | 4step_empathy | 0 | 8 | 🥈 2위 강한 양효과 ⚠N작음 | 385 |
| JA1 | ja onboarding review | 0 | 6 | 4위 양효과 | 236 |

### D 제외 (양쪽 음)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | data_graph | -2 | -4 | 🔻 23위 역효과 | 314 |

## EDUCATION

### A 검증 (양쪽 양효과)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| EDU | edu01_class | 2 | 3 | 🥇 1위 중립 ⚠N작음 | 767 |

### B KPI 신뢰 (KPI만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| EDU | edu02_quiz | 2 | 2 | 🥈 2위 중립 ⚠N작음 | 661 |

### D 제외 (양쪽 음)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | data_graph | -1 | -8 | 🔻 12위 강한 역효과 | 188 |
| D2 | image_bgremove | 0 | -11 | 🔻 13위 강한 역효과 | 226 |

## BUSINESS

### B KPI 신뢰 (KPI만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JA1 | ja onboarding review | 3 | — |  |  |

### C v7 실험 (v7만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | aip_curiosity | 1 | 5 | 🥉 3위 양효과 ⚠N작음 | 120 |
| EN1 | en welcome 001 | — | 12 | 🥇 1위 강한 양효과 ⚠N작음 | 787 |
| D2 | font | 0 | 11 | 🥈 2위 강한 양효과 | 262 |
| D2 | image_bgremove | 0 | 4 | 4위 양효과 | 132 |
| D2 | data_graph | 0 | 3 | 5위 중립 | 132 |

## INSTITUTION

### B KPI 신뢰 (KPI만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JAS | bookmark | 2 | 0 | 20위 중립 ⚠N작음 | 24 |

### C v7 실험 (v7만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | aip_empathy | 0 | 14 | 🥇 1위 강한 양효과 ⚠N작음 | 39 |
| D1 | 4step_empathy | 0 | 7 | 🥈 2위 양효과 ⚠N작음 | 43 |
| D2 | image_frame | 0 | 6 | 🥉 3위 양효과 ⚠N작음 | 51 |
| JA1 | ja onboarding review | 0 | 5 | 4위 양효과 ⚠N작음 | 33 |