# Six Tool Test Inventory

稽核日期：2026-09-10｜Repo：`sytax-academy/shengyan-tools` @ `dd81fdc`｜Mode：`REVIEW-ONLY`

本檔兩用：**上半部**記錄本次稽核實際執行過的檢查與結果（可重跑），**下半部**是建議寫入 repo 的迴歸測試清單，逐條對應到具體 finding。

---

## PART 1｜本次實際執行的檢查

### 1.1 Harness 檔案

| 檔案 | 用途 |
|---|---|
| `audit_harness/scripts/extract.js` | 切出所有 `<script>` 與 `<style>` 區塊到 `results/extracted/` |
| `audit_harness/scripts/static.js` | 約 70 項靜態指標掃描 → `results/static_report.json` |
| `audit_harness/scripts/runtime.js` | 7 artifact × 4 寬度的載入、溢位、觸控目標、a11y、console 掃描 |
| `audit_harness/scripts/flows.js` / `flows2.js` | Tab 掃描與流程探測（`flows.js` 含已修正的程式化 focus 探針）|
| `audit_harness/scripts/flows3.js` | 1-1 / 2-1 / 2-2 / 4-1 流程與驗證測試 |
| `audit_harness/scripts/flows4.js` | 2-2 逐輸入驗證、3-2 兩 build 搜尋比對、XSS 探針 |
| `audit_harness/scripts/t22.js` | 2-2 驗證與 stale-result 序列測試 |
| `audit_harness/scripts/t41.js` | 4-1 完整成本模型、reset、匯出 |
| `audit_harness/scripts/t43.js` | 4-3 持久化、匯入匯出 roundtrip、惡意匯入、清空 |

重跑方式：
```
npx http-server -p 8099 -s .
node audit_harness/scripts/extract.js '<targets json>'
node audit_harness/scripts/static.js
node audit_harness/scripts/runtime.js
node audit_harness/scripts/flows2.js && node audit_harness/scripts/flows3.js && node audit_harness/scripts/flows4.js
node audit_harness/scripts/t22.js && node audit_harness/scripts/t41.js && node audit_harness/scripts/t43.js
```

### 1.2 身分驗證

| 檢查 | 結果 |
|---|---|
| 六支 SHA-256 vs manifest | 5 相符、1 不符（3-2）→ ID-01 |
| 3-2 歷史版本追溯 | manifest 指名 blob 位於 `cb8cfe7:3-2/index.html`，雜湊逐字相符 |
| production HTML 未被修改 | 確認：`git status` 僅顯示 `audit_harness/` 與 `audit_output/` 為新增 |

### 1.3 靜態檢查結果

| 檢查 | 1-1 | 2-1 | 2-2 | 3-2 | 4-1 | 4-3 |
|---|---|---|---|---|---|---|
| `node --check` 語法 | PASS | PASS | PASS | PASS | PASS | PASS（含 vendor）|
| DOCTYPE | 有 | 有 | 有 | 有 | 有 | **無** |
| `<html lang>` | 有 | 有 | 有 | 有 | 有 | **無** |
| meta viewport | 有 | 有 | 有 | 有 | 有 | 有 |
| meta description | 無 | 無 | 無 | 無 | 無 | 無 |
| favicon | 無 | 無 | 無 | 無 | 無 | 無 |
| `eval`/`new Function`/`document.write` | 0 | 0 | 0 | 0 | 0 | 0 |
| 外部 script / stylesheet | 0 | 0 | 0 | 0 | 0 | 0 |
| `target=_blank` 配 `rel=noopener` | 2/2 | 15/15 | 8/8 | 70/70 | 1/1 | 1/1 |
| inline on* handlers | 4 | 10 | 0 | 0 | 0 | 0 |
| `addEventListener` | 1 | 0 | 26 | 8 | 18 | 16 |
| `removeEventListener` | 0 | 0 | 0 | 0 | 0 | 0 |
| localStorage | 0 | 0 | 0 | 0 | 0 | 2 |
| CSS 同 context 重複宣告同屬性 | 2 | **48** | **0** | 1 | **82** | **87** |
| `prefers-reduced-motion` | 有 | 有 | 有 | 有 | 有 | 有 |
| `prefers-color-scheme` | 無 | 無 | 無 | 無 | 無 | 無 |

### 1.4 執行期：四寬度掃描（1200 / 768 / 390 / 320 px）

