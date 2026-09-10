# Claude Code｜六支工具技術實作稽核報告

Six Tool Technical Implementation Audit Report

| 項目 | 內容 |
|---|---|
| 日期 | 2026-09-10 |
| Repository | `sytax-academy/shengyan-tools` |
| Repo HEAD | `dd81fdc` |
| Audit branch | `claude/control-pack-review-mputrl` |
| Mode | `REVIEW-ONLY` |
| Control pack | `Claude_Code_Six_Tool_Audit_Control_Pack_ONE_FILE_20260910.md` |
| 稽核性質 | 技術實作稽核。不裁定法律、稅務、費率、門檻、公式或 Product Rule 正確性 |

**最終判定：TECHNICAL REMEDIATION REQUIRED**

判定理由列於本報告最末節。此判定僅就技術實作而言，不構成對任何工具內容正確性的評價。

---

## 1. 輸入身分回讀（Input identity readback）

六支工具中**五支雜湊完全相符，一支不符**。

| Tool | Manifest bytes | Repo bytes | Manifest SHA-256 | Repo SHA-256 | 結果 |
|---|---|---|---|---|---|
| 1-1 | 78,813 | 78,813 | `0d2feba0…c075eac` | `0d2feba0…c075eac` | 相符 |
| 2-1 | 116,297 | 116,297 | `1d5909c4…82716c4` | `1d5909c4…82716c4` | 相符 |
| 2-2 | 108,837 | 108,837 | `8279c5bf…9690a50` | `8279c5bf…9690a50` | 相符 |
| **3-2** | **789,817** | **597,913** | **`a2558513…cab7324f`** | **`e60122e5…ce4b5472`** | **不相符** |
| 4-1 | 133,590 | 133,590 | `cd0d4c3f…d9e1626` | `cd0d4c3f…d9e1626` | 相符 |
| 4-3 | 1,011,643 | 1,011,643 | `c415be3c…ea1dedb` | `c415be3c…ea1dedb` | 相符 |

Manifest 所列檔名帶版號（例如 `1-1_開公司決策工具_v3.6.4_final-release(3).html`），repo 內依 `DEPLOYMENT.md`「公開 Runtime 一律命名為 `index.html`」的規則存放為 `<Tool ID>/index.html`。除 3-2 外，位元組數與 SHA-256 逐一相符，因此檔名差異屬既定部署命名規則，不構成身分疑義。

### 1.1 3-2 身分不符的處置

Manifest 指名 v1.5.6；repo HEAD 為 v1.4.3。這**不是**檔案遺失，而是版本回退：

```
b11d9c2  部署 3-2 v1.4.3、4-1 v1.6.7、4-3 v1.13.1 正式版本
cb8cfe7  Deploy 3-2 v1.5.6 final runtime
88fd381  Rollback 3-2 production to v1.4.3 after v1.5.6 live search regression
```

Manifest 指名的 blob 存在於 `cb8cfe7:3-2/index.html`，其 SHA-256 與 manifest 逐字相符。

依 control pack「do not silently substitute another version; report the mismatch」，本次採取的作法是：**兩個 build 都稽核，並分開列示**。以 repo HEAD（v1.4.3，即目前公開的 runtime）為主體，另將 manifest 指名的 v1.5.6 由 git history 取出至 `audit_harness/inputs/3-2_v1.5.6_manifest_named.html`（唯讀，未寫回 repo）獨立測試。此舉不是替代，而是把兩者的差異本身當成稽核標的；差異結果見 T32B-01，該結果獨立證實了 rollback commit message 所記載的原因。

`DEPLOYMENT.md` 與 `3-2/README.md` 兩處均已記為 v1.4.3 / `DEPLOYED / PUBLIC SMOKE PENDING`，與 repo 實際內容一致。不一致者僅為 audit manifest 本身。

---

## 2. 環境與實際執行的檢查（Commands / tests actually run）

### 2.1 環境

| 項目 | 內容 |
|---|---|
| OS | Linux 6.18.44 (container) |
| Node | v22.22.2 |
| Playwright | 1.56.1 |
| Browser engine | Chromium 1194（`/opt/pw-browsers/chromium-1194`）|
| Static server | `http-server` @ `127.0.0.1:8099`，document root 為 repo 根目錄 |
| Python | 3.11.15（用於 XLSX ZIP/OOXML 結構驗證）|

### 2.2 靜態檢查

