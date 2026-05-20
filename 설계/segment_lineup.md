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

### G 중립
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JA1 | ja onboarding aip | 0 | 2 | 14위 중립 | 751 |
| D2 | data_graph | 0 | 2 | 13위 중립 | 1896 |
| D2 | image_bgremove | 0 | -1 | 18위 중립 | 1878 |
| D1 | 4step_empathy | 0 | -2 | 19위 중립 | 1627 |
| D1 | review_number | 0 | -2 | 20위 중립 | 1512 |
| JA1 | ja onboarding review | 0 | 0 | 17위 중립 | 670 |
| D1 | 4step_simplify | 0 | 0 | 15위 중립 | 1591 |
| JA1 | ja onboarding free | 0 | 0 | 16위 중립 | 688 |

### F 약한 음 (참고)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | image_frame | 0 | -6 | 21위 역효과 | 1862 |

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

### C v7 실험 (v7만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JAS | bgremove | 0 | 32 | 🥇 1위 강한 양효과 ⚠N작음 | 257 |
| JAS | templatemix | 0 | 25 | 5위 강한 양효과 ⚠N작음 | 186 |
| JAS | bookmark | 0 | 25 | 6위 강한 양효과 ⚠N작음 | 177 |
| JAS | graph | 0 | 24 | 7위 강한 양효과 ⚠N작음 | 206 |
| JAS | table | 0 | 19 | 8위 강한 양효과 ⚠N작음 | 227 |
| JA1 | ja onboarding review | 0 | 9 | 9위 강한 양효과 | 232 |
| JA1 | ja onboarding 4step | 0 | 6 | 11위 양효과 | 229 |
| JA1 | ja onboarding aip | 0 | 4 | 12위 양효과 | 230 |
| JA1 | ja onboarding free | 0 | 3 | 13위 중립 | 219 |

### G 중립
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| EN1 | en welcome 001 | — | 2 | 15위 중립 | 8581 |
| D1 | 4step_simplify | 0 | 2 | 14위 중립 | 256 |
| D2 | data_graph | 0 | 1 | 16위 중립 | 285 |
| D1 | review_ampathy | 0 | -1 | 19위 중립 | 221 |
| D1 | aip_empathy | 0 | -2 | 20위 중립 | 238 |
| D2 | image_frame | 0 | 0 | 17위 중립 | 297 |
| EDU | edu02_quiz | 0 | — |  |  |
| D2 | font | 0 | 0 | 18위 중립 | 570 |
| EDU | edu01_class | 0 | — |  |  |
| EDU | edu03_character | 0 | — |  |  |

### F 약한 음 (참고)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | aip_curiosity | 0 | -6 | 21위 역효과 | 257 |

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
| JAS | templatemix | 1 | 3 | 9위 중립 ⚠N작음 | 247 |
| JAS | 4step_empathy | 0 | 16 | 🥈 2위 강한 양효과 ⚠N작음 | 501 |
| JAS | aip_curiosity | 0 | 15 | 🥉 3위 강한 양효과 ⚠N작음 | 440 |
| D2 | image_bgremove | 0 | 13 | 4위 강한 양효과 | 374 |

### G 중립
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JA1 | ja onboarding free | 0 | 2 | 14위 중립 | 396 |
| EN1 | en welcome 001 | — | 2 | 12위 중립 | 1020 |
| JA1 | ja onboarding aip | 0 | 2 | 13위 중립 | 406 |
| D2 | image_frame | 0 | 2 | 10위 중립 | 396 |
| D2 | data_table | 0 | 2 | 11위 중립 | 374 |
| D2 | data_graph | 0 | 1 | 15위 중립 | 389 |
| JA1 | ja onboarding review | 0 | -2 | 19위 중립 | 393 |
| D1 | aip_empathy | 0 | -2 | 18위 중립 | 301 |
| D2 | font | 0 | 0 | 16위 중립 | 713 |