| 檢查 | 結果 |
|---|---|
| `pageerror` | 全部 7 artifact × 4 寬度 = **0** |
| console error | **0**（唯一出現者經複驗為 favicon 探測，NR-03）|
| `requestfailed` | **0** |
| 水平溢位 `scrollWidth > innerWidth` | 全部 **0** |
| 超出視窗的元素（排除有捲動祖先者）| 全部 **0** |
| `document.compatMode` | 5 支 `CSS1Compat`、**4-3 為 `BackCompat`** |
| 執行期重複 id | 全部 **0** |
| 互動元素 < 24×24 px | **2-2 有 12 個**，其餘 5 支為 0 |
| 無可及名稱的表單控制項 | 2-2：1（`select#bRole`）；4-3：2；其餘 0 |
| `<h1>` 數量 | 1-1:1、**2-1:0**、2-2:1、3-2:1、4-1:1、4-3:1 |
| 標題跳級 | 全部 0 |
| `<main>` landmark | 1-1/2-1/3-2 有；**2-2/4-1/4-3 無** |

### 1.5 執行期：鍵盤與 focus

以真實 `Tab` 鍵事件各 70 次掃描：

| Tool | 唯一停留點 | 無可見 focus | focus trap |
|---|---|---|---|
| 1-1 | 10 | **0** | 無 |
| 2-1 | 5 | **0** | 無 |
| 2-2 | 23 | **0** | 無（但 8 個停留點尺寸 < 24px）|
| 3-2 | 45 | **0** | 無 |
| 4-1 | 51 | **0** | 無 |
| 4-3 | 41 | **0** | 無 |

### 1.6 執行期：主要流程

| Tool | 測試內容 | 結果 |
|---|---|---|
| 1-1 | 13 步問答推進、上一題、重新開始、側欄進度 gating | 全部 PASS。第 1 步「上一題」正確 disabled；未到達步驟正確 disabled |
| 2-1 | 問答推進至結論、上一題、重新開始、全域函式存在性 | 全部 PASS |
| 2-2 | 受僱者路徑計算、負責人路徑計算、8 種輸入類別 | 計算可運作；**驗證與輸出狀態管理有缺陷**（T22-01/02）|
| 3-2 v1.4.3 | 5 種查詢、清空、12 張分類卡展開/切換/收合、XSS 探針 | 全部 PASS，零發現 |
| 3-2 v1.5.6 | 同上同題比對 | **3 個常見查詢行為與 v1.4.3 不同**（T32B-01）|
| 4-1 | 行業預設、成本模型、5 種無效輸入、reset、XLSX 匯出、reload | 驗證層 PASS；**reset 無確認**（T41-02）|
| 4-3 | 範例載入、儲存格驗證、autosave 閘門、reload 還原、JSON 匯出匯入 roundtrip、XLSX 匯出、清空、6 種惡意匯入 | **全部 PASS**，資料處理穩健 |

### 1.7 執行期：安全探針

| 探針 | 目標 | 結果 |
|---|---|---|
| `<img src=x onerror=window.__X=1>` 輸入搜尋框 | 3-2 兩個 build | **未執行**，無注入節點 |
| JSON 匯入 `__proto__` / `constructor.prototype` payload | 4-3 | **被拒**：`檔案結構異常，為安全起見不予載入。`；`({}).polluted` 為 null |
| JSON 匯入項目名稱夾帶 XSS | 4-3 | **被拒**，未執行 |
| 非 JSON / 空物件 / 錯誤結構 / 極端數值匯入 | 4-3 | 全部有具體訊息，畫面與已存進度均未被更動 |

### 1.8 匯出檔驗證

| 檔案 | 大小 | ZIP 完整性 | OOXML part | 備註 |
|---|---|---|---|---|
| 4-1 匯出 | 13,018 bytes | `testzip` OK | 7 entries、3 sheets | 自製 writer，無外部依賴 |
| 4-3 匯出 | 22,519 bytes | `testzip` OK | 10 entries、含 styles/theme/metadata | SheetJS 0.18.5 產出 |
| 4-3 進度 JSON | 3,034 bytes | 可 `JSON.parse` | top-level keys: `v, startMonth, actualThrough, open, inflow, outflow, fixed, cash, cashOverride, mode` | roundtrip 還原 64 個儲存格 |

**未驗證**：兩支 XLSX 皆未以 Excel / LibreOffice 開啟確認公式求值結果。4-3 匯出含 SUM 與跨欄參照公式。

