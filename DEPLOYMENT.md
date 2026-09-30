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
| 1-3 | 有限公司設立互動工具 | `v1.0.9` | `/1-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-3/) | `https://tools.sytaxes.com/1-3/` | `2026-09-30` | LIVE |
| 2-1 | 地址登記決策工具 | `v2.1.5` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/` | `2026-09-30` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.8.7` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/` | `2026-09-30` | LIVE |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.44` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/` | `2026-09-30` | LIVE |
| 4-1 | 損益兩平互動試算工具 | `v1.6.10` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/` | `2026-09-30` | LIVE |
| 4-3 | 現金流量預算表 | `v1.13.5` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/` | `2026-09-30` | LIVE |
| 4-4 | 停業、歇業與解散導航 | `v1.6.4` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/` | `2026-09-30` | LIVE |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準；下表為 115/09/30 工具十一致性改版 B 批第二輪（版型與視覺；驗證表：shengyan-knowledge「工具規格/工具十/工具十一致性改版B批第二輪驗證表_v1_0」，執行紀錄 v1_2，S03、S04 結果頁與 X01 之 1-3 版本字串經使用者裁定；小圖示改版依補充驗證表 v1_0，執行紀錄 v1_0，I10 使用者實機通過）合入前自測試分支 test/b-batch-2（commit bf25284）之 git blob 實算。使用者 115/09/30 實機檢查與並排核可通過；合入前確認 Project Instruction 現行為 v1.4。115/09/30 使用者本機自 tools.sytaxes.com 取回八支實算，位元組數與 SHA-256 均與下表相符；1-3、4-4 以瀏覽器走至結果頁正常；改記 LIVE。前一版（115/09/30 B 批第一輪，LIVE）之位元組數與 SHA-256 見 git 歷史（commit c6e7054）。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.7` | 86,904 | `14cbf698072e52684794f6ff55d7a4c605a176bef49a8c78bad01dca5b1352fb` |
| 1-3 | `v1.0.9` | 46,672 | `f26e59ec7e364e6c723a0e168b11bf2b907e7de77dc2687070249c35ba2a2c43` |
| 2-1 | `v2.1.5` | 123,029 | `03690daae139e83df17265e49c57b1f6e916d590941435fd8c019ed4a3d3f7f6` |
| 2-2 | `v1.8.7` | 118,136 | `8796a3ab6c701cf8e7c80651be54b17e88fc220c88c425834233271714191c59` |
| 3-2 | `v1.5.44` | 943,960 | `83aeba1c34496104331ca3976bc35997d440c134d2c3152900ed431d5d6bf75a` |
| 4-1 | `v1.6.10` | 139,328 | `5473605e12442e51a8820f3733c4759f72f7a57e920a5613addd8323eac7c57b` |
| 4-3 | `v1.13.5` | 1,020,494 | `dc30d44ff55e78cab3bf98b49cb5ead676dffb736b6d5492bf2507b9e4337dff` |
| 4-4 | `v1.6.4` | 101,112 | `5b9a01428587ffb3f47c861208cdc7d26b33542b211f77120167e717c9e352cf` |

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
