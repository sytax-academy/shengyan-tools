# 聖彥學堂｜財稅互動工具 Deployment Registry

> 用途：GitHub 公開部署總表。  
> 本檔為各工具現行版本與 SHA-256 之唯一權威來源（115/09/22 裁定）；原所稱私人 Release Identity Registry 與工廠 Registry 均為歷史，不再作為核對依據。每次合入 main 時於同一 commit 更新本檔。

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
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.41` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/`（待切換） | `2026-09-13` | LIVE |
| 4-1 | 損益兩平互動試算工具 | `v1.6.7` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/`（待切換） | `2026-09-09` | LIVE |
| 4-3 | 現金流量預算表 | `v1.13.2` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/`（待切換） | `2026-09-11` | LIVE |
| 4-4 | 停業、歇業與解散導航 | `v1.2.0` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/`（待切換） | `2026-09-24` | DEPLOYED / PUBLIC SMOKE PENDING |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準；1-1 至 4-3 為 115/09/24 自 main（commit 9670cc3）實算。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.4` | 78,813 | `0d2feba043ff6e9e54279c915aca2a71033144695f7f9e3e836cb2813c075eac` |
| 2-1 | `v2.1.2` | 116,297 | `1d5909c4956c08686bd28596745ac30ee2d7553e6504adad08bfe749782716c4` |
| 2-2 | `v1.8.4` | 110,677 | `15f7ababa691287d00f7b6f6ce8a5fcb33c5977929f54c6aa17dcdef4d3043f6` |
| 3-2 | `v1.5.41` | 935,609 | `71f14ee8bf8240beca1103861b306d36467a7905df5b6f790ecbd1b2e4f61762` |
| 4-1 | `v1.6.7` | 133,590 | `cd0d4c3f8f2d37f924b12df5163eae11aefa98e7df4fbea23b12b50c9d6e1626` |
| 4-3 | `v1.13.2` | 1,011,659 | `1ebea9d32acea7512fafe00964646b6813e28e0c82aa1c8269fb42219c309486` |
| 4-4 | `v1.2.0` | 83,793 | `0b4bcafd74d341f5bca7c19c49c4067c01c130ca0cfc742d14782ffe1df649d4` |

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