1. `sha256sum` / `stat` 對六支 artifact 逐一比對 manifest。
2. `git rev-list` / `git cat-file` 追溯 3-2 歷史版本並取出 manifest 指名 blob。
3. 以 Node 腳本切出全部 `<script>` 與 `<style>` 區塊（`audit_harness/scripts/extract.js`）。
4. `node --check` 對 8 個切出的 script 做語法檢查。
5. 約 70 項靜態指標掃描（`audit_harness/scripts/static.js`）：DOM 注入形態、事件註冊、儲存 API、數值處理、a11y 屬性、語意標籤、CSS 指標。
6. 媒體查詢感知的 CSS cascade 分析：以 brace-depth walker 記錄每條規則的 @-rule context，再依 context + selector 分組，統計真正重複宣告同一屬性者。
7. 外部依賴與連結行為掃描（`target="_blank"` / `rel="noopener"` / 外部 script 與 stylesheet）。
8. XLSX 匯出檔以 Python `zipfile` 驗證 ZIP 完整性與 OOXML part 結構。

### 2.3 執行期檢查

9. 六支工具（含 3-2 兩個 build，共 7 個 artifact）在 **1200 / 768 / 390 / 320 CSS px** 逐一載入，擷取：`document.compatMode`、水平溢位、超出視窗的元素、互動元素尺寸、標籤解析、標題結構、landmark、執行期重複 id。
10. Console error / warning、`pageerror`、`requestfailed` 全程監聽。
11. **真實鍵盤 Tab 掃描**（每支 70 次 Tab），於每個停留點讀取 computed style 判定 focus 可見性，並偵測 focus trap。
12. 主要流程操作：1-1 與 2-1 的問答流程（含前進、上一題、重新開始）、2-2 的受僱者與負責人兩條計算路徑、3-2 的搜尋與分類瀏覽（兩個 build 同題比對）、4-1 的完整成本模型與匯出、4-3 的表格輸入與模式切換。
13. 輸入邊界測試：對 2-2、4-1、4-3 施以同一組輸入類別（負值、非數字、科學記號、超長位數、多位小數、空字串、空白）。
14. 狀態與持久化：4-3 的 localStorage 自動保存、重新載入還原、JSON 匯出與匯入 roundtrip、XLSX 匯出、清空重填。
15. **惡意／畸形匯入測試**（4-3）：非 JSON、空物件、錯誤結構、prototype pollution payload、項目名稱夾帶 XSS、極端數值，共 6 例。
16. **XSS 探針**（3-2 兩個 build）：於搜尋框輸入 `<img src=x onerror=…>`，檢查是否執行。
17. 截圖存證：7 個 artifact × 4 寬度 = 28 張。

### 2.4 產生的檔案

```
audit_harness/inputs/     3-2_v1.5.6_manifest_named.html（由 git history 取出，唯讀）
audit_harness/scripts/    extract.js static.js runtime.js flows.js flows2.js flows3.js flows4.js t22.js t41.js t43.js
audit_harness/results/    extract_report.json static_report.json runtime_report.json
                          flows2.json flows3.json *_log.txt
                          extracted/  （切出的 JS 與 CSS）
                          shots/      （28 張截圖）
                          4-1_export.xlsx 4-3_export.xlsx 4-3_progress.json imp_*.json
audit_output/             本報告與其餘三份產出
```

**六支 production HTML 全程未被修改。** 可以 `git status` 驗證：僅 `audit_harness/` 與 `audit_output/` 為新增。

---

## 3. 環境限制（Environment limitations）

以下事項**未**被驗證，結論的射程不及於此：

1. **單一瀏覽器引擎。** 全部執行期結果來自 Chromium 1194。未測試 WebKit（iOS Safari）與 Gecko（Firefox）。這對 T43-01（quirks mode）特別重要：quirks mode 的實際影響正是各引擎不一致之處，而本次只能證明「Chromium 下未觀察到破圖」，不能證明其他引擎亦然。
2. **無實機觸控測試。** 390 / 320 px 為桌面瀏覽器視窗尺寸模擬，非實際行動裝置。觸控目標尺寸為幾何量測，未做實指點擊成功率測試。
3. **無輔助技術實測。** a11y 結論來自 DOM 與 computed style 的程式化檢查（可及名稱解析、標題結構、landmark、focus 可見性），未以 NVDA / JAWS / VoiceOver 實際朗讀驗證。
4. **無視覺回歸基準。** repo 內無既有截圖基準，因此「版面正確」只能以「無水平溢位、無超出視窗元素、無 console error」等機械指標表述，不含視覺正確性判斷。
5. **未驗證 GitHub Pages 實際線上行為。** 全部測試在本機 static server 進行。`DEPLOYMENT.md` 所載 3-2 的 `PUBLIC SMOKE PENDING` 狀態不在本次射程內。
6. **XLSX 僅驗證結構，未驗證試算表語意。** 已確認兩支匯出檔為合法 ZIP 與 OOXML package，但**未**以 Excel 或 LibreOffice 開啟確認公式求值結果。4-3 匯出含 SUM 與跨欄參照公式，其求值正確性未經驗證。
7. **未做效能量測。** 4-3 為 1,011,643 bytes、3-2 為 597,913 bytes，本次未量測低階行動裝置的載入與互動延遲。
8. **計算正確性完全不在射程內。** 本稽核只檢查程式自身可推導的一致性（例如同一輸入是否產生同一輸出、輸出是否對應當前輸入），**不驗證任何費率、級距、門檻、公式或法規適用**。凡結論需要外部權威值者，一律標為 `NEEDS_PRODUCT_SOT`。

