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
| 1-1 | 開公司決策工具 | `v3.6.9` | `/1-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-1/) | `https://tools.sytaxes.com/1-1/` | `2026-10-01` | LIVE |
| 1-3 | 有限公司設立互動工具 | `v1.0.18` | `/1-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-3/) | `https://tools.sytaxes.com/1-3/` | `2026-10-01` | LIVE |
| 2-1 | 地址登記決策工具 | `v2.1.8` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/` | `2026-10-01` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.8.9` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/` | `2026-10-01` | DEPLOYED / PUBLIC SMOKE PENDING |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.46` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/` | `2026-10-01` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-1 | 損益兩平互動試算工具 | `v1.6.12` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/` | `2026-10-01` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-3 | 現金流量預算表 | `v1.13.7` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/` | `2026-10-01` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-4 | 停業、歇業與解散導航 | `v1.6.8` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/` | `2026-10-01` | DEPLOYED / PUBLIC SMOKE PENDING |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準；下表 2-2、3-2、4-1、4-3、4-4 五列為 115/10/01 墨灰改版改色第一批（只改色彩層，依《聖彥學堂 Design System v2.0》定稿 r8；驗證表 shengyan-knowledge「inbox/墨灰改版/墨灰改版_改色驗證表_v1_0」凍結於 commit f7efa17、補充（Z5）v1_0 凍結於 commit 0e65d2d；執行紀錄 v1_1 見 commit 24d5f2b）合入前自測試分支 test/ink-gray-1（commit 5e5f8ab）之 git blob 實算；使用者 115/10/01 S01 實機核可；合入前確認 Project Instruction 現行為 v1.5。五支已合入，待 GitHub Pages 部署與公開頁 smoke（S02），通過後改記 LIVE；五支前一版（2-2 v1.8.8、3-2 v1.5.45、4-1 v1.6.11、4-3 v1.13.6、4-4 v1.6.7）之位元組數與 SHA-256 見 git 歷史（commit e892050）。1-1、1-3、2-1 三列為 115/10/01 預約入口每畫面一個小批，LIVE，其實算與公開驗證之說明見 git 歷史（commit e892050）。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.9` | 87,895 | `3dfbc4b8481d408a9768a9938976ad2d16eb8c3998ab67254feb4b77b06c76fd` |
| 1-3 | `v1.0.18` | 49,672 | `8702e4393ec91f835cd45a802670c6a90b7dce0f9996047f18445283126b5fc4` |
| 2-1 | `v2.1.8` | 124,669 | `e9b3b7ab456e4aa1e54d0d2d235a5bb8890eec55ebaf8db04b5ded1be0b4224c` |
| 2-2 | `v1.8.9` | 118,450 | `f06ba4f0d505e153d45c4bcffa408d07ff9051bcb0cdc1a720a01b3ea34414e0` |
| 3-2 | `v1.5.46` | 943,896 | `ecb648d1fdf0446b76aad9c87a57f4926b988994ee6f674308bb885c918e68cb` |
| 4-1 | `v1.6.12` | 139,420 | `977fdf3265e015322753e047203cb002484967a5d9e9b436c0709fbca5e7b85d` |
| 4-3 | `v1.13.7` | 1,021,753 | `d8aaba3fd3a4f2a79a80ccb47b0de9de74b39481b96c64bbba4c55fc46156bab` |
| 4-4 | `v1.6.8` | 101,446 | `b36445065042cc52334578f5c3dcbbe61dc8719b2fdb6c5ece65454dda7e7fb4` |

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
