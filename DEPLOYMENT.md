# 聖彥學堂｜財稅互動工具 Deployment Registry

> 用途：GitHub 公開部署總表。  
> 本檔為各工具現行版本與 SHA-256 之唯一權威來源（115/09/22 裁定）；原所稱私人 Release Identity Registry 與工廠 Registry 均為歷史，不再作為核對依據。每次合入 main 時於同一 commit 更新本檔。

## 網站資訊

- Organization：[sytax-academy](https://github.com/sytax-academy)
- Repository：[shengyan-tools](https://github.com/sytax-academy/shengyan-tools)
- GitHub Pages 根網址：[開啟工具站](https://sytax-academy.github.io/shengyan-tools/)
- 品牌入口：`https://tools.sytaxes.com/`（自訂網域已啟用；115/09/29 使用者裁定移除「待切換」註記）
- Deployment branch：`main`
- Deployment source：`/(root)`

## Current Deployments

| Tool ID | 工具名稱 | Current Release | GitHub Path | GitHub Pages | Branded URL | Last Deployed | Status |
|---|---|---|---|---|---|---|---|
| 1-1 | 開公司決策工具 | `v3.6.7` | `/1-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-1/) | `https://tools.sytaxes.com/1-1/` | `2026-09-30` | LIVE |
| 1-3 | 有限公司設立互動工具 | `v1.0.13` | `/1-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-3/) | `https://tools.sytaxes.com/1-3/` | `2026-09-30` | DEPLOYED / PUBLIC SMOKE PENDING |
| 2-1 | 地址登記決策工具 | `v2.1.5` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/` | `2026-09-30` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.8.8` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/` | `2026-09-30` | DEPLOYED / PUBLIC SMOKE PENDING |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.45` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/` | `2026-09-30` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-1 | 損益兩平互動試算工具 | `v1.6.11` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/` | `2026-09-30` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-3 | 現金流量預算表 | `v1.13.6` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/` | `2026-09-30` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-4 | 停業、歇業與解散導航 | `v1.6.7` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/` | `2026-09-30` | DEPLOYED / PUBLIC SMOKE PENDING |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準；下表 1-3、4-4 兩列為 115/09/30 頁尾宣告精簡小批（1-3 驗證表 shengyan-knowledge「工具規格/1-3/」v1_9，執行紀錄 v1_17，V86 經使用者裁定「以甲案為準」；4-4 驗證表 v1_13，執行紀錄 v1_3；GPT 交叉審查與複審採納表 v1_1）合入前自測試分支 test/footer-tier（commit 937db04）之 git blob 實算；使用者 115/09/30 實機檢查與並排核可通過；合入前確認 Project Instruction 現行為 v1.5。1-3、4-4 公開頁 smoke 尚未完成。2-2、3-2、4-1、4-3 四列為 115/09/30 頁尾精簡（驗證表 shengyan-knowledge「工具規格/工具十/工具十頁尾精簡驗證表_v1_0」，執行紀錄 v1_2）合入前自測試分支 test/footer-four（commit 061a6d3）之 git blob 實算；使用者 115/09/30 手機檢查與並排核可通過；合入前確認 Project Instruction 現行為 v1.5；公開頁 smoke 尚未完成。1-1、2-1 兩列為 115/09/30 B 批第二輪（commit bf25284 實算，LIVE），未變動。前一版之位元組數與 SHA-256 見 git 歷史（1-3、4-4 見 commit cb5e066，四支見 commit e700c86）。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.7` | 86,904 | `14cbf698072e52684794f6ff55d7a4c605a176bef49a8c78bad01dca5b1352fb` |
| 1-3 | `v1.0.13` | 46,639 | `6ecbd5d482814218a58aefe8513e986a66781caa91d72f8adcbe7654615919b0` |
| 2-1 | `v2.1.5` | 123,029 | `03690daae139e83df17265e49c57b1f6e916d590941435fd8c019ed4a3d3f7f6` |
| 2-2 | `v1.8.8` | 118,103 | `f11ce273dfe5aa4d2fe83ee77222f438212cdc88dfdbfcc49da66048fc1cece1` |
| 3-2 | `v1.5.45` | 943,826 | `b5c3c578c43b42da22aa3a2064edbbda240b5a7848457d05f018a7b438a3fb4e` |
| 4-1 | `v1.6.11` | 139,083 | `c6217f31344297d7ec69f3a6d620c0d99043b4e4af92083baac7dd701bee7cf9` |
| 4-3 | `v1.13.6` | 1,020,373 | `c20a91a9a00fbf2330fb371c31c0d2163b0826cac87c1240630e24e6851fe0e7` |
| 4-4 | `v1.6.7` | 101,292 | `cbf048e95b70e715f40f0b417a95e728000248acbeea87317ac3c6dfca1fce0a` |

## 公開版本規則

1. 每支工具固定使用自己的 Tool ID 資料夾。
2. 公開 Runtime 一律命名為 `index.html`。
3. 公開網址不放版本號。
4. 版本號記錄於本 `DEPLOYMENT.md`、各工具 `README.md` 與 Git commit。
5. 只有驗證表全數通過且經使用者並排核可的版本才可合入 main。
6. `LIVE` 只用於 Release LOCKED + Deployment DEPLOYED + Verification PASS。
7. `NOT EXECUTED` 不得視為 PASS。

## Status

- `LIVE`：正式版本已確認、已部署且公開驗證 PASS。
- `DEPLOYED / PUBLIC SMOKE PENDING`：正式版本已部署，GitHub Pages deployment 成功，但公開頁面 smoke 尚未完成。
- `PENDING`：尚未部署。
- `HOLD`：有 blocker，不得正式發布。
- `RETIRED`：已下架但保留歷史紀錄。

> 本檔是公開部署地圖，不是法律／公式／Product Rule SOT，也不是完整 Audit Registry。