---

## 4. 各工具發現（Per-tool findings）

### 4.0 統計總覽

| Tool | Critical | High | Medium | Low | 小計 |
|---|---|---|---|---|---|
| 1-1 | 0 | 0 | 0 | 2 | 2 |
| 2-1 | 0 | 0 | 3 | 1 | 4 |
| 2-2 | 0 | 1 | 2 | 2 | 5 |
| 3-2（v1.4.3，現行公開版）| 0 | 0 | 0 | 0 | 0 |
| 3-2（v1.5.6，manifest 指名版，未上線）| 0 | 1 | 0 | 0 | 1 |
| 4-1 | 0 | 0 | 3 | 2 | 5 |
| 4-3 | 0 | 1 | 3 | 3 | 7 |
| 身分層（ID-01）| 0 | 1 | 0 | 0 | 1 |
| 跨工具（CT-01…CT-06）| 0 | 0 | 3 | 3 | 6 |
| **合計** | **0** | **4** | **14** | **13** | **31** |

另有 6 項候選發現經複驗後**未能重現**，列於第 6 節。

### 4.1 全體共通的技術強項

先記錄實測確認的強項，因為它們界定了後續問題的性質：

- **零 JavaScript 執行期錯誤。** 七個 artifact × 四個寬度，`pageerror` 全程為 0，console error 為 0（唯一出現過的 404 經複驗為瀏覽器 favicon 探測，見 NR-03）。
- **零語法錯誤。** 8 個切出的 script 全數通過 `node --check`。
- **320 px 零水平溢位。** 七個 artifact 在最窄寬度下 `scrollWidth === innerWidth`，且無任何元素超出視窗。4-3 的寬表格正確置於 `.scroll` 容器內（client 264 px / scroll 1135 px）以橫向捲動處理。
- **Focus 可見性完整。** 真實鍵盤 Tab 掃描下，六支工具**沒有任何一個**停留點缺少可見 focus 指示。無 focus trap。
- **完全自足、零外部執行期依賴。** 六支皆無外部 `<script>` 或 `<link rel=stylesheet>`；所有外部 URL 皆為使用者可點的官方法源連結。
- **`target="_blank"` 全數配 `rel="noopener"`**（1-1: 2/2、2-1: 15/15、2-2: 8/8、3-2: 70/70、4-1: 1/1、4-3: 1/1）。
- **零 `eval` / `new Function` / `document.write`。**
- **3-2 搜尋輸入已正確跳脫。** XSS 探針未執行，無注入節點。
- **`prefers-reduced-motion` 六支皆有處理。**

### 4.2 Tool 1-1｜開公司決策工具（v3.6.4）

**判定：技術實作健全，僅有版本標示與撰寫慣例的輕微問題。**

13 步問答流程實測正常：選項推進、`上一題`（第 1 步正確為 disabled）、`重新開始` 皆如預期；側欄進度導覽對未到達的步驟正確 disable（`[false,true,true,true,true,true]`）。結果畫面正確渲染。`aria-pressed` 有設置。選項中的「✓ 已選」標記為 `display:none`，不會被輔助技術誤讀為全部選項皆已選取。

| ID | Sev | Status | 摘要 |
|---|---|---|---|
| T11-01 | Low | CONFIRMED | 檔內版本字串為 v3.6.2 / v3.6.0，與發布版 v3.6.4 不符 |
| T11-02 | Low | CONFIRMED | 混用 inline `onclick` 與 `addEventListener` |

### 4.3 Tool 2-1｜地址登記決策工具（v2.1.2）

**判定：流程正確，但有一項對外可見的發布衛生問題與一項結構性 a11y 缺口。**

