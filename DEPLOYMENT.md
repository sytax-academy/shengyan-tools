# 聖彥學堂｜財稅互動工具 Deployment Registry

> 用途：GitHub 公開部署總表。  
> 本檔只記錄可公開的版本與網址資訊；內部 Audit、candidate、SHA-256 與 Release Gate 存於私人 Release Identity Registry。

## 網站資訊

- Organization：[sytax-academy](https://github.com/sytax-academy)
- Repository：[shengyan-tools](https://github.com/sytax-academy/shengyan-tools)
- GitHub Pages 根網址：[開啟工具站](https://sytax-academy.github.io/shengyan-tools/)
- 品牌入口：`https://tools.sytaxes.com/`（自訂網域待正式切換與驗證）
- Deployment branch：`main`
- Deployment source：`/(root)`

## Current Deployments

| Tool ID | 工具名稱 | Current Release | GitHub Path | GitHub Pages | Branded URL | Last Deployed | Status |
|---|---|---|---|---|---|---|---|
| 1-1 | 開公司決策工具 | `v3.6.4` | `/1-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-1/) | `https://tools.sytaxes.com/1-1/`（待切換） | `2026-09-07` | LIVE |
| 2-1 | 地址登記決策工具 | `v2.1.2` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/`（待切換） | `2026-09-07` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.8.4` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/`（待切換） | `2026-09-11` | LIVE |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.4.3` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/`（待切換） | `2026-09-10` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-1 | 損益兩平互動試算工具 | `v1.6.7` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/`（待切換） | `2026-09-09` | LIVE |
| 4-3 | 現金流量預算表 | `v1.13.1` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/`（待切換） | `2026-09-09` | LIVE |

## 公開版本規則

1. 每支工具固定使用自己的 Tool ID 資料夾。
2. 公開 Runtime 一律命名為 `index.html`。
3. 公開網址不放版本號。
4. 版本號記錄於本 `DEPLOYMENT.md`、各工具 `README.md` 與 Git commit。
5. 只有通過 Release Identity Lock 的正式 Runtime 才可部署。
6. `LIVE` 只用於 Release LOCKED + Deployment DEPLOYED + Verification PASS。
7. `NOT EXECUTED` 不得視為 PASS。

## Status

- `LIVE`：正式版本已確認、已部署且公開驗證 PASS。
- `DEPLOYED / PUBLIC SMOKE PENDING`：正式版本已部署，GitHub Pages deployment 成功，但公開頁面 smoke 尚未完成。
- `PENDING`：尚未部署。
- `HOLD`：有 blocker，不得正式發布。
- `RETIRED`：已下架但保留歷史紀錄。

> 本檔是公開部署地圖，不是法律／公式／Product Rule SOT，也不是完整 Audit Registry。
