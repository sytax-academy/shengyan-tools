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
| 1-1 | 開公司決策工具 | `v3.6.5` | `/1-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-1/) | `https://tools.sytaxes.com/1-1/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |
| 1-3 | 有限公司設立互動工具 | `v1.0.7` | `/1-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-3/) | `https://tools.sytaxes.com/1-3/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |
| 2-1 | 地址登記決策工具 | `v2.1.3` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |
| 2-2 | 投保級距試算工具 | `v1.8.5` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.42` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-1 | 損益兩平互動試算工具 | `v1.6.8` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-3 | 現金流量預算表 | `v1.13.3` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |
| 4-4 | 停業、歇業與解散導航 | `v1.6.2` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/` | `2026-09-29` | DEPLOYED / PUBLIC SMOKE PENDING |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準；下表為 115/09/29 署名與標題一致化改版（驗證表：shengyan-knowledge「工具十署名統一驗證表_v1_3」；1-3 另依其驗證表 v1_4）合入前自發布分支實算；公開頁 smoke 核對後改記 LIVE。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.5` | 79,643 | `022504aace5ea0e0a02d7e28dec5db0a028bd4a3ee116585cb3d958387c4943b` |
| 1-3 | `v1.0.7` | 41,705 | `b05022b29fc7e8e94d0fe52b0db8451f13b3818d0bfc71807bd4b8acd1fbab71` |
| 2-1 | `v2.1.3` | 116,644 | `2de8be00158f6736d4d5f247af64e1537118071351388d3835c899d751af0da2` |
| 2-2 | `v1.8.5` | 110,982 | `3762ada8b9870ad11fb836917668b906e4cd17f96d839cd3d5928a66a1d9f9d2` |
| 3-2 | `v1.5.42` | 935,609 | `9a232e61c0cca6e1b25098bfcb6bb7103651e2b249ce1a78ff96a76790aed771` |
| 4-1 | `v1.6.8` | 133,571 | `a869f89108db5ba1da98f0456d872469b72b096203aa44530a23775aedcdf24b` |
| 4-3 | `v1.13.3` | 1,011,703 | `028b8840fee64780658c9256de774981091f4156184a4772257253bfc344ffa9` |
| 4-4 | `v1.6.2` | 93,984 | `4663e9935d6d743cbdbd53989a074e25e7e1504788cdceb64233bfc253e6a4fe` |

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