問答流程、`上一題`、`重新開始` 實測皆正常，無執行期錯誤。

| ID | Sev | Status | 摘要 |
|---|---|---|---|
| T21-01 | Medium | CONFIRMED | 正式頁面 `<title>` 含內部流程標籤「v2.1.2 Remediation Candidate」 |
| T21-02 | Medium | CONFIRMED | 全頁無任何 `<h1>`–`<h6>`，標題以 `.q-title` 等 class 承載 |
| T21-03 | Medium | CONFIRMED | 48 個 selector 在同一 cascade context 重複宣告同一屬性 |
| T21-04 | Low | CONFIRMED | 互動全部走 inline `onclick` 呼叫全域函式，`addEventListener` 為 0 |

T21-01 與 T21-02 兩項合計使 2-1 成為六支中發布完成度最低者。T21-01 尤其值得優先處理：`<title>` 是瀏覽器分頁名稱、書籤預設名稱與搜尋結果標題，而此工具以會計師個人品牌對外公開。

### 4.4 Tool 2-2｜投保級距試算工具（v1.8.3）

**判定：本次稽核中技術問題最集中的工具，含唯一一項會使畫面數字與輸入不符的缺陷。**

計算路徑本身可運作（受僱者與負責人兩條路徑皆有輸出），CSS 為六支中唯一零重複宣告者，35 個欄位中 34 個有正確標籤。問題集中在輸入驗證與輸出狀態管理。

| ID | Sev | Status | 摘要 |
|---|---|---|---|
| **T22-01** | **High** | **CONFIRMED** | 輸入變為無效或清空後再計算，畫面**保留前一次結果**，無錯誤提示、無過期標示 |
| T22-02 | Medium | CONFIRMED | 完全沒有驗證回饋層：無效輸入為靜默 no-op，無 `aria-invalid`、無錯誤訊息 |
| T22-03 | Medium | CONFIRMED | 12 個互動元素小於 24×24 px，含 13×13 px radio 與 48×14 px 內文連結 |
| T22-04 | Low | CONFIRMED | `select#bRole` 無可及名稱 |
| T22-05 | Low | NEEDS_PRODUCT_SOT | 薪資輸入無上下界，接受 0.4 與 999,999,999 |

**T22-01 的具體重現**：輸入 45800 → 計算 → 顯示「對應投保級距 45,800／人事成本 54,879」。改輸入 `abc` → 再按計算 → 畫面**仍顯示 45,800 與 54,879**，`#res` 仍帶 `on` class，`#eSal` 無 `aria-invalid`，全頁無錯誤節點。`-5`、`0`、空字串結果相同。

值得注意的是：**在新載入的頁面上，同樣的無效輸入正確地不產生任何結果**（`#res` 不帶 `on`）。這表示拒絕計算的邏輯存在且正確，缺的只是「拒絕時清除輸出區」這一步。因此這是一個範圍明確、修法明確的缺陷，而非驗證邏輯的全面缺失。

T22-02 與 T22-01 為同一根因的兩面：因為沒有失敗呈現的出口，被拒絕的計算無處報告自己，前一次結果就留在原地。

### 4.5 Tool 3-2｜常見費用報帳與抵稅速查工具

此工具需分兩個 build 陳述。

#### 4.5.1 v1.4.3（repo HEAD，目前公開版）

**判定：本次稽核中技術狀態最乾淨的工具，零發現。**

- 搜尋：`餐費` → 5 項、`停車` → 2 項、`汽車` → 1 項、`員工旅遊` → 1 項、無命中詞 → 「找不到符合的項目」、清空 → 正確回到 `browse` 狀態。
- 分類瀏覽：12 張分類卡，展開、切換、收合皆正確維護 `aria-expanded` 與 `hidden`。
- XSS 探針未執行；`esc()` 正確處理搜尋輸入。
- 107 個互動元素在四個寬度下**全數** ≥ 44×44 px。
- 標題結構完整（1 個 h1、5 個 h2、3 個 h3、無跳級），`main` / `header` / `footer` landmark 齊備。
- 70 個外部法源連結全數帶 `rel="noopener"`。

一項觀察（未列為 finding）：`esc()` 只跳脫 `& < >`，不跳脫引號，而它有被用於屬性位置（`href="${esc(x[1])}"`、`data-chip="${esc(s)}"`）。目前這些位置的資料皆為程式內建常數，非使用者可控，因此**不存在可利用路徑**。記錄於此僅因該模式在未來若被餵入外部資料會成為注入點。

#### 4.5.2 v1.5.6（manifest 指名版，已回退，未上線）