### F 약한 음 (참고)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | aip_curiosity | -2 | -2 | 17위 중립 | 358 |
| D1 | review_ampathy | 0 | -3 | 20위 중립 | 328 |
| D1 | 4step_empathy | 0 | -4 | 22위 역효과 | 301 |
| D1 | 4step_simplify | 0 | -4 | 21위 역효과 | 334 |
| JA1 | ja onboarding 4step | 0 | -5 | 🔻 23위 역효과 | 418 |

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
| JAS | templatemix | 0 | 5 | 5위 양효과 ⚠N작음 | 185 |
| JAS | bgremove | 0 | 4 | 7위 양효과 ⚠N작음 | 289 |
| JA1 | ja onboarding aip | 0 | 4 | 8위 양효과 | 241 |
| JAS | table | 0 | 4 | 6위 양효과 ⚠N작음 | 255 |
| JAS | font | 0 | 3 | 9위 중립 ⚠N작음 | 316 |

### G 중립
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | font | -1 | 0 | 13위 중립 | 591 |
| D2 | data_table | -1 | 0 | 14위 중립 | 286 |
| JAS | graph | 0 | 1 | 10위 중립 ⚠N작음 | 218 |
| JA1 | ja onboarding free | 0 | -1 | 17위 중립 | 195 |
| JA1 | ja onboarding 4step | 0 | -1 | 16위 중립 | 205 |
| D1 | aip_empathy | 0 | -2 | 18위 중립 | 257 |
| D1 | review_number | 0 | -2 | 19위 중립 | 254 |
| EN1 | en welcome 001 | — | 0 | 15위 중립 | 2988 |
| D1 | review_ampathy | 0 | 0 | 12위 중립 | 275 |
| D1 | aip_curiosity | 0 | 0 | 11위 중립 | 296 |

### F 약한 음 (참고)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | image_bgremove | -1 | -5 | 🔻 24위 역효과 | 319 |
| D1 | 4step_simplify | 0 | -3 | 20위 중립 | 237 |
| D1 | 4step_empathy | 0 | -4 | 21위 역효과 | 267 |
| D2 | image_frame | 0 | -4 | 22위 역효과 | 300 |

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

### G 중립
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| EDU | edu03_character | 1 | 1 | 🥉 3위 중립 ⚠N작음 | 588 |
| D2 | font | 1 | -2 | 8위 중립 | 435 |
| EN1 | en welcome 001 | — | -1 | 7위 중립 | 1685 |
| D1 | aip_empathy | 0 | — |  |  |
| JAS | 4step_empathy | 0 | — |  |  |
| D1 | review_ampathy | 0 | — |  |  |
| D1 | aip_curiosity | 0 | — |  |  |
| JAS | font | 0 | — |  |  |
| JAS | templatemix | 0 | — |  |  |
| JAS | graph | 0 | — |  |  |
| JAS | bgremove | 0 | — |  |  |
| D1 | review_number | 0 | — |  |  |
| JA1 | ja onboarding free | 0 | 0 | 6위 중립 | 495 |
| JA1 | ja onboarding aip | 0 | 0 | 5위 중립 | 532 |
| JAS | table | 0 | — |  |  |
| JAS | bookmark | 0 | — |  |  |
| D1 | 4step_simplify | 0 | — |  |  |
| JAS | aip_curiosity | 0 | — |  |  |
| D1 | 4step_empathy | 0 | — |  |  |
| D2 | image_frame | 0 | 0 | 4위 중립 | 223 |

### F 약한 음 (참고)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JA1 | ja onboarding 4step | 0 | -4 | 10위 역효과 | 513 |
| D2 | data_table | 0 | -4 | 9위 역효과 | 218 |
| JA1 | ja onboarding review | 0 | -6 | 11위 역효과 | 540 |

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