---

## PART 2｜建議寫入 repo 的迴歸測試

### 2.1 共用套件（六支皆適用）

每支工具都應通過。全部為確定性斷言，無需 fixture。

| # | 斷言 | 防止 | 對應 finding |
|---|---|---|---|
| S-01 | `document.compatMode === 'CSS1Compat'` | quirks mode 回歸 | T43-01 |
| S-02 | `documentElement.lang` 非空 | 語言宣告遺失 | T43-02 |
| S-03 | 恰有 1 個 `<h1>`，且標題無跳級 | 標題結構退化 | T21-02 |
| S-04 | 恰有 1 個 `main` landmark | landmark 不一致 | T41-05, CT-02 |
| S-05 | `document.title` 不符合 `/candidate\|draft\|rc\|remediation\|test/i` | 內部標籤外洩 | T21-01 |
| S-06 | 四寬度下 `scrollWidth === innerWidth` | 版面溢位 | 保護既有強項 |
| S-07 | `pageerror` 與 console error 皆為 0 | 執行期錯誤 | 保護既有強項 |
| S-08 | 所有可見互動元素 ≥ 24×24 px（目標 44×44）| 觸控目標過小 | T22-03 |
| S-09 | 所有表單控制項可解析出非空可及名稱 | 標籤遺失 | T22-04, T43-06 |
| S-10 | 真實 Tab 掃描下每個停留點皆有可見 focus | focus 可見性退化 | 保護既有強項（NR-02 提醒：**必須用真實鍵盤事件**）|
| S-11 | 所有 `target="_blank"` 皆帶 `rel="noopener"` | 新分頁劫持 | 保護既有強項 |
| S-12 | 無外部 `<script src>` 或 `<link rel=stylesheet>` | 引入外部依賴 | 保護既有強項 |
| S-13 | 有 meta description、favicon、theme-color | 頁面 metadata 缺失 | CT-01 |
| S-14 | 檔內版本字串（若保留）等於 `DEPLOYMENT.md` 所載版本 | 版本標示漂移 | T11-01, T41-04 |
| S-15 | manifest／release 紀錄的 SHA-256 等於該 commit 之 artifact 雜湊 | 身分不符 | ID-01 |

### 2.2 Tool 3-2 專屬（最高優先）

| # | 斷言 | 對應 |
|---|---|---|
| A32-01 | **Query-to-outcome 表**：每個受管控查詢對應固定的 `body.dataset.state`、heading 型態與結果數。至少涵蓋 `餐費`、`停車`、`汽車`、`員工旅遊`、`加油`、`租金`、無命中詞、空字串 | **T32B-01** |
| A32-02 | 清空搜尋框後 `dataset.state` 回到 `browse` 且結果區清空 | 狀態一致性 |
| A32-03 | 分類卡展開／切換／收合正確維護 `aria-expanded` 與 `hidden`，同時最多一張展開 | 保護既有強項 |
| A32-04 | XSS 探針輸入後無腳本執行、無注入節點 | 保護既有強項 |
| A32-05 | 搜尋輸入經 `esc()` 後在屬性位置不含未跳脫引號（若日後 `esc()` 被餵入外部資料）| 4.5.1 節觀察 |

A32-01 是本清單中投資報酬率最高的一項：它以近乎零成本完全防止 T32B-01 類事件。

### 2.3 Tool 2-2 專屬（修復後立即建立）

| # | 斷言 | 對應 |
|---|---|---|
| A22-01 | **序列測試**：有效輸入 → 有結果；接著改為無效輸入並計算 → **結果區必須清空或明確標示為過期** | **T22-01** |
| A22-02 | 每個無效輸入類別（負值、非數字、科學記號、空字串）→ 設 `aria-invalid` 且渲染錯誤訊息 | T22-02 |
| A22-03 | 編輯輸入但未按計算時，既有結果必須帶過期標示 | T22-01 |
| A22-04 | 所有 radio 與內文連結 ≥ 24×24 px（390/320 px）| T22-03 |
| A22-05 | 邊界表（取得 SOT 後）：下限、上限、小數位數 | T22-05 |

### 2.4 Tool 4-3 專屬（最高優先）