| ID | Sev | Status | 摘要 |
|---|---|---|---|
| **T32B-01** | **High** | **CONFIRMED** | 常見單品查詢回傳釐清提示而非結果 |

同一組查詢、同一測試腳本，兩個 build 的差異：

| 查詢 | v1.4.3（現行） | v1.5.6（manifest 指名） |
|---|---|---|
| 餐費 | 找到 5 項結果 | 找到 5 項結果 |
| 停車 | **找到 2 項結果** | **先確認搜尋方向** |
| 汽車 | **找到 1 項結果** | **先確認搜尋方向** |
| 員工旅遊 | **找到 1 項結果** | **先確認搜尋方向** |
| zzz不存在 | 找不到符合的項目 | 找不到符合的項目 |

輸入路徑本身在兩個 build 皆正常（`餐費` 與無命中詞行為一致），因此差異來自 v1.5.6 新增的查詢路由／釐清層。此結果獨立證實了 rollback commit 所記載的「live search regression」。

**「停車」應直接給答案還是應該釐清，是 product 決定，本稽核不裁定**；技術上可確認的是：v1.5.6 改變了最常見查詢的行為，且此改變未被任何自動化測試攔截。這正是 CT-05（無測試基礎建設）的具體代價。

### 4.6 Tool 4-1｜損益兩平互動試算工具（v1.6.7）

**判定：六支中輸入驗證做得最完整者，問題集中在 CSS 殘留與一個無確認的破壞性操作。**

驗證層值得作為全家族的範本，實測逐項回應具體訊息並設置 `aria-invalid`：

| 輸入 | 回應 |
|---|---|
| `-100` | `本工具不支援負值，請填 0 或正數` |
| `abc` | `請輸入一般數字，最多 2 位小數；不要使用科學記號、斜線或多個小數點` |
| `1e9` | 同上（科學記號被拒） |
| `1.234` | 同上（超過 2 位小數被拒） |
| 空字串 | `aria-invalid="false"`，無錯誤（正確：空值非錯誤） |

XLSX 匯出實測產生 13,018 bytes、7 個 entry、3 個工作表的合法 OOXML package，且完全不依賴任何外部函式庫。

| ID | Sev | Status | 摘要 |
|---|---|---|---|
| T41-01 | Medium | CONFIRMED | 整組 legacy design token 為死碼：第一個 `:root` 的 18 個變數全被第二個 `:root` 以不同值覆寫 |
| T41-02 | Medium | CONFIRMED | `#resetBtn`「回到課程範例數字」無確認即丟棄全部輸入，且無持久化可復原 |
| T41-03 | Medium | CONFIRMED | 82 個 selector 在同一 context 重複宣告同一屬性；三個斷點的 media block 各出現兩次 |
| T41-04 | Low | CONFIRMED | 檔內版本字串以 v1.6.6 為主（3 次），與發布版 v1.6.7 不符 |
| T41-05 | Low | CONFIRMED | 無 `<main>` landmark |

T41-02 的份量來自 4-1 收集的資料量：資產列、8 列固定成本、3 列變動成本、售價、銷量、目標利潤。一次點擊即不可逆地清空，而按鈕標籤讀起來像導覽動作而非破壞性動作。

### 4.7 Tool 4-3｜現金流量預算表（v1.13.1）

**判定：資料處理是六支中最穩健的，但文件層有一項基礎缺陷。**

先記錄實測確認的強項，因為它們相當突出：

- **惡意匯入全數被正確擋下**，且每種情況都有具體訊息、且原有畫面與已存進度均未被覆寫：
  - prototype pollution payload → `檔案結構異常，為安全起見不予載入。`（實測 `({}).polluted` 為 null，未被污染）
  - 項目名稱夾帶 XSS → 未執行
  - 非 JSON → `這個檔案讀不出來。原本畫面與已保存進度沒有被更動。`
  - 極端數值 → `第 1 列第 1 個月的數字不合法（不可為負數或非數值）。`
  - 缺月份基準的舊版檔 → 進入明確的復原模式而非猜測
- **自動保存有錯誤閘門**：儲存格出現無效值時，指示器切為`有錯誤輸入，暫停自動保存（已保留上一版）`，不以壞資料覆寫既有進度。
- **匯出／匯入 roundtrip 正確**：JSON 匯出 3,034 bytes，重新載入後 64 個數值儲存格完整還原。
- **重新載入還原正確**，localStorage key `cashflow-budget-v7`。
- **清空重填有 `confirm()` 保護**，且執行後非零儲存格歸零。
- 320 px 下寬表格正確以橫向捲動容器處理。