### G 중립
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JA1 | ja onboarding aip | 1 | — |  |  |
| JA1 | ja onboarding free | 1 | — |  |  |
| D1 | 4step_simplify | -1 | 0 | 6위 중립 ⚠N작음 | 110 |
| EDU | edu03_character | 0 | — |  |  |
| JAS | bookmark | 0 | — |  |  |
| D1 | aip_empathy | 0 | 0 | 7위 중립 ⚠N작음 | 103 |
| D1 | 4step_empathy | 0 | 0 | 9위 중립 ⚠N작음 | 91 |
| D2 | image_frame | 0 | 0 | 🔻 11위 중립 | 107 |
| EDU | edu01_class | 0 | — |  |  |
| JAS | 4step_empathy | 0 | — |  |  |
| D1 | review_ampathy | 0 | 0 | 10위 중립 ⚠N작음 | 99 |
| EDU | edu02_quiz | 0 | — |  |  |
| JAS | font | 0 | — |  |  |
| JAS | table | 0 | — |  |  |
| JA1 | ja onboarding 4step | 0 | — |  |  |
| JAS | templatemix | 0 | — |  |  |
| JAS | aip_curiosity | 0 | — |  |  |
| JAS | graph | 0 | — |  |  |
| JAS | bgremove | 0 | — |  |  |
| D1 | review_number | 0 | 0 | 8위 중립 ⚠N작음 | 112 |
| D2 | data_table | 0 | 0 | 🔻 12위 중립 | 112 |

## INSTITUTION


### B KPI 신뢰 (KPI만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| JAS | bookmark | 2 | 0 | 20위 중립 ⚠N작음 (pooled SE) | 24 |

### C v7 실험 (v7만 양)
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D1 | aip_empathy | 0 | 14 | 🥇 1위 강한 양효과 ⚠N작음 (pooled SE) | 39 |
| D1 | 4step_empathy | 0 | 7 | 🥈 2위 양효과 ⚠N작음 (pooled SE) | 43 |
| D2 | image_frame | 0 | 6 | 🥉 3위 양효과 ⚠N작음 (pooled SE) | 51 |
| JA1 | ja onboarding review | 0 | 5 | 4위 양효과 ⚠N작음 (pooled SE) | 33 |

### G 중립
| 캠페인 | cell | KPI | v7 | v7 라벨 | n_T (v7) |
|---|---|---:|---:|---|---:|
| D2 | font | 0 | 2 | 6위 중립 ⚠N작음 (pooled SE) | 101 |
| D2 | data_graph | 0 | 2 | 7위 중립 ⚠N작음 (pooled SE) | 50 |
| D1 | review_ampathy | 0 | 2 | 5위 중립 ⚠N작음 (pooled SE) | 40 |
| EN1 | en welcome 001 | — | 2 | 8위 중립 ⚠N작음 (pooled SE) | 241 |
| D1 | aip_curiosity | 0 | -2 | 🔻 24위 중립 ⚠N작음 (pooled SE) | 41 |
| D2 | data_table | 0 | 0 | 11위 중립 ⚠N작음 (pooled SE) | 39 |
| D1 | 4step_simplify | 0 | 0 | 10위 중립 ⚠N작음 (pooled SE) | 33 |
| JA1 | ja onboarding 4step | 0 | 0 | 🔻 23위 중립 ⚠N작음 (pooled SE) | 35 |
| JAS | templatemix | 0 | 0 | 15위 중립 ⚠N작음 (pooled SE) | 27 |
| D2 | image_bgremove | 0 | 0 | 12위 중립 ⚠N작음 (pooled SE) | 48 |
| JAS | graph | 0 | 0 | 13위 중립 ⚠N작음 (pooled SE) | 33 |
| JAS | bgremove | 0 | 0 | 14위 중립 ⚠N작음 (pooled SE) | 40 |
| JAS | 4step_empathy | 0 | 0 | 18위 중립 ⚠N작음 (pooled SE) | 56 |
| D1 | review_number | 0 | 0 | 9위 중립 ⚠N작음 (pooled SE) | 37 |
| JA1 | ja onboarding free | 0 | 0 | 22위 중립 ⚠N작음 (pooled SE) | 40 |
| JA1 | ja onboarding aip | 0 | 0 | 21위 중립 ⚠N작음 (pooled SE) | 38 |
| JAS | font | 0 | 0 | 19위 중립 ⚠N작음 (pooled SE) | 47 |
| JAS | table | 0 | 0 | 16위 중립 ⚠N작음 (pooled SE) | 36 |
| JAS | aip_curiosity | 0 | 0 | 17위 중립 ⚠N작음 (pooled SE) | 53 |