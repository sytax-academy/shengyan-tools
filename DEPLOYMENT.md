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
| 1-1 | 開公司決策工具 | `v3.6.6` | `/1-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-1/) | `https://tools.sytaxes.com/1-1/` | `2026-09-30` | LIVE |
| 1-3 | 有限公司設立互動工具 | `v1.0.8` | `/1-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-3/) | `https://tools.sytaxes.com/1-3/` | `2026-09-30` | LIVE |
| 2-1 | 地址登記決策工具 | `v2.1.4` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/` | `2026-09-30` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.8.6` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/` | `2026-09-30` | LIVE |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.43` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/` | `2026-09-30` | LIVE |
| 4-1 | 損益兩平互動試算工具 | `v1.6.9` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/` | `2026-09-30` | LIVE |
| 4-3 | 現金流量預算表 | `v1.13.4` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/` | `2026-09-30` | LIVE |
| 4-4 | 停業、歇業與解散導航 | `v1.6.3` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/` | `2026-09-30` | LIVE |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準；下表為 115/09/30 工具十一致性改版 B 批第一輪（驗證表：shengyan-knowledge「工具規格/工具十/工具十一致性改版B批第一輪驗證表_v1_2」，執行紀錄 v1_2，未執行 0；1-3 另依其驗證表 v1_5，執行紀錄 v1_10，通過 76）合入前自測試分支 test/b-batch-1（commit 32932be）之 git blob 實算。使用者 115/09/30 實機檢查與並排核可通過。115/09/30 使用者本機自 tools.sytaxes.com 取回八支實算，位元組數與 SHA-256 均與下表相符；1-3、4-4 以瀏覽器走至結果頁正常；改記 LIVE。前一版（115/09/29 署名與標題一致化，LIVE）之位元組數與 SHA-256 見 git 歷史（commit e469ac7）。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.6` | 83,212 | `2fdd1b46e2d2173554f274e70603cc6726c7aaba865d0de8cad4b4625014b86a` |
| 1-3 | `v1.0.8` | 44,747 | `a050b6a396f6897d1eeb36ff9ac625ac7a8d9b8c7bb9caf195407bad04e6dd78` |
| 2-1 | `v2.1.4` | 120,546 | `2039573f950490f209ede791a743e9561a4b38cf1c23f9142c7f48daa777ff68` |
| 2-2 | `v1.8.6` | 116,474 | `1b71940734ef061e2d295000a2da4877c3f53f76ed399370b0cbe8e76eabaeca` |
| 3-2 | `v1.5.43` | 939,855 | `e48b58fefd5cda9cd741e46863088a02f67e87f3f51aef776524811f4b6e8402` |
| 4-1 | `v1.6.9` | 137,310 | `292056a651a8682f6ec2f36f70449df6506ce52f753281dd7a3066ba1299cef0` |
| 4-3 | `v1.13.4` | 1,018,976 | `4947bcf9f054ac538dd58fca46a7b4424c637af7c8a00c48e9da6bb07d1f2d44` |
| 4-4 | `v1.6.3` | 97,124 | `48509d0d469d723b0b17ad1548ed8f2d74c6017834b14ff4fee9dede9f2ddb86` |

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