| ID | Sev | Status | 摘要 |
|---|---|---|---|
| **T43-01** | **High** | **CONFIRMED** | 無 DOCTYPE，四個寬度下皆為 quirks mode（`BackCompat`）|
| T43-02 | Medium | CONFIRMED | 無 `<html lang>`（`documentElement.lang` 為 null）|
| T43-03 | Medium | CONFIRMED | 錯誤／確認／復原介面全部依賴原生 `alert`/`confirm`/`prompt`，19 處 |
| T43-05 | Medium | CONFIRMED | 87 個 selector 重複宣告同一屬性，並以 `!important` 解衝突 |
| T43-04 | Low | CONFIRMED | 內嵌 SheetJS 0.18.5（639,125 bytes，佔檔案 84%），但只用到三個寫入端 helper |
| T43-06 | Low | CONFIRMED | 兩個表單控制項無可及名稱 |
| T43-07 | Low | NEEDS_PRODUCT_SOT | 金額儲存格接受任意精度小數（3.14159 被判為有效）|

**關於 T43-01 的誠實表述**：quirks mode 本身已確認（`document.compatMode === 'BackCompat'`，其餘五支皆為 `CSS1Compat`）。但在測試的 Chromium build 下**未重現任何版面破損**。因此本項的嚴重度來自「最大的正式產出建立在非標準文件模式上，且此模式的實際影響正是各瀏覽器引擎不一致之處，而本次只測了一個引擎」，而非來自已觀察到的破圖。修正只需一行，但**會改變 table 與 inline 的度量方式，因此必須連帶做完整的四寬度版面複驗**。

**關於 T43-04 的射程限制**：0.18.5 早於 SheetJS 已知安全公告的修補版本，但該等公告的受影響路徑在**檔案讀取**端。本工具的匯入路徑是 JSON（`FileReader` + `JSON.parse`），全檔不存在 `XLSX.read` / `XLSX.readFile` / `sheet_to_json` 呼叫，**解析器永遠不會被進入**。因此本項未被認定為可利用的安全漏洞，嚴重度定為 Low；留存的問題是一個過時、無法被觸及卻仍佔去最大工具 84% 下載量的解析器，且其版本號會持續出現在任何依賴掃描結果中。

---

## 5. 跨工具發現（Cross-tool findings）

詳見 `Six_Tool_Cross_Tool_Patterns.md`。摘要：

| ID | Sev | Status | 摘要 |
|---|---|---|---|
| CT-04 | Medium | CONFIRMED | 4-1 與 4-3 以兩種完全不同的方式各自實作 XLSX 匯出 |
| CT-05 | Medium | CONFIRMED | Repo 完全沒有任何自動化測試或 CI |
| CT-06 | Medium | NEEDS_PRODUCT_SOT | 三支數值工具採用三套互相矛盾的輸入定義域 |
| CT-01 | Low | CONFIRMED | 六支皆無 meta description、favicon、theme-color |
| CT-02 | Low | CONFIRMED | landmark 使用不一致，三支無 `<main>` |
| CT-03 | Low | CONFIRMED | 事件註冊、持久化、驗證三種策略各工具各行其是 |

---

## 6. 未能重現的候選發現（NOT_REPRODUCED）

以下 6 項在初次掃描中被標記，經複驗後**確認不成立**，一併列出以說明量測方法的界線。

| ID | 工具 | 原始主張 | 不成立的原因 |
|---|---|---|---|
| NR-01 | 3-2 | DOM 重複 id `resultHeading` | 靜態掃描把 script 內的樣板字串當成 markup。分離後 markup 內 0 次、JS 內 2 次，且分屬同一 render 函式的互斥分支。執行期重複 id 檢查在四個寬度、所有搜尋詞下皆為空集合 |
| NR-02 | 全部 | 23 個元素無可見 focus 指示 | 初次探針以 `element.focus()` 程式化取得焦點，Chromium 對此不套用 `:focus-visible`。改以真實 Tab 鍵事件複測，六支工具**皆為 0** |
| NR-03 | 1-1, 4-1, 4-3 | 載入時 console 404 | 僅出現於冷啟動的第一次載入。在導覽前掛上 response listener 後，整頁請求清單只有文件本身一筆，無任何 status ≥ 400；server access log 亦無 404。為瀏覽器 favicon 探測，關聯 CT-01 |
| NR-04 | 4-1 | 情境表格渲染 7 個空列 | `innerText` 因該區域當下未被 render 而回傳空字串。同一時點的 `innerHTML` 顯示資料完整（`40%` / `80` / `40,000` / `-30,000`）|
| NR-05 | 4-1 | 無 reset／clear 控制項 | 控制項存在，為 `button#resetBtn`「回到課程範例數字」。初次掃描以 `/重新\|清空\|重設/` 比對標籤而未命中。該控制項另有真實問題，已另列為 T41-02 |
| NR-06 | 4-3 | XLSX 匯出的欄位參照會越界 | `COL` 有 7 個元素、`N` 固定為 7，迴圈最大索引為 6，不可能越界。匯出檔已驗證合法。僅留為潛在耦合：若日後調高 `N` 而未擴充 `COL`，會靜默產生 `undefined` 參照 |