| # | 斷言 | 對應 |
|---|---|---|
| A43-01 | localStorage roundtrip：載入範例 → reload → 數值儲存格完整還原 | 保護既有強項 |
| A43-02 | 無效儲存格輸入 → autosave 暫停且**既有進度未被覆寫** | 保護既有強項 |
| A43-03 | **惡意匯入拒絕表**：prototype pollution、XSS 名稱、非 JSON、空物件、錯誤結構、極端數值 → 各自被拒且畫面與已存進度未變 | 保護既有強項 |
| A43-04 | JSON 匯出 → 匯入 roundtrip 後儲存格數量與值相符 | 保護既有強項 |
| A43-05 | 清空重填需確認；取消時資料不變 | 保護既有強項 |
| A43-06 | 匯出 XLSX 為合法 OOXML 且含預期公式 | T43-04, CT-04 |
| A43-07 | 320 px 下寬表格位於可橫向捲動容器內 | 保護既有強項 |
| A43-08 | 無原生 `alert`/`confirm`/`prompt` 觸發（改為 in-page 對話後）| T43-03 |

A43-02 與 A43-03 目前的正確行為**僅有本次稽核記錄在案**，repo 內無任何保護。這是 4-3 列為最高優先的主因。

### 2.5 Tool 4-1 專屬

| # | 斷言 | 對應 |
|---|---|---|
| A41-01 | 驗證訊息表：`-100`、`abc`、`1e9`、`1.234` 各自對應固定訊息並設 `aria-invalid`；空字串不算錯誤 | 保護參考實作 |
| A41-02 | reset 需確認；取消時輸入不變 | **T41-02** |
| A41-03 | XLSX 匯出為合法 OOXML，含預期工作表與儲存格 | CT-04 |
| A41-04 | 視覺快照（四寬度）——刪除死 `:root` 前後比對 | T41-01 |

### 2.6 Tool 1-1 / 2-1（納入共用套件即可）

| # | 斷言 | 對應 |
|---|---|---|
| A11-01 | 問答路徑走訪至結論；上一題／重新開始正確；第 1 步「上一題」為 disabled | 保護既有強項 |
| A11-02 | 側欄進度對未到達步驟保持 disabled | 保護既有強項 |
| A21-01 | 同 A11-01（2-1 版本）| 保護既有強項 |
| A21-02 | S-03（標題結構）與 S-05（title）對 2-1 特別關鍵 | T21-01, T21-02 |

### 2.7 建議的 CI 形態

工具為自足靜態 HTML：無 build、無 server 依賴、無 fixture。最小可行組態：

```
package.json          devDependency: @playwright/test
tests/shared.spec.js  S-01 … S-15，對六支 parametrize
tests/3-2.spec.js     A32-01 … A32-05
tests/2-2.spec.js     A22-01 … A22-05
tests/4-3.spec.js     A43-01 … A43-08
tests/4-1.spec.js     A41-01 … A41-04
tests/wizards.spec.js A11-01, A11-02, A21-01, A21-02
.github/workflows/ci.yml   on: [push, pull_request]
```

`DEPLOYMENT.md` 已以文字定義 release gate（「只有通過 Release Identity Lock 的正式 Runtime 才可部署」「`NOT EXECUTED` 不得視為 PASS」）。上列套件即為使該等 gate 具備可執行對應物的最小實作；S-15 直接對應 Release Identity Lock 的雜湊比對。

---

## PART 3｜量測方法的教訓

本次有 6 項候選發現經複驗後不成立。為避免未來測試複製同樣的錯誤，記錄如下：

| 教訓 | 來源 |
|---|---|
| Focus 可見性**必須**以真實鍵盤事件量測。`element.focus()` 不觸發 Chromium 的 `:focus-visible`，會產生大量假陽性 | NR-02（差點誤報兩支工具共 46 個假缺陷）|
| 單檔應用中，全檔 `id="..."` 計數會把 script 內的樣板字串當成 markup。必須先分離 markup 與 script | NR-01 |
| 內容存在性應斷言 `innerHTML` 或 `textContent`，不可用 `innerText`（其結果依賴 layout）| NR-04 |
| 控制項應以 role 與 id 列舉，不可依賴預期的標籤文字比對 | NR-05 |
| CSS 重複宣告分析必須感知 `@media` context，否則會把正當的斷點覆寫誤判為重複 | 初版分析誤報 55–147 項/工具 |
| 冷啟動的 console 雜訊須在導覽前掛 listener 並比對 server log 後才可採信 | NR-03 |
| 陣列索引越界的指控須先確認迴圈上界與陣列長度 | NR-06 |
