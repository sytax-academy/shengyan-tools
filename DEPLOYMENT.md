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
| 1-1 | 開公司決策工具 | `v3.6.8` | `/1-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-1/) | `https://tools.sytaxes.com/1-1/` | `2026-10-01` | LIVE |
| 1-3 | 有限公司設立互動工具 | `v1.0.17` | `/1-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-3/) | `https://tools.sytaxes.com/1-3/` | `2026-10-01` | LIVE |
| 2-1 | 地址登記決策工具 | `v2.1.7` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/` | `2026-10-01` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.8.8` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/` | `2026-09-30` | LIVE |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.45` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/` | `2026-09-30` | LIVE |
| 4-1 | 損益兩平互動試算工具 | `v1.6.11` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/` | `2026-09-30` | LIVE |
| 4-3 | 現金流量預算表 | `v1.13.6` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/` | `2026-09-30` | LIVE |
| 4-4 | 停業、歇業與解散導航 | `v1.6.7` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/` | `2026-09-30` | LIVE |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準；下表 2-1 一列為 115/10/01 署名旁預約按鈕去重小批（刪除側欄署名旁之預約按鈕；驗證表 shengyan-knowledge「inbox/設立前端三支/2-1署名旁預約按鈕去重_驗證表_v1_0」，凍結於 commit 6a09b6a；執行紀錄 v1_0，E01～E06 通過）合入前自測試分支 test/2-1-dedup（commit 78d94e0）之 git blob 實算；使用者 115/10/01 手機與桌機實機確認（E07 通過）；合入前確認 Project Instruction 現行為 v1.5。115/10/01 GitHub Pages 部署（pages build and deployment #60，commit 558d7ae）成功；使用者本機自 tools.sytaxes.com 取回 2-1，版號、位元組數與 SHA-256 均與下表相符；以瀏覽器走至結果頁，側欄署名下無按鈕、主畫面署名下一顆「預約諮詢」、看得到預約區塊；改記 LIVE。1-1、1-3 兩列為 115/10/01 設立前端三支小批（驗證表 commit c688f2e，執行紀錄 v1_1；測試分支 test/setup-front-3b commit 93d5801 實算），公開頁取回核對相符，LIVE；其餘五列未變動，亦均 LIVE（2-2、3-2、4-1、4-3、4-4，115/09/30 頁尾精簡兩小批與 B 批第二輪實算）；2-1 前一版（v2.1.6）之位元組數與 SHA-256 見 git 歷史（commit 2bf9035）。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.8` | 87,712 | `8f6fb366d28842bf6b5baa2c4743e44577159fb9f9612104475597bf4da4f441` |
| 1-3 | `v1.0.17` | 49,489 | `749b2bc8e222d0b5aebdc469581d8b90c895ca1ca0c96819b88bd605cee4eca7` |
| 2-1 | `v2.1.7` | 124,486 | `7f025959c122497db5c8c145e39ba7e26f5c886d5cf613e2fcc7d6fae171efb0` |
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