NR-01、NR-02、NR-04 三項若未複驗，會分別產生一個不存在的 DOM 缺陷、一個涵蓋兩支工具的假 a11y 缺陷、與一個不存在的渲染缺陷。

---

## 7. `NEEDS_PRODUCT_SOT` 項目

以下事項的技術現象已確認，但**正確目標值不在 repository 或 control pack 內**，因此不裁定為 product defect：

| ID | 工具 | 需要的外部依據 |
|---|---|---|
| T22-05 | 2-2 | 薪資輸入的有效定義域（下限、上限、小數位數）與級距上限規則 |
| T43-07 | 4-3 | 金額儲存格的精度規範（是否允許小數、允許幾位）|
| CT-06 | 2-2 / 4-1 / 4-3 | 全家族統一的數值輸入契約（正負、量級上限、小數位、拒絕呈現方式）|
| T32B-01 | 3-2 v1.5.6 | 模糊查詢應直接給結果或應釐清的預期行為（regression 本身已 CONFIRMED，僅目標行為需 SOT）|

另需說明：**本稽核未對任何費率、級距、門檻、公式或法規適用作成判斷，亦未宣告任何工具的計算結果正確或不正確。** 凡報告中出現的數字（如 45,800、54,879）皆僅作為「同一輸入是否產生同一輸出」「輸出是否對應當前輸入」的一致性證據使用，不含對其實質正確性的任何主張。

---

## 8. 建議修復順序（Recommended remediation order）

排序依據為：對使用者可見的錯誤資訊優先，其次為對外品牌可見性，再次為結構性基礎，最後為維護性殘留。

**第一批｜使用者會看到錯誤資訊**

1. **T22-01**（2-2，High）— 計算被拒時清除輸出區。這是唯一一項會讓使用者看到與輸入不符之數字的缺陷，且修法明確（拒絕邏輯已存在且正確）。
2. **T22-02**（2-2，Medium）— 補上驗證回饋層。與第 1 項同根因，宜同批處理；可直接移植 4-1 既有實作。

**第二批｜對外可見的發布衛生**

3. **T21-01**（2-1，Medium）— 移除 `<title>` 中的「Remediation Candidate」。單行修改，但影響分頁名稱、書籤、分享卡片與搜尋結果。
4. **ID-01**（身分層，High）— 確定 3-2 的稽核主體版本並更正 manifest 的大小與雜湊。此項不改程式，只改紀錄。

**第三批｜結構性基礎**

5. **T43-01 + T43-02**（4-3，High/Medium）— 補 DOCTYPE 與 `<html lang>`。**必須連帶做四寬度版面複驗**，因為切換至標準模式會改變 table 與 inline 度量。
6. **T21-02**（2-1，Medium）— 將 `.q-title` / `.result-title` 提升為真正的標題元素，保留既有 class 使視覺不變。
7. **T41-02**（4-1，Medium）— 為 reset 加上確認步驟。
8. **T22-03**（2-2，Medium）— 放大 radio 與內文連結的觸控目標。

**第四批｜測試基礎建設**

9. **CT-05**（Medium）— 建立最小 Playwright 測試套件與 GitHub Actions workflow。置於此處而非更前面，是因為前八項的驗收本身就需要它；但它也是唯一能防止 T32B-01 類事件重演的措施。斷言清單見 `Six_Tool_Test_Inventory.md`。

**第五批｜產品契約對齊（需外部 SOT）**

10. **CT-06 / T22-05 / T43-07** — 取得統一的數值輸入契約後一次套用三支工具。
11. **T32B-01** — 確定模糊查詢的目標行為後，才可考慮 v1.5.6 路線的再發布。

**第六批｜維護性殘留（無使用者可見影響）**

12. **T41-01**（4-1）— 刪除死掉的 `:root` 調色盤（需先以視覺快照證明確實未被使用）。
13. **T43-05 / T41-03 / T21-03** — 收斂重複 CSS 宣告與多餘的 `!important`。
14. **CT-04 + T43-04** — 統一 XLSX 匯出實作，藉此移除 SheetJS bundle。
15. **CT-01 / CT-02 / CT-03 / T41-05 / T43-06 / T22-04 / T11-01 / T41-04 / T11-02 / T21-04** — 其餘 Low 項目，宜合併為一次「共通 header 與 a11y 收尾」處理。

---

## 9. 各工具是否值得建立專屬 repo 迴歸測試套件

| Tool | 建議 | 理由 |
|---|---|---|
| **4-3** | **值得，最高優先** | 六支中唯一具持久化、匯入、匯出、復原模式者。狀態機（normal / recovery / bridge）、localStorage roundtrip、惡意匯入拒絕行為都是高價值且完全確定性的斷言標的。目前這些行為的正確性只有本次稽核記錄在案，repo 內無任何保護 |
| **3-2** | **值得，最高優先** | 已有一次 regression 進入正式環境並回退。搜尋是純函式行為（查詢字串 → 結果集），是六支中最容易寫成表格式測試者。一組 query-to-outcome 表即可完全防止 T32B-01 重演 |
| **4-1** | **值得** | 驗證層行為豐富且確定性高（每個拒絕類別對應固定訊息），加上 XLSX 匯出可做結構斷言。同時它是全家族驗證契約的參考實作，應被鎖定 |
| **2-2** | **值得**（修復後立即建立） | 本次技術問題最集中者。T22-01 一旦修好，必須有測試確保「拒絕計算即清除輸出」不再退化，因為此缺陷在畫面上與正常結果外觀完全相同，靠目視不會被發現 |
| **1-1** | **建議納入共用套件，不需專屬** | 13 步問答流程為有限狀態機，值得一組路徑測試，但行為單純、無持久化、無匯出，以共用 smoke 套件涵蓋即足 |
| **2-1** | **建議納入共用套件，不需專屬** | 同 1-1。修復 T21-01 / T21-02 後，以共用套件斷言 title 與標題結構即可 |

**共用套件（六支皆適用）應涵蓋**：`document.compatMode === 'CSS1Compat'`、`documentElement.lang` 非空、恰有一個 `<h1>` 且無跳級、恰有一個 `main` landmark、四寬度無水平溢位、零 `pageerror`、零 console error、所有互動元素 ≥ 24×24 px、所有表單控制項有可及名稱、title 不含 candidate/draft/rc 等字樣。

---

## 10. 最終判定

### TECHNICAL REMEDIATION REQUIRED

判定依據：

1. **一項會使畫面顯示與輸入不符之數字的缺陷（T22-01，High，CONFIRMED）。** 2-2 在計算被拒後保留前一次結果，且無任何過期標示。此缺陷的外觀與正常結果完全相同，使用者無從自行察覺，而其內容為人事成本金額。
2. **一項基礎文件模式缺陷（T43-01，High，CONFIRMED）。** 最大的正式產出以 quirks mode 運行，且僅在單一瀏覽器引擎下驗證過。
3. **一項已確認的搜尋行為 regression（T32B-01，High，CONFIRMED）** 存在於 manifest 指名的 build 中，並已因此發生過正式環境回退。
4. **一項身分不符（ID-01，High，CONFIRMED）**：稽核 manifest 指名的 3-2 版本與 repository 內容不一致。
5. **零自動化測試（CT-05）**，使上述任一項的修復都無法被證明未造成新的退化。

同時應明確記錄的是：**沒有 Critical 級發現**，六支工具皆無執行期錯誤、無語法錯誤、無 XSS 可利用路徑、無外部執行期依賴、在 320 px 下皆無版面溢位、且鍵盤 focus 可見性完整。3-2 的現行公開版（v1.4.3）零發現。4-3 的惡意匯入防護（含 prototype pollution 阻擋）與錯誤閘門式自動保存，其嚴謹程度高於一般同類工具。

因此本判定的意義是「有明確且範圍可界定的技術項目必須先處理」，而非「整體實作品質不佳」。多數發現集中於少數幾支工具的特定面向，且修復路徑在報告中皆已指明；其中數項可直接移植同一 repo 內另一支工具的既有實作。

---

**本報告不使用亦不隱含 LOCKED、FINAL、BUILD AUTHORIZED、RELEASE APPROVED 等狀態。**
**本次為 REVIEW-ONLY：六支 production HTML 全程未被修改，未進行任何 merge 或 deploy。**
