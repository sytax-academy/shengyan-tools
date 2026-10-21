#!/usr/bin/env node
/* 營業項目查詢（business-items）驗證程式：驗證表 v1_23（契約 c22；本批 c22b）期別一 99 列、刻意錯誤 E01～E47、E52、E55～E183 與補充刻意錯誤 X01～X21、改版前之判法（tools bf4c873 之驗證程式，v1_22 判法）。
 * c22b（驗證表 v1_23；規格 v1_24 不改；契約仍 c22）：頁面、建置程式不改，只改本程式。Q125 依判定方式三十六：法二於 window.dispatchEvent 派送 beforeprint 後、emulate print media 前，
 *   讀 details.basis 之 open，須為真（收合、已展開兩種起始各判一次；明細記「beforeprint後_emulate前open」）；其餘判法照 v1_22。E176（刪 beforeprint 之處理）由此抓到。
 *   改版前之判法：以 tools bf4c873 之 verify.js（v1_22 判法；SHA-256 核對）對本頁面跑 Q125 與 E176（--only Q125、--errs-only E176，各以 --dump 另存，不寫 results/），照記於結果.json 之 pre_revision。
 *   L05 截圖標記與 x4 輸出檔名沿用 c22（覆蓋，不增檔）。用法同 c22。以下為 c22 以前之說明，照錄。
 * c22（驗證表 v1_22；規格 v1_24）：頁面之列印樣式增頁尾收合列 ::details-content 之備援（content-visibility:visible、display:block，只在 @media print 之內），pageshow 之重設（resetAll）一併將 printOpen 設為 null（拘29、第十一節、第七節第五項）；其餘頁面不改。
 *   本程式改寫 Q125：一之法一依判定方式三十五之一，列印事件以頁面腳本執行前註冊（addInitScript）之 window capture 階段獨立監聽器計數認定（isTrusted 為真者為原生事件），
 *   分記「原生事件是否觸發」「原生 PDF 是否含顯名」「是否以 dispatchEvent 補觸發」「補觸發後 PDF 是否含顯名」；原生事件未觸發者法一記未執行、Q125 不判通過（補觸發不計原生路徑之通過）。
 *   新增（甲）列印事件不觸發時之備援（判定方式三十五之二：頁面腳本執行前以 capture 階段監聽器對 beforeprint 呼叫 stopImmediatePropagation；PDF 含顯名；另頁 emulate print 不派送事件，
 *   checkVisibility() 為真，回螢幕為假、open 為假）、（乙）連續列印兩種情境、（丙）afterprint 未派送後 pageshow、展開、再列印、（丁）一及（甲）至（丙）各情境結束時 localStorage、sessionStorage
 *   之長度、document.cookie、indexedDB.databases()；每一情境以新載入之頁面起始（判定方式三十五之三）。新增刻意錯誤 E178～E183（補丁以 c22 頁面之原字串為準）。
 *   期望值改讀 ext_c22_輸出.json。改版前之版本改為 c9302c5（c21 之頁面），跑 Q125。L05 截圖標記改 c22（張數不變）。用法同 c21（--spec 改給規格 v1_24）。以下為 c21 以前之說明，照錄。
 * c21（驗證表 v1_21；規格 v1_23）：頁面加 beforeprint（記錄頁尾收合列之 open 並展開）、afterprint（回復）兩事件之處理，列印時顯名必繪出（拘29、第十一節）；其餘頁面不改。
 *   本程式改寫 Q125 之顯名列印（判定方式三十四：收合與已展開兩種起始狀態各以兩法判一次：法一 page.pdf() 產生 PDF 並以 pdftotext 抽文字，實測 page.pdf() 是否觸發列印事件並記錄，
 *   不觸發者以 dispatchEvent 補觸發並註明；法二 dispatchEvent beforeprint 後 emulate print 判 checkVisibility()，再 dispatchEvent afterprint 判 open 回復）；Q72 之用語改稱「主文字」（判法不改）；
 *   新增刻意錯誤 E176（移除 beforeprint 之處理）、E177（afterprint 不回復）。期望值改讀 ext_c21_輸出.json（除 spec_sha256 外與 ext_c20 相同）。改版前之版本改為 fb163dd（c20b 之頁面），跑 Q125。
 *   L05 截圖標記改 c21（張數不變）。用法同 c20（--spec 改給規格 v1_23）。以下為 c20b 以前之說明，照錄。
 * c20b（驗證表 v1_20；規格 v1_22 不改）：頁面只為使外殼 L05（焦點框完整可見）通過，於 page_template.html 加預約與看全部工具之 scroll-margin-block:8px（外觀不變；使用者 115/10/20 裁定第三十四題）。
 *   判定方式三十二：外殼 F10、X06 之基準改為 make_base32.py 自 a47269e 之 git blob 產生之基準頁（只把 p#attribution 搬入頁尾收合列、為 summary 之後第一個內文元素），其餘外殼列之 a47269e 基準不變；
 *   判定方式三十三：Q106 以 textContent 定位顯名、Q122 展開後讀取（c20 已如此）、Q125 之「繪出」以 checkVisibility() 判定（不繪出＝display none 或 checkVisibility() 為假；顯名以 checkVisibility() 等於 details.open 判定）。
 *   L05 另以 element.focus() 補測（shell_v1_2.js）；L05 截圖標記改 c20b。改版前之版本改為 52d2f0d（c20 之頁面），跑 Q106、Q122、Q125、Q138。
 *   用法同 c20（另需 python3 執行 make_base32.py）。
 * c20（驗證表 v1_19；規格 v1_22）：頁面之顯名（attribution）移入頁尾收合列（details.basis）之內、summary 之後第一個內文元素、basis_item_1 之前（拘29、第十一節）；其餘頁面不改。
 *   本程式改寫 Q63（收合與展開分判；判後收回）、Q73（展開後依序含 attribution 與 basis_item_1～4）、Q123（展開後取顯名之 innerText）、Q125（顯名隨頁尾收合列之狀態：
 *   收合時不繪出、展開時繪出；繪出以 checkVisibility() 判，因收合之 details 內容為 content-visibility:hidden，getClientRects 仍有面積）、
 *   Q72（主文字〔v1_21 改稱，原稱可見文字〕＝複製連結後移除 aria-hidden="true" 之後代元素之文字，另記原始 innerText；射程及於看全部工具；c19 第八輪 G-01、B-07）、
 *   Q137（判定方式三十：不寫 index.html＝執行前後 SHA-256 相同且 os.stat 之 st_mtime_ns 相同）、Q42（只改計數之註記）；新增刻意錯誤 E172～E175（E173 另記 Q138 之 F02 與其他列之交叉失敗）。
 *   Q122（驗證表 v1_19 未改字面）：授權條款連結移入收合列後，收合時 innerText 為空，畫面文字改於展開頁尾收合列後讀取（期望不變）。
 *   Q138：外殼表 R02 之基準依判定方式三十一改為規格 v1_22 之收合列內文（R02_EXPECT；shell_v1_2.js 之 r02Expect），其餘照 c19；Z76 之紀錄改為「前提成立、植錯機制於本工具不生效」並記前提量測。
 *   改版前之版本改為 64b2966（頁面），跑驗證表 v1_19 改動之列；其 Q137 以 64b2966 之 build.py、ext_c19_輸出.json、page_template.html 與規格 v1_21（--spec-v1-21）執行。
 *   外殼之比對基準與 Q138 之舊版回測仍為 a47269e（BASE_COMMIT；規格 v1_22 第十一節之 6），舊版回測另行執行（不再取自改版前之版本）。
 * 用法（c20）：node business-items/build/verify/verify.js --spec 〔規格 v1_22〕 --indep 〔獨立推導 c19 v1_0〕 --spec-v1-10 〔規格 v1_10〕 --spec-v1-12 〔規格 v1_12〕 --spec-v1-21 〔規格 v1_21〕
 *   --shell-spec 〔外殼規格 v1_2〕 --shell-table 〔外殼驗證表 v1_2〕 --shell-precheck 〔static_precheck 對 a47269e 之輸出 json〕 --shell-fill-commit 〔knowledge 補填之 commit〕 [--shots]
 * 以下為 c19 以前之說明，照錄。
 * c19（驗證表 v1_18）：頁面依規格 v1_21 套外殼 v1_2（拘40、第十一節「v1_21 之外殼」七項：頁尾容器 footer#siteFoot > div.wrap、隱私句 shell_privacy 置於 label[for=biz] 之後、
 *   預約與看全部工具同一列、↗ 為 aria-hidden 之獨立元素、列印隱藏預約列、頁尾收合列改名 shell_basis_title、免責改 shell_disclaimer）；build.py 防誤用（--test-inject 無值即中止、
 *   中止時 stderr 亦附 STOP_NOTE、多類以清單計）。本程式改寫 Q42（*_old 八鍵）、Q70、Q72、Q73、Q78、Q125（外殼 v1_2）、Q137（六種情形）、Q123、Q128（ext_c19）、
 *   Q132（獨立推導 c19），新增 Q138（外殼驗證表 v1_2 之適用列，shell_v1_2.js）與刻意錯誤 E162～E171；判定方式二十九：他列之 basis_title、disclaimer 以 shell_basis_title、
 *   shell_disclaimer 代入（A.basis_title、A.disclaimer 於載入 ext 後即代入）。對外請求一律於 browser context 層級記錄（派工固定段甲）；連結樣式量測不以點擊或 Enter 觸發導航（固定段乙）。
 *   改版前之版本改為 a47269e（頁面）；其 Q137 以 a47269e 之 build.py、ext_c18_輸出.json、page_template.html 與規格 v1_20（--spec-v1-20）執行；其 Q138 即外殼表之舊版回測。
 *   外殼表第十五節之錯誤案例（Z 系列）以 shell_v1_2.js 之 ZCASES 逐案執行，結果寫入 results/外殼v1_2_Q138.json。
 * 用法（c19）：node business-items/build/verify/verify.js --spec 〔規格 v1_21〕 --indep 〔獨立推導 c19 v1_0〕 --spec-v1-10 〔規格 v1_10〕 --spec-v1-12 〔規格 v1_12〕 --spec-v1-20 〔規格 v1_20〕
 *   --shell-spec 〔外殼規格 v1_2〕 --shell-table 〔外殼驗證表 v1_2〕 --shell-precheck 〔static_precheck 對 a47269e 之輸出 json〕 --shell-fill-commit 〔knowledge 補填之 commit〕 [--shots]
 * 以下為 c18 以前之說明，照錄。
 * c18（驗證表 v1_17）：頁面依規格 v1_20 改（D201011 移入規則 2 之二（3）名單，改附 plain_cond；build.py 之（6）增「（3）名單之代碼列於兩類」亦停止，停止時建置報告與錯誤訊息
 *   均註明 STOP_NOTE〔自規格 v1_20 第八節規則 2 之二（6）抽出〕，並增測試注入 --test-inject）；本程式改寫 Q123、Q128（217 句）、Q134（48 句）、Q136（D201011 改列附條件，依 ext_c18）、
 *   Q132（獨立推導 c18，40 句），新增 Q137（建置停止路徑三種情形）與刻意錯誤 E156～E161；E155 依驗證表 v1_17 之新判準文字（該設定之判定為未執行且錯誤訊息含
 *   「判定方式二十七之自檢」即抓到，Q107 列之結果不單獨構成抓到）；判定方式二十八：應抓列因瀏覽器無法啟動而未執行者，以 runRow 回傳之結構化欄位 launchFailure 判斷
 *   （Q107 之任一設定無法啟動者亦設之），不以明細之 String() 比對；E161 為其自檢（E75 之補丁加完整 Chromium 啟用往返快取之設定啟動失敗）。
 *   改版前之版本改為 04b3761（頁面）；其 Q137 以 04b3761 之 build.py、ext_c17_輸出.json、page_template.html 與規格 v1_19（--spec-v1-19）執行。
 *   E151～E153 之舊值仍取自 tools 2b6e7f0 之工具頁（c16Tool）。
 * c17（驗證表 v1_16）：頁面依規格 v1_19 改（白話說明逐代碼決定〔第八節規則 2 之二〕：每則以 plain_label 開頭，位於類別原文之後、括號註記之前；第八類 plain_co_domestic；
 *   括號註記改變組織限制之五碼附 plain_cond；HZ07011 兩類之下不附而於兩類之後附 plain_dual，取代 dual_category_note〔改為 _old〕；plain_co_biz、basis_item_4 改寫；
 *   zone_hint 判定之右引號增「”」「’」「"」「'」）；本程式改寫 Q01（重建與受驗頁逐位元組相同）、Q12、Q42（*_old 六鍵、script 元素七個、無 template）、Q43、Q84、
 *   Q107（判定方式二十六）、Q78（增 Q135、Q136 之查詢）、Q123、Q128（215 句）、Q132（40 句，獨立推導 c17）、Q134（46 句、margin-top）、Q81（截圖增二張），新增 Q136 與刻意錯誤 E142～E155；
 *   E155 依判定方式二十七為本程式之自檢（--q107-fail-full 之等效：令完整 Chromium 啟用往返快取之設定於啟動時拋錯，Q107 須記未執行）；改版前之版本改為 2b6e7f0。
 *   E133、E134、E135、X14 之補丁依 c17 頁面之原文改寫（逐代碼之白話說明對應 PLAIN_BY_CODE；義不變）。
 * 前一版（c16）：頁面依規格 v1_18 改（原輸入之空白緊鄰斜線、加號者不為客戶位置之終點；zone_hint 之「終點之後只有終點符號」擴及右括號、右引號，字樣改為附錄 A 現行字樣；
 *   限制旗標之類別原文下附白話說明〔第八節規則 2 之二〕；候選區頂端於 candidate_notice 之後加 register_note；內嵌 application/json 區塊限六個）；
 *   本程式改寫 Q42（*_old 五鍵之原始碼與 application/json 區塊）、Q43、Q84（白話說明）、Q114（增 v1_15 九句）、Q121（390×600 改 390×500）、Q123、Q128（187 句）、Q132（38 句）、Q134（33 句）、Q81（截圖增三張），
 *   新增 Q135（register_note）與刻意錯誤 E130～E141；Q132 改用獨立推導 c16；改版前之版本改為 fcba277；判定方式二十五：瀏覽器無法啟動之列與刻意錯誤記未執行並附錯誤訊息。
 *   E105、E125 與 ZH_C16（原 ZH_C14）之補丁依 c16 頁面之原文改寫（只改一處之義不變）。
 * 期望值一律取自 ../ext_c17_輸出.json（ext_c17.py 之抽出結果，與驗證表 v1_16 同一 commit 凍結，knowledge f429c0d）、獨立推導檔（Q132）與母本 code_v8.xlsx（master_dump.py 獨立讀取），不手抄字樣。
 *   附錄 A 之 *_old 六鍵（不得出現於頁面之舊值）、白話說明八鍵與 plain_label、register_note、plain_for（類別對應）與 plain_by_code（逐代碼對應）亦自 ext_c17 取得。
 * 用法（自 repo 根目錄）：node business-items/build/verify/verify.js --spec 〔規格 v1_19〕 --indep 〔獨立推導 c17 v1_0〕 [--spec-v1-10 〔規格 v1_10〕] [--spec-v1-12 〔規格 v1_12〕] [--only 列號,列號] [--errs-only 編號,編號] [--shots] [--q107-fail-full]
 *   --spec：建置列 Q01～Q04 之暫存建置所需（規格不入本公開 repo；SHA-256 由 build.py 核對）。
 *   --indep：Q132 所需（knowledge f429c0d 之 inbox/工具十三/營業項目查詢_獨立推導_c17_v1_0.json，SHA-256 93c621c4…5a0；不入本 repo）；未給者 Q132 記未執行（Q136 另記獨立推導之 plain 於明細）。
 *   --spec-v1-10：E61（內嵌說法表回 v1_10 附錄 B）所需（knowledge 68605af 之 inbox/工具十三/營業項目查詢工具_規格_v1_10.md，SHA-256 0844c15c…c4fe）；未給者 E61 記未執行。
 *   --spec-v1-12：E81、E82（附錄 D 加回第 58、66 對）所需（knowledge 30902f4 之 inbox/工具十三/營業項目查詢工具_規格_v1_12.md，SHA-256 10edcf0a…7620）；兩對自該檔附錄 D 抽出，不手抄。
 *   --shots：重產 Q81 之截圖（c17 之頁面白話說明之位置、標示與字樣有變，本批全部重產；驗證表 v1_16 增 Q136 之 D101011、IZ17010 各一張）。
 *   --errs-only：試跑用，只跑所列刻意錯誤（不寫 results/）；--q107-fail-full：判定方式二十七之自檢參數（E155 以 env 等效設定，不需另給）。
 * E120（zone_hint 用 v1_15 之字樣）之舊字樣與 E132（data-org 區塊）以 git 自 tools 3624af9 之工具頁取出、E129（v1_16 之字樣）與 E67（組織型態選項）自 tools 058fa6f 之工具頁取出、
 *   E141（v1_17 之字樣）自 tools fcba277 之工具頁、E151～E153（v1_18 之 plain_co_biz、basis_item_4 與 CLOSERS）自 tools 2b6e7f0 之工具頁取出（均 SHA-256 核對），不手抄。
 * 不在射程而不執行：開發中頁 D01～D06、刻意錯誤 E48～E51、E53、E54（驗證表 v1_16 第九之二節、第十節）。
 * E79（字型堆疊改回 v1_11）之舊堆疊以 git 自 tools 7f2e6e1 之工具頁取出（SHA-256 核對），不手抄。
 * 人工列：Q80、Q99、Q127（以 run_x4_c10.py 報數字）、Q81（截圖）、Q126（Android 手機鍵盤）、Q133（Mac 注音選字），判定記未執行。
 * Q107（判定方式二十六）：Chromium 以兩種設定各跑一次（Playwright 預設〔停用往返快取〕；完整 Chromium 並啟用往返快取），各設定分別判定；Firefox、WebKit 未跑記未執行（七題之七，115/10/23 後本機補跑）。
 * 判定方式二十五（驗證表 v1_15）：瀏覽器無法啟動（含 launch 逾時或程序異常結束）者，該列或該刻意錯誤記未執行並附錯誤訊息，不記未通過；同列之其他瀏覽器設定照常判定。
 * 需要：Node 之 playwright（Chromium）、python3（openpyxl、pdftotext）、git（取 058fa6f、3624af9、7f2e6e1、fcba277、2b6e7f0 之工具頁與 HEAD 之受驗頁）。不連外網；頁面以本機 http 伺服器提供（同源測試頁代替 sytaxes.com，判定方式十）。
 * 輸出：verify/results/結果.json、verify/screenshots/（Q81）；執行紀錄.md 由 make_record.py 產生。
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http"), crypto = require("crypto");
const { execFileSync, spawnSync } = require("child_process");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require("/opt/node22/lib/node_modules/playwright"); }
const { chromium } = pw;

const VERIFY = __dirname, BUILD = path.dirname(VERIFY), TOOL = path.dirname(BUILD), REPO = path.dirname(TOOL);
const EXT_FILE = "ext_c22_輸出.json";
const E = JSON.parse(fs.readFileSync(path.join(BUILD, EXT_FILE), "utf8"));
const A = E.appendix_a, L = E.list, CAND = E.candidates;
// 判定方式二十九（驗證表 v1_18）：他列所稱 basis_title、disclaimer 以 shell_basis_title、shell_disclaimer 代入（規格 v1_21 附錄 A 之舊鍵改為 _old）
A.disclaimer = A.shell_disclaimer; A.basis_title = A.shell_basis_title;
const ARGV = process.argv.slice(2);
const argOf = k => { const i = ARGV.indexOf(k); return i >= 0 ? ARGV[i + 1] : null; };
const ERRS_ONLY = argOf("--errs-only") ? argOf("--errs-only").split(",") : null; // 試跑用：只跑所列刻意錯誤（不跑逐列與改版前之版本，不寫 results/）
const ONLY = argOf("--only") ? argOf("--only").split(",") : ERRS_ONLY ? [] : null;
const SPEC = argOf("--spec");
const SPEC_V1_10 = argOf("--spec-v1-10");
const SPEC_V1_12 = argOf("--spec-v1-12"), SHA_SPEC_V1_12 = "10edcf0af97a68fe54a025589e5fd5739d07d95591c17f2cd6b5701443857620";
const INDEP_FILE = argOf("--indep"), SHA_INDEP = "06fb85160414c4a5263bbc196e0d95c878fb6f4b09bedd6c32f2f6413cbaa397"; // 獨立推導 c19 v1_0（knowledge 5c7916e）
const SPEC_V1_21 = argOf("--spec-v1-21"), SHA_SPEC_V1_21 = "862b9582746472c77a4ad7f69bb330876c1847d01c23610f21ec46a90ca6fd44"; // c20：改版前之版本之 Q137（64b2966 之 build.py 所讀之規格 v1_21，knowledge 5c7916e）
const SPEC_V1_20 = argOf("--spec-v1-20"), SHA_SPEC_V1_20 = "dea325df8c741196c9556f27aa497a213dbbae48186553191205086abd36fe9b"; // （c19 批之改版前；c20 起未用）改版前之版本之 Q137（a47269e 之 build.py 所讀之規格 v1_20，knowledge fa5b95b）
// Q138（外殼 v1_2）：外殼規格與驗證表 v1_2 定稿（knowledge d938e6b；SHA-256 核對）、static_precheck.py 對 a47269e 之重抽輸出、knowledge 補填之 commit
const SHELL_SPEC = argOf("--shell-spec"), SHA_SHELL_SPEC = "0669a8308cc4a5425ebcbbdd323d2d442ec1f6d9622b9ccbac316b003425f533";
const SHELL_TABLE = argOf("--shell-table"), SHA_SHELL_TABLE = "0091844365c210f6304b555c9e8a2456341fb84a09e90d12589799ffd9147bfa";
const SHELL_PRECHECK = argOf("--shell-precheck"), SHELL_FILL_COMMIT = argOf("--shell-fill-commit");
const SHELL = require("./shell_v1_2.js");
const Q107_FAIL_FULL = ARGV.includes("--q107-fail-full"); // 判定方式二十七（E155）之參數：令完整 Chromium 啟用往返快取之設定於啟動時拋錯（只供自檢）
const SHA_SPEC_V1_10 = "0844c15c5b25f4abf984c364675c27bfeea9626215ba04aceb370f6e4c70c4fe";
const PRE_JUDGE_COMMIT = "bf4c873", SHA_PRE_JUDGE = "948b3b589d100119ee00f92d91c5b5a8f4c3dfc063dbde040507ebe8ac5126a9"; // c22b：改版前之判法＝bf4c873 之 verify.js（v1_22 判法），對本頁面跑 Q125、E176
const PRE_COMMIT = "c9302c5", SHA_PRE_TOOL = "dbce0753254d3ef5f4948198efc82f73fab8ee3db345d8f2ae03faea28bc6a43"; // c22：改版前之版本＝c21 之工具頁（本批施作底本；派工射程 Q125）。c21 時為 fb163dd（0825e8e0…8ed3）； // c21：改版前之版本＝c20b 之工具頁。c20b 時為 52d2f0d（412e33be…1d16）； // c20b：改版前之版本＝c20 之工具頁（本批施作底本）。c20 時為 64b2966（8771e5bd…5089）； // c20：改版前之版本＝c19 之工具頁（本批施作底本）；其 Q137 另以該 commit 之 build.py、ext_c19_輸出.json 與規格 v1_21 執行
const BASE_COMMIT = "a47269e", SHA_BASE_TOOL = "399672649fdcefe76de5f6cc8df9c8c1a6a76171f08011a09106adf9329d4219"; // 外殼 v1_2 之比對基準與舊版回測：c18 之工具頁（規格 v1_22 第十一節之 6；R02 除外，見判定方式三十一）
const C16_COMMIT = "2b6e7f0", SHA_C16_TOOL = "36c63070a82848a3e9ca4200be7ccb3b8de87cf7425617473ae1bcd3d51bff34"; // E151～E153：c16 之工具頁（v1_18 之 plain_co_biz、basis_item_4、CLOSERS）
const C15_COMMIT = "fcba277", SHA_C15_TOOL = "f29933295a8aa5e65b71a7e73ad02c555641066ae5108af0b7ebaf8724456502"; // E141：c15 之工具頁（v1_17 之 zone_hint）
const C14_COMMIT = "058fa6f", SHA_C14_TOOL = "c9db4b00b48c0769a99e703a5381b36d65ec7221d3f7f86cf53dae0bb6493d50"; // E67、E129：c14 之工具頁
const C13_COMMIT = "3624af9", SHA_C13_TOOL = "9087a609b0f61b49b89008f9f8b81139c0c38daf18f810f769381bd348c47154"; // E120：c13 之工具頁（v1_15 之 zone_hint）
const C10_COMMIT = "7f2e6e1", SHA_C10_TOOL = "6d8a9a21def1acf3e1d34c69e26b3755947dae4cf95018899bfb37d7a816072e"; // E79：v1_11 之字型堆疊所在之工具頁
const M = JSON.parse(execFileSync("python3", ["-I", path.join(VERIFY, "master_dump.py"), path.join(BUILD, "code_v8.xlsx")], { encoding: "utf8", maxBuffer: 1 << 26 }));
const C8_PURPOSE = "輸入你要做的生意，列出可能適用的公司行號營業項目代碼，並標出須先取得許可、限專業經營、限公司組織等限制。"; // 規格 v1_13 附錄 A 前言所引之 c8 purpose
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "bi-verify-"));
const WIDTHS = [320, 390, 768, 1366];
const LICENSE = "https://data.gov.tw/license";
// 規格 v1_17 第八節之組織型態衝突對照表（第一期不施作，保留為第二、三期之參考）只供刻意錯誤 E07、E97 造出回 v1_16 之錯誤版：
// 「有限公司」一欄為衝突之類別（E07）；「九、十（不限組織別）」以外之類別為帶組織型態限制者（E97）
const OLD_CONFLICT_LTD = [1, 3, 4, 5, 11, 12, 13, 14], OLD_NO_ORG_LIMIT = [9, 10];
const OLD_KEYS = ["org_label_old", "org_options_old", "org_required_old", "org_undecided_note_old", "conflict_prefix_old", "dual_category_note_old", "disclaimer_old"]; // 規格 v1_21 附錄 A 之 *_old 鍵中判全文者（v1_16 增 dual_category_note_old；v1_18 增 disclaimer_old；basis_title_old 為短字樣，只判 summary 不等於之，見 Q42、Q73）
const PLAIN_KEYS = ["plain_sa", "plain_co", "plain_co_domestic", "plain_biz", "plain_co_biz", "plain_specific", "plain_cond", "plain_dual"]; // 規格 v1_19 附錄 A 之白話說明八鍵（不含 plain_label）
const PL = E.plain_texts.plain_label, PT_OF = k => E.plain_texts[k]; // 〔抽：plain_label〕、〔抽：plain_texts[鍵]〕
const PLAIN_TEXTS = PLAIN_KEYS.map(PT_OF); // 白話說明之字樣（不含 plain_label；用以抓出未加 plain_label 之白話說明）
const PBC = E.plain_by_code; // 〔抽：plain_by_code〕
const JSON_IDS = ["data-str", "data-codes", "data-list", "data-phrases", "data-excepts", "data-triggers"]; // 規格 v1_18 第七節第一項：application/json 區塊限此六個
const plainOf = n => E.plain_for[String(n)]; // 〔抽：plain_for[類別]〕（null 為不附；v1_16 起各列以 plain_by_code 為準）
const plainExp = (code, n) => { const x = PBC[code]; return x ? x.per_cat[String(n)] : null; }; // 〔抽：plain_by_code[該碼].per_cat[該類]〕
const cat = n => L.categories.find(c => c.no === n);
const noteOf = (code, n) => (cat(n).items.find(i => i.code === code) || {}).note || "";
const sha256 = b => crypto.createHash("sha256").update(b).digest("hex");
const setEq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const heading = n => A.results_heading.replace("N", String(n));
const notFound = k => A.code_not_found.replace("〔代碼〕", k);
const tagsOf = q => E.tag_text[q] || CAND[q].tags;
/* 依規格 v1_13 第七節第二項之 8：先列前 30 筆（得分列加補列合併計）；v1_9 起 ext 一律輸出全部列（P-G-10），rows_head 只供舊版相容 */
const allOf = q => { const c = CAND[q]; return c.rows ? c.rows.concat(c.siblings) : null; };

/* ───────── 本機伺服器：/〔變體〕/index.html、/other.html ───────── */
const ROOT = path.join(TMP, "www");
fs.mkdirSync(ROOT, { recursive: true });
fs.writeFileSync(path.join(ROOT, "other.html"), "<!doctype html><meta charset=utf-8><title>other</title><p>同源測試頁（代替 https://sytaxes.com/）</p>");
let PORT = 0;
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": p.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
  res.end(fs.readFileSync(p));
});
function publish(name, html) { const d = path.join(ROOT, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "index.html"), html); return `http://127.0.0.1:${PORT}/${name}/index.html`; }

/* ───────── 頁面工具 ───────── */
const INIT = () => {
  window.__w = { ls: 0, ss: 0, idb: 0, ck: 0, net: 0 };
  window.__ps = [];
  addEventListener("pageshow", e => { window.__ps.push({ persisted: e.persisted, nav: (performance.getEntriesByType("navigation")[0] || {}).type || null }); });
  const sp = Storage.prototype.setItem;
  Storage.prototype.setItem = function () { try { if (this === window.localStorage) window.__w.ls++; else window.__w.ss++; } catch (e) { window.__w.ss++; } return sp.apply(this, arguments); };
  try { const op = IDBFactory.prototype.open; IDBFactory.prototype.open = function () { window.__w.idb++; return op.apply(this, arguments); }; } catch (e) { }
  const d = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  Object.defineProperty(document, "cookie", { configurable: true, get() { return d.get.call(document); }, set(v) { window.__w.ck++; return d.set.call(document, v); } });
};
/* c22（驗證表 v1_22 判定方式三十五）：頁面腳本執行前（addInitScript）於 window 註冊 capture 階段之 beforeprint、afterprint 監聽器，計數並記事件時（頁面處理前）收合列之 open 與 isTrusted；
 * o.stop 為真者對 beforeprint 呼叫 stopImmediatePropagation，使頁面之 beforeprint 處理不執行（法三，Q125 之（甲）） */
const PRINT_INIT = o => {
  window.__pev = [];
  const st = () => { const x = document.querySelector("details.basis"); return x ? x.open : null; };
  addEventListener("beforeprint", e => { window.__pev.push({ type: "beforeprint", open: st(), isTrusted: e.isTrusted, stopped: !!(o && o.stop) }); if (o && o.stop) e.stopImmediatePropagation(); }, true);
  addEventListener("afterprint", e => { window.__pev.push({ type: "afterprint", open: st(), isTrusted: e.isTrusted }); }, true);
};
/* 判定方式二十五（驗證表 v1_15）：瀏覽器無法啟動者記未執行（LaunchError） */
class LaunchError extends Error { }
const LAUNCH_RE = /browserType\.launch|Failed to launch|Browser closed|Target page, context or browser has been closed|Executable doesn't exist|Timeout .* exceeded.*launch/;
class Ctx {
  constructor(browser, launchError) { this.browser = browser; this.launchError = launchError || null; }
  async page(url, w = 1366, h = 768, init2 = null) {
    if (!this.browser) throw new LaunchError("瀏覽器無法啟動：" + this.launchError);
    const ctx = await this.browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(INIT);
    if (init2) await ctx.addInitScript(init2[0], init2[1]); // c22（判定方式三十五）：頁面腳本執行前註冊之列印事件監聽器（PRINT_INIT）
    const p = await ctx.newPage();
    p.__req = []; p.__errs = [];
    ctx.on("request", r => p.__req.push(r.url()));        // 自導覽開始（含載入期間）之全部請求（驗證表 v1_8 Q78）；派工固定段甲：browser context 層級（含新開分頁、彈出視窗與 iframe）
    p.on("websocket", ws => p.__req.push(ws.url()));
    p.on("pageerror", e => p.__errs.push(e.message));
    p.__resp = await p.goto(url, { waitUntil: "load" });
    p.__raw = await p.__resp.text();
    p.__url = url;
    return p;
  }
}
async function close(p) { await p.context().close(); }
/* v1_14（c15 第一題）：頁面無組織型態；查詢只填業務描述並按查詢鈕（各列刪「選有限公司」等前置） */
async function query(p, text) {
  await p.fill("#biz", text);
  await p.click("#searchBtn");
}
async function showAll(p) { const b = await p.$("#showAll"); if (b) await b.click(); }
async function cards(p) {
  return p.$$eval("#results .cand", (els, PT) => els.map(e => {
    const t = s => { const x = e.querySelector(s); return x ? x.textContent : null; };
    const pl = e.querySelector(".permit-link");
    return {
      code: e.dataset.code, name: t(".cand-name"), def: t(".cand-def"), tag: t(".phrase-tag"),
      permit: t(".flag-permit .flag-title"), link: pl ? { text: pl.textContent, href: pl.getAttribute("href"), target: pl.getAttribute("target") } : null,
      restr: [...e.querySelectorAll(".flag-restrict")].map(f => ({ cat: f.dataset.cat, title: (f.querySelector(".cat-title") || {}).textContent, note: (f.querySelector(".cat-note") || {}).textContent || "", rn: (f.querySelector(".restriction-note") || {}).textContent })),
      // v1_16（c17）：白話說明元素＝innerText 以 plain_label 開頭、或含白話說明八鍵之一之字樣者（不依 class；取最內層者）；記其字樣、樣式與位置
      //   （類別原文之後、括號註記與 restriction_note 之前：DOM 順序與縱座標）；兩類之後之 plain_dual 記於 outside（限制旗標之外）
      ...(() => {
        const isP = x => { const t = (x.innerText || "").trim(); return t.startsWith(PT.label) || PT.texts.some(y => t.includes(y)); };
        const leafP = root => [...root.querySelectorAll("*")].filter(x => isP(x) && ![...x.children].some(isP));
        const fol = (a, b) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
        const geo = (x, fs) => ({ text: x.innerText.trim(), fontWeight: Number(getComputedStyle(x).fontWeight), fontSize: getComputedStyle(x).fontSize, rnFontSize: fs });
        const flags = [...e.querySelectorAll(".flag-restrict")];
        const plain = flags.map(f => {
          const ti = f.querySelector(".cat-title"), no = f.querySelector(".cat-note"), rn = f.querySelector(".restriction-note"); const fs = rn ? getComputedStyle(rn).fontSize : null;
          return { cat: f.dataset.cat, items: leafP(f).map(x => ({ ...geo(x, fs), isTitle: x === ti || x.contains(ti),
            belowTitle: fol(ti, x) && x.getBoundingClientRect().top >= ti.getBoundingClientRect().bottom - 1,
            beforeNote: !no || (fol(x, no) && x.getBoundingClientRect().bottom <= no.getBoundingClientRect().top + 1),
            beforeRn: fol(x, rn) && x.getBoundingClientRect().bottom <= rn.getBoundingClientRect().top + 1 })), rnFontSize: fs };
        });
        const lastRn = flags.length ? flags[flags.length - 1].querySelector(".restriction-note") : null, fs0 = lastRn ? getComputedStyle(lastRn).fontSize : null;
        const outside = leafP(e).filter(x => !flags.some(f => f.contains(x))).map(x => ({ ...geo(x, fs0), afterLastRn: fol(lastRn, x) && x.getBoundingClientRect().top >= lastRn.getBoundingClientRect().bottom - 1 }));
        return { plain, outside, plainInCard: PT.texts.filter(t => e.innerText.includes(t)), labelInCard: e.innerText.includes(PT.label) };
      })(),
      text: e.innerText,
    };
  }), { label: PL, texts: PLAIN_TEXTS });
}
/* 候選區之讀出（不依實作之 id 與 class，只依字樣與 .cand）：得分列、補列（sibling_heading 之後者）、標示、code_not_found、各提示之數目與順序 */
async function resState(p) {
  return p.evaluate(K => {
    const res = document.querySelector("#results");
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const all = [...document.querySelectorAll("body *")];
    const leaf = t => all.filter(e => (e.textContent || "") === t && ![...e.children].some(c => (c.textContent || "") === t) && vis(e));
    const nfRe = new RegExp("^" + K.nf.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("〔代碼〕", "(.+)") + "$");
    const hRe = new RegExp("^" + K.rh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "(\\d+)") + "$");
    const out = { rows: [], sib: [], tags: {}, missing: [], missingEls: [], sibHeading: 0, sibHeadingBeforeFirstSib: null, sibHeadingTag: null, sibNote: leaf(K.sn).length, sibTagByCard: {}, headings: [], cardTitleTags: [] };
    let s = false, firstSibPrev = null;
    for (const e of res ? res.querySelectorAll("*") : []) {
      if (e.textContent === K.sh && ![...e.children].some(c => c.textContent === K.sh)) { s = true; out.sibHeading++; out.sibHeadingTag = e.tagName; continue; }
      if (e.classList.contains("cand")) {
        // v1_9：DOM 順序為 最後一筆得分列 → sibling_heading → sibling_note → 第一筆補列
        if (s && !out.sib.length) { const n1 = e.previousElementSibling, h1 = n1 && n1.previousElementSibling; firstSibPrev = !!n1 && n1.textContent === K.sn && !!h1 && h1.textContent === K.sh; }
        (s ? out.sib : out.rows).push(e.dataset.code);
        const t = e.querySelector(".phrase-tag"); if (t) out.tags[e.dataset.code] = t.textContent;
        out.sibTagByCard[e.dataset.code] = [...e.querySelectorAll("*")].filter(x => x.textContent === K.stg && !x.children.length).length;
        const h = e.querySelector(".cand-head"); out.cardTitleTags.push(h ? h.tagName : null);
      }
      const m = !e.children.length && (e.textContent || "").match(nfRe); if (m) out.missing.push(m[1]);
    }
    out.sibHeadingBeforeFirstSib = firstSibPrev;
    out.headings = all.filter(e => hRe.test((e.innerText || "").trim()) && vis(e)).map(e => ({ tag: e.tagName, text: e.innerText.trim(), id: e.id }));
    out.zoneHint = leaf(K.zh).length; // v1_12：zone_hint 之有無（Q132、Q134）
    out.notice = leaf(K.cn).length; out.legend = leaf(K.lg).length; out.old = leaf(K.oh).length; out.stale = leaf(K.st).length; out.noResult = leaf(K.nr).length; out.inputRequired = leaf(K.ir).length;
    out.byTag = Object.keys(out.tags).length > 0;
    out.showAll = !!document.querySelector("#showAll");
    return out;
  }, { nf: A.code_not_found, rh: A.results_heading, sh: A.sibling_heading, sn: A.sibling_note, stg: A.sibling_tag, cn: A.candidate_notice, lg: A.phrase_legend, oh: A.old_text_hint, st: A.stale_hint, nr: A.no_result, ir: A.input_required, zh: A.zone_hint });
}
/* 指定字樣之元素（葉）是否位於另一字樣元素之前（DOM 與縱座標） */
async function before(p, t1, t2isHeading) {
  return p.evaluate(([a, b, hbs]) => {
    const hb = hbs ? new RegExp(hbs) : null;
    const all = [...document.querySelectorAll("body *")];
    const find = t => all.find(e => (e.innerText || "").trim() === t && ![...e.children].some(c => (c.innerText || "").trim() === t));
    const x = find(a), y = hb ? all.find(e => hb.test((e.innerText || "").trim()) && !e.children.length) : find(b);
    if (!x || !y) return null;
    return !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top;
  }, [t1, null, t2isHeading ? "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$" : null]).catch(() => null);
}
const visibleTextCount = (p, text, sel = "body *") => p.$$eval(sel, (els, text) => els.filter(e => {
  if ((e.textContent || "").trim() !== text) return false;
  if ([...e.children].some(c => (c.textContent || "").trim() === text)) return false;
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
}).length, text);
const bodyText = p => p.evaluate(() => document.body.innerText);
const writes = p => p.evaluate(() => ({ ...window.__w, lsLen: localStorage.length, ssLen: sessionStorage.length, cookie: document.cookie }));
const w0 = x => x.ls + x.ss + x.idb + x.ck + x.lsLen + x.ssLen === 0 && x.cookie === "";
function ok(cond, detail) { return { ok: !!cond, detail }; }
/* 比對 ext 之 candidates[q]：得分列、補列、標示（逐字）；v1_9 起 ext 一律全部列（舊版 rows_head 之分支保留相容） */
function candMatch(st, q) {
  const c = CAND[q], got = st.rows.concat(st.sib);
  const rowsOk = c.rows ? same(st.rows, c.rows) && same(st.sib, c.siblings) : same(got.slice(0, 30), c.rows_head) && got.length === c.count;
  const tagsOk = setEq(Object.keys(st.tags), Object.keys(c.tags)) && Object.keys(c.tags).every(k => st.tags[k] === c.tags[k]);
  return { ok: rowsOk && tagsOk, rowsOk, tagsOk };
}

/* ───────── 列之定義 ───────── */
const R = {};
const CODE_ROW = async (ctx, url, code, check) => { const p = await ctx.page(url); try { await query(p, code); const c = await cards(p); return await check(c, p); } finally { await close(p); } };
function restrOk(c, code, nos) {
  return c && c.restr.length === nos.length && nos.every((n, i) => c.restr[i].cat === String(n) && c.restr[i].title === cat(n).title && c.restr[i].note === noteOf(code, n) && c.restr[i].rn === A.restriction_note);
}
R.Q05 = (ctx, u) => CODE_ROW(ctx, u.tool, "C802041", c => { const x = c[0]; return ok(x && x.code === "C802041" && x.permit === A.permit_flag && x.link && x.link.text === A.permit_link && x.link.href === A.permit_url && x.link.target === "_blank" && !/主管機關：/.test(x.text), x); });
R.Q06 = (ctx, u) => CODE_ROW(ctx, u.tool, "E801060", c => ok(c[0] && !c[0].permit && restrOk(c[0], "E801060", [10]), c[0]));
R.Q07 = (ctx, u) => CODE_ROW(ctx, u.tool, "J701010", c => ok(c[0] && !c[0].permit && restrOk(c[0], "J701010", [10]), c[0]));
R.Q08 = (ctx, u) => CODE_ROW(ctx, u.tool, "F112010", async (c, p) => ok(c[0] && !c[0].permit && restrOk(c[0], "F112010", [5]) && !(await bodyText(p)).includes(A.conflict_prefix_old), c[0]));
R.Q09 = (ctx, u) => CODE_ROW(ctx, u.tool, "J905010", async (c, p) => ok(c[0] && restrOk(c[0], "J905010", [14]) && !(await bodyText(p)).includes(A.conflict_prefix_old), c[0]));
R.Q10 = (ctx, u) => CODE_ROW(ctx, u.tool, "H203011", c => ok(c[0] && c[0].permit === A.permit_flag && restrOk(c[0], "H203011", [9]), c[0]));
R.Q11 = (ctx, u) => CODE_ROW(ctx, u.tool, "I103060", async (c, p) => ok(c[0] && c[0].code === "I103060" && !c[0].permit && c[0].restr.length === 0 && !(await bodyText(p)).includes(A.restriction_note), c[0]));
/* Q12（v1_16 改寫，c17 第二題）：HZ07011 兩類並列；兩類之下均無白話說明；第七類之 restriction_note 之後恰一處元素，innerText 逐字等於 plain_label 接 plain_dual；
 * 頁面 innerText 與原始碼均不含 dual_category_note_old */
const dualOk = (c0, code) => { const x = PBC[code]; return !!c0 && !!x && !!x.dual && c0.plain.every(f => f.items.length === 0) && c0.outside.length === 1 && c0.outside[0].text === PL + PT_OF(x.dual) && c0.outside[0].afterLastRn; };
R.Q12 = (ctx, u, env) => CODE_ROW(ctx, u.tool, "HZ07011", async (c, p) => { const t = await bodyText(p);
  const g = c[0] && c[0].permit === A.permit_flag && restrOk(c[0], "HZ07011", [5, 7]) && dualOk(c[0], "HZ07011") && !t.includes(A.dual_category_note_old) && !env.src.tool.includes(A.dual_category_note_old);
  return ok(g, { card: c[0], dualExpect: PL + PT_OF(PBC.HZ07011.dual), innerTextHasOld: t.includes(A.dual_category_note_old), sourceHasOld: env.src.tool.includes(A.dual_category_note_old) }); });
R.Q13 = async (ctx, u, env) => {
  const m = env.report.match(/拘28「一覽表與母本不一致」清單[^：]*：(\[.*?\])/);
  const rep = m ? JSON.parse(m[1].replace(/'/g, '"')) : null;
  const p = await ctx.page(u.tool);
  try {
    await query(p, "G606011");
    const nf = await visibleTextCount(p, notFound("G606011"));
    const c1 = await cards(p);
    await query(p, "機場園區"); const c2 = await cards(p);
    return ok(rep && setEq(rep, L.not_in_master) && nf === 1 && c1.length === 0 && !c2.some(x => x.code === "G606011") && !env.src.tool.includes("G606011"), { report: rep, notFound: nf, airport: c2.map(x => x.code), srcHas: env.src.tool.includes("G606011") });
  } finally { await close(p); }
};
/* Q14、Q15（v1_14 改寫，c15 第一題）：限制旗標照列，頁面無 conflict_prefix_old */
R.Q14 = (ctx, u) => CODE_ROW(ctx, u.tool, "H101021", async (c, p) => ok(c[0] && restrOk(c[0], "H101021", [1]) && !(await bodyText(p)).includes(A.conflict_prefix_old), c[0] && c[0].text));
R.Q15 = async (ctx, u) => {
  const a = await CODE_ROW(ctx, u.tool, "J905010", async (c, p) => ok(c[0] && restrOk(c[0], "J905010", [14]) && !(await bodyText(p)).includes(A.conflict_prefix_old), c[0] && c[0].text));
  const b = await CODE_ROW(ctx, u.tool, "F112010", async (c, p) => ok(c[0] && restrOk(c[0], "F112010", [5]) && !(await bodyText(p)).includes(A.conflict_prefix_old), c[0] && c[0].text));
  return ok(a.ok && b.ok, { J905010: a.detail, F112010: b.detail });
};
R.Q16 = (ctx, u) => CODE_ROW(ctx, u.tool, "ZZ99999", c => ok(c[0] && c[0].text.includes(A.zz_note) && c[0].text.includes(A.zz_not_alone), c[0] && c[0].text));
R.Q17 = async (ctx, u) => {
  const out = {}; let all = true;
  for (const code of ["E801060", "J701010", "F112010", "J905010", "H203011", "HZ07011", "H101021"]) {
    const r = await CODE_ROW(ctx, u.tool, code, c => ok(c[0] && c[0].restr.length > 0 && c[0].restr.every(x => x.rn === A.restriction_note && x.rn === L.remark), c[0] && c[0].restr));
    out[code] = r.ok; all = all && r.ok;
  }
  return ok(all, out);
};
/* 二之二（v1_14 改寫，c15 第一題）：頁面無組織型態 */
const noOrgState = p => p.evaluate(([lab, req, opt]) => ({ radios: document.querySelectorAll('input[type="radio"]').length, fieldsets: document.querySelectorAll("fieldset").length,
  label: document.body.innerText.includes(lab), required: document.body.innerText.includes(req), options: document.body.innerText.includes(opt) }), [A.org_label_old, A.org_required_old, A.org_options_old]);
const noOrgOk = x => x.radios === 0 && x.fieldsets === 0 && !x.label && !x.required && !x.options; // v1_15：innerText 另不含 org_options_old（全文）
R.Q42 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    d.一 = await noOrgState(p);
    // 四（v1_15，c15b 第二題、F-G-01）：頁面原始碼（受驗之 index.html 全文，含 script、style 與屬性值）不含 *_old 五鍵任一之全文；type 為 application/json 之 script 元素恰六個，id 恰為 JSON_IDS
    const src = env.src.tool;
    d.四 = { sourceHasOld: OLD_KEYS.filter(k => src.includes(A[k])), jsonScripts: await p.$$eval('script[type="application/json"]', els => els.map(e => e.id)), servedEqualsSource: p.__raw === src,
      // v1_16（F-B-03）：script 元素共七個（application/json 六個加一個無 type 屬性之主程式），頁面無 template 元素
      scripts: await p.$$eval("script", els => els.map(e => e.getAttribute("type"))), templates: await p.$$eval("template", els => els.length) };
    // v1_18：basis_title_old 為短字樣，只判頁尾收合列（任何 summary）不等於之
    // v1_19（c19 第八輪 B-04 之一）：字面計數改為「*_old 八鍵」＝OLD_KEYS 七鍵（判原始碼全文）加 basis_title_old（判 summary）；booking_url_old、booking_aria_old 二鍵由 Q72 判。判法不變
    d.四.summaries = await p.$$eval("summary", els => els.map(e => e.textContent.trim())); d.四.summaryIsBasisTitleOld = d.四.summaries.includes(A.basis_title_old);
    d.四.ok = !d.四.summaryIsBasisTitleOld && d.四.sourceHasOld.length === 0 && d.四.jsonScripts.length === 6 && setEq(d.四.jsonScripts, JSON_IDS) && d.四.servedEqualsSource
      && d.四.scripts.length === 7 && d.四.scripts.filter(t => t === null).length === 1 && d.四.templates === 0;
    await query(p, "咖啡廳"); d.二 = await noOrgState(p); const st = await resState(p); d.二.rows = st.rows; d.二.expectRows = CAND["咖啡廳"].rows;
    await p.emulateMedia({ media: "print" }); d.三 = await noOrgState(p); await p.emulateMedia({ media: "screen" });
    return ok(noOrgOk(d.一) && noOrgOk(d.二) && noOrgOk(d.三) && same(st.rows, CAND["咖啡廳"].rows) && d.四.ok, d);
  } finally { await close(p); }
};
/* 白話說明（v1_16，c17）：該碼該類之期望鍵為 plain_by_code[該碼].per_cat[該類]；不為 null 者該類旗標內恰一處、innerText 逐字等於 plain_label 接 plain_texts[該鍵]、
 * 位於類別原文之後（不為其本身）、括號註記（有者）與 restriction_note 之前（DOM 與縱座標），computed font-weight 小於 600、font-size 等於同列 restriction_note；null 者該類無白話說明 */
const plainCatOk = (c, code, n) => { const f = c && c.plain.find(x => x.cat === String(n)); const k = plainExp(code, n);
  if (!f) return false; if (k === null) return f.items.length === 0;
  const x = f.items[0]; return f.items.length === 1 && x.text === PL + PT_OF(k) && !x.isTitle && x.belowTitle && x.beforeNote && x.beforeRn && x.fontWeight < 600 && x.fontSize === f.rnFontSize; };
const plainCodeOk = (c, code) => { const x = PBC[code]; if (!c || !x) return false;
  return x.cats.every(n => plainCatOk(c, code, n)) && (x.dual ? dualOk(c, code) : c.outside.length === 0); };
R.Q43 = async (ctx, u) => {
  const out = {}; let all = true;
  // v1_16（c17）：F112010、H101021、J905010 各附一處白話說明，等於 plain_label 接 plain_texts[plain_by_code[該碼].per_cat[該類]]（H101021 v1_16 補）；HZ07011 依 Q12
  for (const [code, nos] of [["F112010", [5]], ["H101021", [1]], ["J905010", [14]], ["HZ07011", [5, 7]]]) {
    const r = await CODE_ROW(ctx, u.tool, code, async (c, p) => { const t = await bodyText(p); const pl = plainCodeOk(c[0], code);
      return ok(c[0] && restrOk(c[0], code, nos) && !t.includes(A.conflict_prefix_old) && !t.includes(A.org_undecided_note_old) && pl, { plainOk: pl, expect: PBC[code], plain: c[0] && c[0].plain, outside: c[0] && c[0].outside, text: c[0] && c[0].text }); });
    out[code] = r.ok ? true : r.detail; all = all && r.ok;
  }
  return ok(all, out);
};
const RH_RE = "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$";
const headingActive = p => p.evaluate(re => { const rx = new RegExp(re); const a = document.activeElement; return !!a && a.tagName === "H2" && rx.test((a.innerText || "").trim()); }, RH_RE);
R.Q44 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  const snap = async () => { const c = await cards(p); return { codes: c.map(x => x.code), restr14: !!c[0] && restrOk(c[0], "J905010", [14]), headingActive: await headingActive(p), orgRequired: (await bodyText(p)).includes(A.org_required_old) }; };
  try {
    await p.fill("#biz", "J905010"); await p.click("#searchBtn"); d.一 = await snap();
    await p.reload({ waitUntil: "load" }); await p.fill("#biz", "J905010"); await p.focus("#biz"); await p.keyboard.press("Enter"); await p.waitForTimeout(50); d.二 = await snap();
    return ok([d.一, d.二].every(x => same(x.codes, ["J905010"]) && x.restr14 && x.headingActive && !x.orgRequired), d);
  } finally { await close(p); }
};
R.Q18 = async (ctx, u) => { const p = await ctx.page(u.tool); try { await query(p, "室內設計"); await showAll(p); const c = await cards(p); const e = c.find(x => x.code === "E801060"); const i = c.find(x => x.code === "I503010"); return ok(e && restrOk(e, "E801060", [10]) && !e.permit && !(await bodyText(p)).includes("景觀、室內設計業") && (!i || i.name === "景觀設計業"), { codes: c.map(x => x.code) }); } finally { await close(p); } };
R.Q19 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try {
    await query(p, "室內設計"); await showAll(p); const c = await cards(p);
    const bad = c.filter(x => { const m = M[x.code]; const nm = x.code === "JA02071" ? A.ja02071_name : m[0]; return x.name !== nm || x.def !== m[2] || (m[1] && x.text.includes(m[1])); });
    const e = c.find(x => x.code === "E801060");
    const tagged = c.filter(x => x.tag !== null).map(x => x.code);
    return ok(c.length > 0 && bad.length === 0 && e && e.tag === E.tag_text["室內設計"]["E801060"] && e.name === "室內裝修業" && setEq(tagged, Object.keys(E.tag_text["室內設計"])), { bad: bad.map(x => x.code), tag: e && e.tag });
  } finally { await close(p); }
};
R.Q20 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const out = []; let all = true;
  try {
    for (const it of E.q20) {
      await query(p, it.input);
      const n = await visibleTextCount(p, A.old_text_hint);
      const st = await resState(p);
      let pos = null;
      if (n === 1) pos = st.rows.length ? await before(p, A.old_text_hint, true) : await p.evaluate(([oh, nr]) => { const all = [...document.querySelectorAll("body *")]; const f = t => all.find(e => e.textContent === t && !e.children.length); const x = f(oh), y = f(nr); return !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top; }, [A.old_text_hint, A.no_result]);
      const good = it.show_hint ? n === 1 && pos === true : n === 0;
      out.push({ input: it.input, nonspace_len: it.nonspace_len, expect: it.show_hint, shown: n, posAboveHeadingOrNoResult: pos, tagged: st.byTag }); all = all && good;
    }
    return ok(all, out);
  } finally { await close(p); }
};
R.Q21 = async (ctx, u) => { const p = await ctx.page(u.tool); try { await query(p, "qwerty火星挖礦"); const c = await cards(p); const n = await visibleTextCount(p, A.no_result); return ok(c.length === 0 && n === 1, { cards: c.map(x => x.code), noResult: n }); } finally { await close(p); } };
async function topN(ctx, url, input, codes, tagsExp) {
  const p = await ctx.page(url);
  try {
    await query(p, input); await showAll(p);
    const c = await cards(p); const N = codes.length;
    const top = c.slice(0, N), rest = c.slice(N);
    const nr = await visibleTextCount(p, A.no_result);
    const good = setEq(top.map(x => x.code), codes) && top.every(x => x.tag !== null && (!tagsExp || x.tag === tagsExp[x.code])) && rest.every(x => x.tag === null) && nr === 0;
    return { ok: good, detail: { input, top: top.map(x => [x.code, x.tag]), restTagged: rest.filter(x => x.tag).map(x => x.code), count: c.length } };
  } finally { await close(p); }
}
const AC = E.appendix_c;
R.Q86 = (ctx, u) => topN(ctx, u.tool, AC[0].input, AC[0].codes, E.tag_text[AC[0].input]);
R.Q87 = (ctx, u) => topN(ctx, u.tool, AC[1].input, AC[1].codes, E.tag_text[AC[1].input]);
R.Q88 = async (ctx, u) => {
  const d = []; let all = true;
  for (const i of [5, 6, 7]) { const p = await ctx.page(u.tool); try { await query(p, AC[i].input); const c = await cards(p); const g = c.length > 0 && c[0].code === AC[i].codes[0] && AC[i].codes.length === 1 && c[0].tag === E.tag_text[AC[i].input][c[0].code]; d.push({ input: AC[i].input, first: c[0] && [c[0].code, c[0].tag], count: c.length }); all = all && g; } finally { await close(p); } }
  return ok(all, d);
};
R.Q89 = async (ctx, u) => { const d = []; let all = true; for (const i of [2, 3, 4, 8, 9, 10]) { const x = await topN(ctx, u.tool, AC[i].input, AC[i].codes, E.tag_text[AC[i].input]); d.push(x.detail); all = all && x.ok; } return ok(all, d); };
R.Q90 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of [AC[10].input, E.q93.input]) {
    const p = await ctx.page(u.tool);
    try { await query(p, q); await showAll(p); const c = await cards(p); const tg = c.filter(x => x.tag !== null).map(x => x.code); d[q] = c.filter(x => x.tag !== null).map(x => [x.code, x.tag]);
      // 「標」＝顯示 phrase_tag 且全文逐字等於 tag_text[該輸入][該代碼]（驗證表第三之二節前言）
      all = all && setEq(tg, E.phrase_hits[q]) && c.filter(x => x.tag !== null).every(x => x.tag === E.tag_text[q][x.code]); if (q === AC[10].input) all = all && tg.includes("E801060") && c.length > 1; } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q91 = async (ctx, u) => { const d = []; let all = true; for (const q of [E.placeholder_example, ...E.purpose_examples]) { const x = await topN(ctx, u.tool, q, E.phrase_hits[q], null); d.push(x.detail); all = all && x.ok && x.detail.count > 0; } return ok(all, d); };
const embedded = (src, id) => { const m = src.match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`)); return m ? JSON.parse(m[1]) : null; };
R.Q92 = async (ctx, u, env) => {
  const P = embedded(env.src.tool, "data-phrases"), C = embedded(env.src.tool, "data-codes");
  const codes = new Set(C.map(r => r[0])); const T = E.phrases.table;
  const nP = Object.values(P).reduce((s, v) => s + v.length, 0);
  const eq = Object.keys(T).every(k => P[k] && setEq(P[k], T[k])) && Object.keys(P).every(k => T[k]);
  const pure = Object.values(P).every(v => Array.isArray(v) && v.every(s => typeof s === "string"));
  return ok(Object.keys(P).length === E.phrases.code_count && nP === E.phrases.phrase_count && eq && Object.keys(P).every(k => codes.has(k)) && pure, { codes: Object.keys(P).length, phrases: nP, expect: [E.phrases.code_count, E.phrases.phrase_count], same: eq, pure });
};
R.Q93 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { await query(p, E.q93.input); await showAll(p); const c = await cards(p); const idx = k => c.findIndex(x => x.code === k);
    const g = E.q93.phrase_codes.every(k => idx(k) >= 0 && c[idx(k)].tag) && E.q93.def_codes.every(k => idx(k) >= 0 && !c[idx(k)].tag) && Math.max(...E.q93.phrase_codes.map(idx)) < Math.min(...E.q93.def_codes.map(idx));
    return ok(g, c.map(x => [x.code, !!x.tag])); } finally { await close(p); }
};
R.Q94 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { await query(p, E.q94.word); await showAll(p); const a = (await cards(p)).map(x => x.code); await query(p, E.q94.sentence); await showAll(p); const b = (await cards(p)).map(x => x.code);
    return ok(E.q94.bigram_only.every(k => a.includes(k)) && !E.q94.excluded_in_sentence.some(k => b.includes(k)), { alone: a, sentence: b }); } finally { await close(p); }
};
R.Q100 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const [q, v] of Object.entries(E.q100)) { const p = await ctx.page(u.tool); try { await query(p, q); await showAll(p); const st = await resState(p); d[q] = { rows: st.rows, sib: st.sib }; all = all && same(st.rows, v.rows) && same(st.sib, v.siblings) && !v.with_he_sep_extra.some(k => st.rows.includes(k) || st.sib.includes(k)); } finally { await close(p); } }
  return ok(all, d);
};
async function topState(p) {
  return p.evaluate(([cn, lg, rhRe]) => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const find = t => [...document.querySelectorAll("body *")].filter(e => e.textContent === t && ![...e.children].some(c => c.textContent === t) && vis(e));
    const re = new RegExp(rhRe);
    const hs = [...document.querySelectorAll("body *")].filter(e => re.test((e.innerText || "").trim()) && ![...e.children].some(c => re.test((c.innerText || "").trim())) && vis(e));
    const a = find(cn), b = find(lg), first = document.querySelector("#results .cand");
    const bf = (x, y) => !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top;
    return { heading: hs.length, headingText: hs[0] ? hs[0].innerText.trim() : null, notice: a.length, legend: b.length,
      order: (a.length === 1 && first ? bf(a[0], first) : null), legendOrder: (b.length === 1 && a.length === 1 && first ? bf(a[0], b[0]) && bf(b[0], first) : null),
      headingOrder: (hs.length === 1 && a.length === 1 ? bf(hs[0], a[0]) : null), cards: document.querySelectorAll("#results .cand").length };
  }, [A.candidate_notice, A.phrase_legend, "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$"]);
}
R.Q101 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, AC[0].input); d.s1 = await topState(p);
    await query(p, "機場園區"); d.s2 = await topState(p); d.s2codes = (await cards(p)).map(x => x.code);
    await query(p, "qwerty火星挖礦"); d.s3 = await topState(p); d.s3nr = await visibleTextCount(p, A.no_result);
    await query(p, "e801060"); d.s4 = await topState(p);
    const g = d.s1.heading === 1 && d.s1.headingText === heading(CAND[AC[0].input].scored_count) && d.s1.headingOrder && d.s1.notice === 1 && d.s1.legend === 1 && d.s1.order && d.s1.legendOrder
      && same(d.s2codes, CAND["機場園區"].rows) && d.s2.notice === 1 && d.s2.legend === 0 && d.s2.order
      && d.s3.heading === 0 && d.s3.notice === 0 && d.s3.legend === 0 && d.s3nr === 1
      && d.s4.notice === 1 && d.s4.legend === 0 && d.s4.order;
    return ok(g, d);
  } finally { await close(p); }
};
R.Q102 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of ["咖啡廳 手搖飲", "賣保養品", "接案設計logo", "接案設計LOGO", AC[0].input]) {
    const p = await ctx.page(u.tool);
    try { await query(p, q); await showAll(p); const c = await cards(p); const tg = Object.fromEntries(c.filter(x => x.tag !== null).map(x => [x.code, x.tag])); d[q] = tg; const exp = E.tag_text[q];
      all = all && setEq(Object.keys(tg), Object.keys(exp)) && Object.keys(exp).every(k => tg[k] === exp[k]); } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q103 = async (ctx, u) => {
  // 驗證表 v1_8 Q103：標示之代碼集合恰等於〔抽：q103[該輸入].tags〕之鍵、全文等於其值；各碼名稱以母本 code_v8.xlsx 判（master_dump.py 獨立讀取；同 Q82）
  const d = {}; let all = true;
  const tagged = {};
  for (const [q, v] of Object.entries(E.q103)) {
    const p = await ctx.page(u.tool);
    try { await query(p, q); await showAll(p); const c = await cards(p); const tg = Object.fromEntries(c.filter(x => x.tag !== null).map(x => [x.code, x.tag]));
      const nr = await visibleTextCount(p, A.no_result);
      const names = c.every(x => x.name === (x.code === "JA02071" ? A.ja02071_name : M[x.code][0]));
      const g = setEq(Object.keys(tg), Object.keys(v.tags)) && Object.keys(v.tags).every(k => tg[k] === v.tags[k]) && c.length === v.count && (v.count === 0 ? nr === 1 : nr === 0) && names;
      tagged[q] = Object.keys(tg);
      d[q] = { tagged: tg, count: c.length, expectCount: v.count, noResult: nr, names }; all = all && g; } finally { await close(p); }
  }
  // 驗證表 Q103「另：」各句（逐項明列；均已含於上開 tags 之比對）
  const removed = ["J201031", "ZZ99999", "H703090"];
  d.另 = { H601011_因保險經紀而標: (tagged["保險經紀"] || []).includes("H601011"), 已刪說法之碼被標: Object.values(tagged).flat().filter(k => removed.includes(k)), 裝修標E801010與E801060: ["E801010", "E801060"].every(k => (tagged["裝修"] || []).includes(k)) };
  all = all && !d.另.H601011_因保險經紀而標 && d.另.已刪說法之碼被標.length === 0 && d.另.裝修標E801010與E801060;
  return ok(all, d);
};
R.Q40 = async (ctx, u, env) => {
  const bp = fs.readFileSync(env.buildPy, "utf8");
  const bad = /data\.gcis\.nat\.gov\.tw/.test(env.src.tool) || /data\.gcis\.nat\.gov\.tw/.test(bp) || /^\s*(import|from)\s+(urllib|requests|http|socket)/m.test(bp);
  return ok(!bad, { toolHasCsvHost: /data\.gcis\.nat\.gov\.tw/.test(env.src.tool), buildHasCsvHost: /data\.gcis\.nat\.gov\.tw/.test(bp), buildImportsNet: /^\s*(import|from)\s+(urllib|requests|http|socket)/m.test(bp) });
};
async function attribState(p) {
  return p.evaluate(([att, disc, lic]) => {
    const els = [...document.querySelectorAll("body *")].filter(e => e.innerText === att && ![...e.children].some(c => c.innerText === att));
    const vis = els.filter(e => e.getBoundingClientRect().height > 0);
    const e = vis[0]; if (!e) return { n: 0 };
    const a = [...e.querySelectorAll("a")].find(x => x.getAttribute("href") === lic);
    const res = document.querySelector("#results"); const dd = [...document.querySelectorAll("body *")].find(x => x.textContent === disc);
    return { n: vis.length, link: !!a && a.getAttribute("target") === "_blank", fits: e.getBoundingClientRect().height <= window.innerHeight, afterResults: !!(res && (res.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)), beforeDisclaimer: !!(dd && (e.compareDocumentPosition(dd) & Node.DOCUMENT_POSITION_FOLLOWING)) };
  }, [A.attribution, A.disclaimer, LICENSE]);
}
/* Q63（v1_19 改寫，c20：顯名移入頁尾收合列；規格 v1_22 拘29、第十一節）：寬 1366、390（高 768），載入後、查詢後（appendix_c[0].input）、查無候選後（「qwerty火星挖礦」）各一次；
 * 各狀態先判收合、再展開頁尾收合列判展開，判後收回（下一狀態仍自收合判起）。
 * 收合時：頁面（body）innerText 不含〔抽：attribution〕自開頭至第一個「。」之字串（ATT_HEAD）；候選區（#results）與頁尾容器（footer#siteFoot）之間無顯名元素
 *   （文字含 ATT_HEAD 之最內層元素，DOM 位置在 #results 之後且不在其內、在 footer 之前且不在其內者為 0）。
 * 展開後：整頁恰一處可見之元素 innerText 逐字等於〔抽：attribution〕；位於 summary 為〔抽：shell_basis_title〕之 details 內，為 summary 之後第一個內文元素（element）、
 *   在〔抽：basis_item_1〕之 li 之前；其中 LICENSE 為連結且 target 為 _blank；只捲動整頁（window.scrollTo）可使其完整進入視窗。
 * 展開以 details.open＝true 為之（不點擊；固定段乙）。 */
const ATT_HEAD = A.attribution.slice(0, A.attribution.indexOf("。") + 1);
async function attribFootState(p) {
  return p.evaluate(([att, head, bt, b1, lic]) => {
    const F = Node.DOCUMENT_POSITION_FOLLOWING;
    const sm = [...document.querySelectorAll("details > summary")].filter(e => e.textContent.trim() === bt);
    const det = sm.length === 1 ? sm[0].parentElement : null;
    const res = document.querySelector("#results"), foot = document.querySelector("footer#siteFoot");
    const holders = [...document.querySelectorAll("body *")].filter(e => e.textContent.includes(head) && ![...e.children].some(c => c.textContent.includes(head)));
    const between = holders.filter(e => !!res && !!foot && !res.contains(e) && !!(res.compareDocumentPosition(e) & F) && !foot.contains(e) && !!(e.compareDocumentPosition(foot) & F));
    const collapsed = { detailsOpen: det ? det.open : null, innerTextHasHead: document.body.innerText.includes(head), betweenResultsAndFooter: between.map(e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "")) };
    if (!det) return { summaries: sm.length, collapsed, expanded: null };
    det.open = true;
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const els = [...document.querySelectorAll("body *")].filter(e => e.innerText === att && ![...e.children].some(c => c.innerText === att)).filter(vis);
    const e = els[0], first = [...det.children].find(c => c !== sm[0]) || null;
    const li1 = [...det.querySelectorAll("li")].find(l => l.innerText.trim() === b1);
    const a = e ? [...e.querySelectorAll("a")].find(x => x.getAttribute("href") === lic) : null;
    let fits = false, rect = null;
    if (e) { window.scrollTo(0, 0); const r0 = e.getBoundingClientRect(); window.scrollTo(0, Math.max(0, r0.top + window.scrollY - Math.max(0, (window.innerHeight - r0.height) / 2)));
      const r = e.getBoundingClientRect(); rect = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, vh: window.innerHeight, vw: window.innerWidth, scrollY: window.scrollY };
      fits = r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth; }
    const expanded = { n: els.length, inDetails: !!e && det.contains(e), firstAfterSummary: !!e && first === e, firstAfterSummaryTag: first ? first.tagName.toLowerCase() + (first.id ? "#" + first.id : "") : null,
      beforeItem1: !!e && !!li1 && !!(e.compareDocumentPosition(li1) & F), link: !!a && a.getAttribute("target") === "_blank", fits, rect };
    det.open = false; window.scrollTo(0, 0);
    return { summaries: 1, collapsed, expanded };
  }, [A.attribution, ATT_HEAD, A.shell_basis_title, A.basis_item_1, LICENSE]);
}
const attribFootOk = s => s.summaries === 1 && s.collapsed.detailsOpen === false && !s.collapsed.innerTextHasHead && s.collapsed.betweenResultsAndFooter.length === 0
  && !!s.expanded && s.expanded.n === 1 && s.expanded.inDetails && s.expanded.firstAfterSummary && s.expanded.beforeItem1 && s.expanded.link && s.expanded.fits;
R.Q63 = async (ctx, u) => {
  const d = []; let all = true;
  for (const w of [1366, 390]) {
    const p = await ctx.page(u.tool, w, 768);
    try {
      for (const [lab, q] of [["載入後", null], ["查詢後", AC[0].input], ["查無候選後", "qwerty火星挖礦"]]) {
        if (q) await query(p, q);
        const s = await attribFootState(p); const g = attribFootOk(s); d.push({ w, lab, ok: g, ...s });
        all = all && g;
      }
    } finally { await close(p); }
  }
  return ok(all, { attHead: ATT_HEAD, rows: d });
};
R.Q65 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try {
    const r = await p.evaluate(() => {
      const ext = [];
      document.querySelectorAll("img,image,source,picture,object,embed").forEach(e => { const s = e.getAttribute("src") || e.getAttribute("href") || e.getAttribute("srcset") || e.getAttribute("data") || ""; if (s && !s.startsWith("data:")) ext.push(s); });
      document.querySelectorAll("*").forEach(e => { for (const pse of [null, "::before", "::after"]) { const b = getComputedStyle(e, pse).backgroundImage; if (b && b !== "none" && /url\(/.test(b) && !/url\("?data:/.test(b)) ext.push(b); } });
      return ext;
    });
    const t = await bodyText(p);
    const words = ["經濟部認可", "經濟部推薦", "官方工具"].filter(w => t.includes(w));
    return ok(r.length === 0 && words.length === 0, { externalImages: r, words });
  } finally { await close(p); }
};
R.Q66 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool); const d = {}; let all = true; const three = ["G606011", "G901011", "G902011"];
  try {
    for (const k of three) { await query(p, k); const n = await visibleTextCount(p, notFound(k)); d[k] = n; all = all && n === 1; }
    for (const q of ["第一類電信", "第二類電信", "機場園區"]) { await query(p, q); await showAll(p); const c = (await cards(p)).map(x => x.code); d[q] = c.filter(k => three.includes(k)); all = all && d[q].length === 0; }
    const emb = ["data-codes", "data-list", "data-phrases", "data-excepts"].map(id => (env.src.tool.match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`)) || [])[1] || "").join("");
    d.embedded = three.filter(k => emb.includes(k)); all = all && d.embedded.length === 0;
    return ok(all, d);
  } finally { await close(p); }
};
R.Q67 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {}; let all = true;
  try { for (const [q, k] of [["特定電力", "D101101"], ["加氫", "F212071"], ["網路廣告", "I301060"], ["獵槍", "JA02071"], ["寵物生命", "JZ99190"]]) { await query(p, q); await showAll(p); const c = (await cards(p)).map(x => x.code); d[q] = c.includes(k); all = all && d[q]; } return ok(all, d); } finally { await close(p); }
};
R.Q68 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    for (const [k, n] of [["I102010", "一般投資顧問業"], ["I503010", "景觀設計業"], ["JA02071", A.ja02071_name]]) { await query(p, k); const c = await cards(p); d[k] = c[0] && c[0].name; d[k + "_ok"] = !!c[0] && c[0].name === n; }
    const m = env.report.match(/拘30 名稱補正清單（(\d+) 筆）：\n((?:  - .*\n)*)/);
    d.report = m ? m[0] : null;
    const rep = m && m[1] === "1" && /JA02071：母本名稱欄「JA02071」→「甲式自製獵槍維修業」；出處 S07.*第七類第 39 項/.test(m[2]);
    return ok(d.I102010_ok && d.I503010_ok && d.JA02071_ok && rep, d);
  } finally { await close(p); }
};
R.Q69 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {}; let all = true;
  try { for (const q of ["e801060", " E801060 ", "E801060。"]) { await query(p, q); await showAll(p); const c = await cards(p); const t = await bodyText(p); const s = await topState(p); const st = await resState(p);
      const g = c.length === 1 && same(c.map(x => x.code), CAND[q].rows) && restrOk(c[0], "E801060", [10]) && !t.includes("由常見說法") && s.notice === 1 && s.legend === 0 && st.sibHeading === 0 && st.sib.length === 0;
      d[q] = { codes: c.map(x => x.code), tagFree: !t.includes("由常見說法"), notice: s.notice, legend: s.legend, sibHeading: st.sibHeading }; all = all && g; }
    return ok(all, d); } finally { await close(p); }
};
R.Q82 = async (ctx, u, env) => {
  const C = embedded(env.src.tool, "data-codes");
  const bad = C.filter(r => { const m = M[r[0]]; return !m || r.length !== 3 || r[2] !== m[2] || (r[0] === "JA02071" ? r[1] !== A.ja02071_name : r[1] !== m[0]); }).map(r => r[0]);
  const tail1 = C.filter(r => /1$/.test(r[0])).length;
  const enIn = C.some(r => r.slice(1).some(v => v && M[r[0]] && v === M[r[0]][1] && M[r[0]][1] !== ""));
  return ok(C.length === E.master.count && bad.length === 0 && tail1 === E.master.tail_1 && !enIn, { count: C.length, bad, tail1, english: enIn });
};
R.Q83 = async (ctx, u, env) => {
  const LST = embedded(env.src.tool, "data-list");
  const exp = L.categories.map(c => ({ ...c, items: c.items.filter(i => !L.not_in_master.includes(i.code)) }));
  const occ = {}; LST.forEach(c => c.items.forEach(i => { occ[i.code] = (occ[i.code] || 0) + 1; }));
  const multi = Object.keys(occ).filter(k => occ[k] > 1).sort();
  return ok(LST.length === L.category_count && same(LST, exp) && same(multi, L.multi_category), { count: LST.length, equal: same(LST, exp), multi });
};
/* Q84（v1_14 改寫，c15 第一題）：一覽表每一類各取一個在母本之代碼查詢一次（15 次）；該類旗標之類別原文、括號註記、restriction_note；頁面無 conflict_prefix_old */
R.Q84 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const bad = [], d = []; let n = 0;
  try {
    for (const c of L.categories) {
      const code = c.items.find(i => !L.not_in_master.includes(i.code)).code;
      await query(p, code); const cc = await cards(p); n++;
      const f = cc[0] && cc[0].restr.find(x => x.cat === String(c.no));
      const g0 = !!f && cc[0].code === code && f.title === c.title && f.note === noteOf(code, c.no) && f.rn === A.restriction_note && !(await bodyText(p)).includes(A.conflict_prefix_old);
      // v1_16（c17）：類別原文之後恰一處白話說明（plain_label 接 plain_texts[plain_by_code[該碼].per_cat[該類]]），位於括號註記與 restriction_note 之前；
      // null 者（第九、十類）該列無任何白話說明（頁面不含 plain_label、白話說明八鍵之字樣）；font-weight 小於 600、font-size 等於該列 restriction_note、不為類別原文元素本身
      const k = plainExp(code, c.no), pf = cc[0] && cc[0].plain.find(x => x.cat === String(c.no)); const bt = await bodyText(p);
      const gp = k === null ? !!cc[0] && cc[0].plainInCard.length === 0 && !cc[0].labelInCard && !bt.includes(PL) && cc[0].plain.every(x => x.items.length === 0) && cc[0].outside.length === 0
        : plainCatOk(cc[0], code, c.no) && cc[0].outside.length === 0;
      const g = g0 && gp;
      d.push({ no: c.no, code, title: f && f.title, note: f && f.note, plainKey: k, plainExpect: k && PL + PT_OF(k), plain: pf, plainInCard: cc[0] && cc[0].plainInCard, ok: g }); if (!g) bad.push([c.no, code]);
    }
    return ok(n === 15 && L.categories.length === 15 && bad.length === 0, { queries: n, bad, rows: d });
  } finally { await close(p); }
};
async function eachWidth(ctx, url, fn, states = [null, "室內設計"], h = 768) {
  const d = []; let all = true;
  for (const w of WIDTHS) {
    const p = await ctx.page(url, w, h);
    try { for (const q of states) { if (q) await query(p, q); const r = await fn(p, w, q); d.push({ w, q, ...r.detail }); all = all && r.ok; } } finally { await close(p); }
  }
  return ok(all, d);
}
/* Q70（v1_18 改寫，外殼 v1_2）：頁尾容器 footer#siteFoot > div.wrap 之子元素依序為免責句、署名、預約列（預約與看全部工具同一列、預約在左）、頁尾收合列、版本行（DOM 與縱座標）；
 * 首為免責句、末為版本行；免責句、署名、預約、看全部工具、版本行各恰一個可見；頁面（innerText 與原始碼）不含 disclaimer_old */
async function q70State(p) {
  return p.evaluate(([disc, sig, sigUrl, bookUrl, vaUrl, bt, ver, dOld]) => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const foot = document.querySelector("footer#siteFoot > div.wrap"); if (!foot) return { foot: false };
    const kids = [...foot.children];
    const role = e => { if (e.innerText.trim() === disc) return "免責句"; if (e.tagName === "A" && e.getAttribute("href") === sigUrl && e.textContent.trim() === sig) return "署名";
      if (e.querySelector('a[href="' + bookUrl + '"]') && e.querySelector('a[href="' + vaUrl + '"]')) return "預約列"; if (e.tagName === "DETAILS" && e.querySelector("summary") && e.querySelector("summary").textContent.trim() === bt) return "頁尾收合列";
      if (e.innerText.trim() === ver) return "版本行"; return "其他：" + e.tagName.toLowerCase() + "." + e.className; };
    const roles = kids.map(role);
    let y = true; for (let i = 1; i < kids.length; i++) y = y && kids[i].getBoundingClientRect().top >= kids[i - 1].getBoundingClientRect().bottom - 0.01;
    const A_ = [...document.querySelectorAll("a")];
    const bk = A_.filter(a => a.getAttribute("href") === bookUrl && vis(a)), va = A_.filter(a => a.getAttribute("href") === vaUrl && vis(a));
    let sameRow = null, bookLeft = null;
    if (bk[0] && va[0]) { const a = bk[0].getBoundingClientRect(), b = va[0].getBoundingClientRect(); sameRow = bk[0].parentElement === va[0].parentElement && a.top < b.bottom && b.top < a.bottom; bookLeft = a.right <= b.left; }
    const all = [...document.querySelectorAll("body *")];
    const leaf = t => all.filter(e => (e.innerText || "").trim() === t && ![...e.children].some(c => (c.innerText || "").trim() === t) && vis(e));
    return { foot: true, roles, y, first: roles[0], last: roles[roles.length - 1], disc: leaf(disc).length, sig: A_.filter(a => a.textContent.trim() === sig && vis(a)).length, book: bk.length, viewAll: va.length, ver: leaf(ver).length, sameRow, bookLeft, innerTextHasOld: document.body.innerText.includes(dOld) };
  }, [A.shell_disclaimer, A.signature, A.signature_url, A.booking_url, A.view_all_url, A.shell_basis_title, A.version_line, A.disclaimer_old]);
}
const Q70_ROLES = ["免責句", "署名", "預約列", "頁尾收合列", "版本行"];
R.Q70 = async (ctx, u, env) => {
  const r = await eachWidth(ctx, u.tool, async p => { const s = await q70State(p); return ok(s.foot && same(s.roles, Q70_ROLES) && s.y && s.disc === 1 && s.sig === 1 && s.book === 1 && s.viewAll === 1 && s.ver === 1 && s.sameRow && s.bookLeft && !s.innerTextHasOld, s); });
  const srcOld = env.src.tool.includes(A.disclaimer_old);
  return ok(r.ok && !srcOld, { 原始碼含_disclaimer_old: srcOld, rows: r.detail });
};
R.Q71 = (ctx, u) => eachWidth(ctx, u.tool, async p => {
  const s = await p.evaluate(sig => { window.scrollTo(0, document.documentElement.scrollHeight); const a = [...document.querySelectorAll("a")].filter(e => e.textContent.trim() === sig); const e = a[0]; if (!e) return { n: 0 }; const r = e.getBoundingClientRect(); return { n: a.length, text: e.textContent, href: e.getAttribute("href"), target: e.getAttribute("target"), inView: r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth }; }, A.signature);
  return ok(s.n === 1 && s.text === A.signature && s.text.includes("\uFF5C") && s.href === A.signature_url && s.target === "_blank" && s.inView, s);
});
/* Q72（v1_19 改寫，c19 第八輪 G-01、B-07；v1_21 改稱「主文字」，c20 第九輪 B-02，判法不改）：連結文字以「主文字」判定：複製該連結並移除其全部 aria-hidden="true" 之後代元素後之文字內容（trim），
 * 與外殼驗證表 v1_2 G05、L02 之讀法相同；另記原始 innerText（不以其含「↗」判未通過）。射程及於預約與看全部工具：整頁中可見且可用鍵盤聚焦者各恰一個，
 * 「↗」為帶 aria-hidden="true" 之獨立元素（連結之後代或緊鄰之後一個兄弟元素），不以 ::after 或 ::before 呈現（computed content 為 none 或 normal）。
 * 預約另判 href、target、rel、aria-label 與 *_old；看全部工具之 href、target、rel、aria-label 與外觀由 Q138 之外殼表列判。 */
async function linkState(p, text, url, ariaPrefix) {
  return p.evaluate(([text, url, ariaPrefix]) => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const visText = a => { const c = a.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(x => x.remove()); return c.textContent.trim(); }; // 主文字（排除 aria-hidden 後代元素；v1_21 改稱，判法不改）
    const links = [...document.querySelectorAll("a")].filter(a => (visText(a) === text || a.getAttribute("href") === url || (a.getAttribute("aria-label") || "").startsWith(ariaPrefix)) && vis(a) && a.tabIndex >= 0);
    const a = links[0];
    const arrowEl = a ? [...a.querySelectorAll('[aria-hidden="true"]')].concat(a.nextElementSibling && a.nextElementSibling.getAttribute("aria-hidden") === "true" ? [a.nextElementSibling] : []).filter(e => e.textContent.trim() === "↗").length : 0;
    const pa = a ? getComputedStyle(a, "::after").content : null, pb = a ? getComputedStyle(a, "::before").content : null;
    return { n: links.length, text: a ? visText(a) : null, rawInnerText: a ? a.innerText : null, href: a && a.getAttribute("href"), target: a && a.getAttribute("target"), rel: a && a.getAttribute("rel"), aria: a && a.getAttribute("aria-label"), arrowEl, pseudoAfter: pa, pseudoBefore: pb };
  }, [text, url, ariaPrefix]);
}
async function bookingState(p) {
  const s = await linkState(p, A.booking, A.booking_url, A.booking);
  s.domOld = await p.evaluate(([oldU, oldA]) => document.documentElement.outerHTML.includes(oldU) || document.documentElement.outerHTML.includes(oldA), [A.booking_url_old, A.booking_aria_old]);
  return s;
}
const arrowOk = s => s.arrowEl === 1 && ["none", "normal"].includes(s.pseudoAfter) && ["none", "normal"].includes(s.pseudoBefore);
const bookingOk = s => s.n === 1 && s.text === A.booking && s.href === A.booking_url && s.target === "_blank" && /noopener/.test(s.rel || "") && s.aria === A.booking_aria && !s.domOld && arrowOk(s); // v1_18：↗ 之呈現；外觀之拘束數值由 Q138 之外殼表列（G07）判
const viewAllOk = s => s.n === 1 && s.text === A.view_all && arrowOk(s); // v1_19（B-07）：看全部工具同一判法；href、target、rel、aria-label 由 Q138 判
R.Q72 = async (ctx, u, env) => {
  const r = await eachWidth(ctx, u.tool, async p => { const b = await bookingState(p), v = await linkState(p, A.view_all, A.view_all_url, A.view_all); return ok(bookingOk(b) && viewAllOk(v), { booking: b, viewAll: v, bookingOk: bookingOk(b), viewAllOk: viewAllOk(v) }); });
  const srcOld = env.src.tool.includes(A.booking_url_old) || env.src.tool.includes(A.booking_aria_old);
  return ok(r.ok && !srcOld, { srcOld, 判法: "主文字＝複製連結後移除 aria-hidden=\"true\" 之後代元素之 textContent（trim）；rawInnerText 只記錄", rows: r.detail });
};
R.Q73 = (ctx, u) => eachWidth(ctx, u.tool, async p => {
  const s = await p.evaluate(([bt, book, ver, btOld, att]) => {
    const sm = [...document.querySelectorAll("details > summary")].filter(e => e.textContent.trim() === bt); if (sm.length !== 1) return { n: sm.length };
    const det = sm[0].parentElement; const closed = !det.open;
    const bk = [...document.querySelectorAll("a")].find(a => (a.getAttribute("aria-label") || "").startsWith(book)); const b = bk && bk.parentElement && bk.parentElement.tagName === "DIV" && !bk.parentElement.matches(".wrap") ? bk.parentElement : bk; // v1_18：預約列（預約之 ↗ 為子元素，innerText 不再等於 booking，改以 aria-label 定位）
    const v = [...document.querySelectorAll("body *")].find(e => e.textContent.trim() === ver && !e.children.length);
    const pos = !!b && !!v && !!(b.compareDocumentPosition(det) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(det.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING);
    det.open = true; const items = [...det.querySelectorAll("li")].map(l => l.innerText.trim());
    // v1_19（c20）：展開後依序含 attribution、basis_item_1～4：details 內顯名元素（innerText 逐字等於 attribution 之最內層元素）與各 li，依 DOM 順序
    const seq = [...det.querySelectorAll("*")].filter(e => e.tagName === "LI" || (e.innerText === att && ![...e.children].some(c => c.innerText === att))).map(e => e.tagName === "LI" ? e.innerText.trim() : e.innerText);
    det.open = false;
    const oldSummary = [...document.querySelectorAll("summary")].filter(e => e.textContent.trim() === btOld).length; // v1_18：任何 summary 均不等於 basis_title_old
    return { n: 1, closed, pos, items, seq, oldSummary };
  }, [A.basis_title, A.booking, A.version_line, A.basis_title_old, A.attribution]);
  return ok(s.n === 1 && s.closed && s.pos && same(s.items, [A.basis_item_1, A.basis_item_2, A.basis_item_3, A.basis_item_4]) && same(s.seq, [A.attribution, A.basis_item_1, A.basis_item_2, A.basis_item_3, A.basis_item_4]) && s.oldSummary === 0, s);
});
R.Q74 = (ctx, u) => eachWidth(ctx, u.tool, async p => {
  const s = await p.evaluate(ver => { const a = [...document.querySelectorAll(".as-of")]; return { n: a.length, text: a[0] && a[0].innerText }; }, A.version_line);
  return ok(s.n === 1 && s.text === A.version_line && !s.text.includes(A.forbidden_version_suffix), s);
});
R.Q75 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { const h = await p.evaluate(() => ({ title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content, robots: (document.querySelector('meta[name="robots"]') || {}).content, tv: (document.querySelector('meta[name="tool-version"]') || {}).content, lang: document.documentElement.lang }));
    return ok(h.title === A.meta_title && h.desc === A.meta_description && h.robots === "index,follow" && h.tv === A.tool_version && !h.tv.includes(A.forbidden_version_suffix) && ["zh-Hant", "zh-TW"].includes(h.lang), h); } finally { await close(p); }
};
R.Q76 = async (ctx, u) => {
  const d = []; let all = true;
  const sw = p => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: window.innerWidth }));
  for (const w of WIDTHS) {
    const p = await ctx.page(u.tool, w, 768);
    try {
      const steps = [["載入後", async () => { }], ["製造", async () => query(p, "製造")], ["顯示全部", async () => showAll(p)],
        ["展開依據說明", async () => p.evaluate(() => { document.querySelector("details").open = true; })], ["附錄C第0句", async () => query(p, AC[0].input)],
        ["q20[0]", async () => query(p, E.q20[0].input)], ["300字", async () => { await p.fill("#biz", "咖".repeat(300)); await p.dispatchEvent("#biz", "input"); }],
        ["補列（寵物店 寵物美容 寵物旅館，顯示全部）", async () => { await query(p, "寵物店 寵物美容 寵物旅館"); await showAll(p); }],
        ["stale_hint", async () => { await query(p, "室內設計"); await p.fill("#biz", "室內設計 咖啡廳"); }]];
      for (const [lab, f] of steps) { await f(); const s = await sw(p); const g = s.sw <= s.iw && s.bw <= s.iw; d.push({ w, lab, ...s }); all = all && g; }
      const st = await resState(p); d.push({ w, lab: "（stale_hint 狀態核對）", stale: st.stale });
    } finally { await close(p); }
  }
  return ok(all, d);
};
async function firstVisible(p) {
  return p.evaluate(() => { const c = document.querySelector("#results .cand"); if (!c) return { ok: false }; const r1 = c.querySelector(".cand-code").getBoundingClientRect(), r2 = c.querySelector(".cand-name").getBoundingClientRect(); const inV = r => r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth; const top = document.elementFromPoint(r1.left + 2, r1.top + r1.height / 2); return { ok: inV(r1) && inV(r2) && !!top && c.contains(top), codeTop: r1.top, nameBottom: r2.bottom }; });
}
R.Q77 = async (ctx, u) => {
  const d = []; let all = true;
  for (const [w, h] of [[1366, 768], [1024, 640], [390, 844]]) {
    const p = await ctx.page(u.tool, w, h);
    try {
      await query(p, "室內設計"); await p.waitForTimeout(100);
      const s = await firstVisible(p); // v1_14：刪 Q42 之 org_required（c15 第一題）
      d.push({ w, h, first: s.ok }); all = all && s.ok;
    } finally { await close(p); }
  }
  return ok(all, d);
};
const Q109_IN = ["E801060,E801010", "E801060、G606011", "G606011 G901011", "e801060 i103060 E801060"];
const Q109_TEXT = ["E801060 室內裝修", "E80106", "E8010600"]; // v1_9：有任一段不是 7 碼代碼即依文字比對
const Q112_IN = ["開豆花店", "保險經紀", "做婚禮花藝", "賣清潔用品", "做寵物美容", "賣化妝品", "腳底按摩", "室內裝修", "經營網路平台", "電商倉儲、電商", "車輛美容"]; // v1_9 增後五句
const Q113_IN = ["做手工皂", "跨境電商", "桌遊店"]; // v1_9：「室內裝修」移至 Q112
const Q113_LISTED = { 做手工皂: ["C802100", "F208040"], 桌遊店: ["F209060", "J701040"], 跨境電商: ["F399040", "F401010"] }; // 驗證表 Q113 應得輸出括號所列（與 tag_text 之鍵另行核對）
const Q114_IN = ["有一間小工廠做麵包，賣給早餐店跟超市，也有自己的門市", "進口橄欖油，賣給餐廳跟網路客人", "開早餐店，也做外送", "賣給超市\n開早餐店",
  "賣給餐廳 開早餐店", "做麵包，供應給餐廳", "賣給、早餐店", "開早餐店客戶是", "賣給超市！開早餐店", "賣給超市？開早餐店", "做麵包，賣給超市，供應給餐廳，也開早餐店", // v1_9 增七句
  "客戶主要是 餐廳和飯店", "客戶主要是餐廳和飯店", "做麵包，供應給 餐廳", "賣給餐廳、飯店，也開早餐店", "賣給餐廳、也開早餐店", "賣給\u3000餐廳，開早餐店", // v1_11 增六句（末句為全形空白）
  "客戶主要是 餐廳/我也開早餐店", "客戶主要是 餐廳+我也開早餐店", "賣給餐廳+開早餐店", "賣給 餐廳自己也開早餐店", "客戶主要是 餐廳，我也開早餐店", "客戶主要是 餐廳、 飯店", "客戶主要是 餐廳 飯店", "賣給咖啡館，咖啡館", // v1_12 增八句
  "賣給餐廳/開早餐店", // v1_12 應得輸出另舉「v1_11 之「賣給餐廳/開早餐店」」（輸入欄未列，為 Q132 之句），一併查
  ...E.q114_c14, // v1_13 增〔抽：q114_c14〕之 12 句（斜線、加號列舉客戶等）
  ...E.q114_c16]; // v1_15 增〔抽：q114_c16〕之 9 句（斜線、加號旁有空白）
const Q115_IN = ["果園", "土木工程", "理財規劃", "CNC加工", "安親", "茶葉", "在網路平台賣", "包裝", "手作", "工程行", "電商倉儲", "居家清潔用品", "賣油漆", "保單健檢", "租賃小客車", "企劃", "水電材料", "建築工程",
  "網路平台", "經營網路平台", "企業企劃", "車輛美容", "茶葉批發"]; // v1_9 增後五句
// v1_14（c15 第一題）：查詢不選組織型態；Q42～Q44 改為驗證表 v1_14 之輸入（「咖啡廳」、F112010、H101021、J905010、HZ07011）
const Q78_QUERIES = ["C802041", "E801060", "J701010", "F112010", "J905010", "H203011", "I103060", "HZ07011", "G606011", "機場園區", "H101021", "ZZ99999", "室內設計", ...E.q20.map(x => x.input), "qwerty火星挖礦", "咖啡廳",
  "G901011", "G902011", "第一類電信", "第二類電信", "特定電力", "加氫", "網路廣告", "獵槍", "寵物生命", "I102010", "I503010", "JA02071", "e801060", " E801060 ", "E801060。", ...AC.map(x => x.input), E.placeholder_example, ...E.purpose_examples, E.q93.input, E.q94.word, ...Object.keys(E.q100), "咖啡廳 手搖飲", "賣保養品", "接案設計LOGO", ...Object.keys(E.q103), "製造", "當舖", "咖啡廳 飲料", "室內、設計",
  ...Q109_IN, ...Q109_TEXT, "咖啡廳 一", "賣化妝品", "做業務", ...Q112_IN, ...Q113_IN, ...Q114_IN, ...Q115_IN, "寵物店 寵物美容 寵物旅館", "咖啡廳.蛋糕", "咖啡廳．蛋糕", "飲料店 餐飲業",
  ...E.all_inputs, "E801060", "G606011", ...E.plain_codes]; // v1_8：含 Q128 全部輸入；v1_16：增 Q135、Q136 之查詢
R.Q78 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    for (const q of Q78_QUERIES) { await query(p, q); await showAll(p); }
    await p.fill("#biz", "咖".repeat(300)); await p.dispatchEvent("#biz", "input"); await query(p, "賣保養品");
    await p.fill("#biz", "賣保養品 改");
    await p.evaluate(() => { const d = document.querySelector("details"); d.open = true; d.open = false; });
    await p.emulateMedia({ media: "print" }); await p.emulateMedia({ media: "screen" });
    await p.waitForTimeout(300);
    const own = r => r === p.__url;
    const other = p.__req.filter(r => !own(r)); const wr = await writes(p);
    const srcBad = ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket"].filter(s => env.src.tool.includes(s));
    await p.reload({ waitUntil: "load" });
    const rl = await p.evaluate(() => ({ v: document.querySelector("#biz").value, cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent }));
    const wr2 = await writes(p);
    const ph = await p.evaluate(t => { const ta = document.querySelector("#biz"); const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); return !!e && Math.abs(e.getBoundingClientRect().top - ta.getBoundingClientRect().bottom) < 60; }, A.privacy_hint);
    // v1_18（規格 v1_21 第十一節之 2）：label[for=biz] 之後、textarea 之前恰一處隱私句（innerText 逐字等於 shell_privacy），各狀態恆一處可見；不在 textarea 之 aria-describedby；頁尾免責句逐字等於 shell_disclaimer
    const privAt = () => p.evaluate(([priv, disc]) => { const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
      const all = [...document.querySelectorAll("body *")]; const ps = all.filter(e => (e.innerText || "").trim() === priv && ![...e.children].some(c => (c.innerText || "").trim() === priv));
      const lab = document.querySelector('label[for="biz"]'), ta = document.querySelector("#biz"); const e = ps[0];
      const between = !!e && !!lab && !!ta && !!(lab.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(e.compareDocumentPosition(ta) & Node.DOCUMENT_POSITION_FOLLOWING);
      const desc = (ta.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean); const fd = document.querySelector("footer#siteFoot > div.wrap");
      return { n: ps.length, visible: ps.filter(vis).length, between, inDescribedby: !!e && !!e.id && desc.includes(e.id), describedby: desc, footDisc: !!fd && [...fd.children].some(c => c.innerText.trim() === disc) }; }, [A.shell_privacy, A.shell_disclaimer]);
    const privStates = { 重新整理後: await privAt() };
    await query(p, "室內設計"); privStates.查詢後 = await privAt(); await query(p, "製造"); await showAll(p); privStates.顯示全部後 = await privAt(); await query(p, "qwerty火星挖礦"); privStates.查無後 = await privAt(); await p.fill("#biz", "室內設計"); privStates.輸入未查 = await privAt();
    const disc = Object.values(privStates).every(x => x.n === 1 && x.visible === 1 && x.between && !x.inDescribedby && x.footDisc);
    const other2 = p.__req.filter(r => !own(r));
    return ok(other.length === 0 && other2.length === 0 && srcBad.length === 0 && w0(wr) && w0(wr2) && rl.v === "" && rl.cards === 0 && rl.res === "" && ph && disc,
      { queries: Q78_QUERIES.length + 1, requestsTotal: p.__req.length, requestsAll: [...new Set(p.__req)], requestsOtherThanPage: other2, srcBad, writes: wr, writesAfterReload: wr2, reload: rl, privacyHint: ph, shellPrivacyAndDisclaimer: disc, shellPrivacyStates: privStates, pageErrors: p.__errs });
  } finally { await close(p); }
};
R.Q79 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, "咖啡廳 飲料"); await showAll(p); const a = await resState(p);
    const xa = CAND["咖啡廳 飲料"];
    d.a = { rows: a.rows, sib: a.sib, ok: a.rows[0] === "F501030" && same(a.rows, xa.rows) && same(a.sib, xa.siblings) };
    await query(p, "室內、設計"); await showAll(p); const b = await resState(p); const all = b.rows.concat(b.sib);
    const xb = CAND["室內、設計"];
    d.b = { count: all.length, head: all.slice(0, 30), ok: all.includes("E801060") && (xb.rows ? same(b.rows, xb.rows) && same(b.sib, xb.siblings) : same(all.slice(0, 30), xb.rows_head) && all.length === xb.count) };
    return ok(d.a.ok && d.b.ok, d);
  } finally { await close(p); }
};
R.Q85 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, "製造"); const n1 = (await cards(p)).length; const btn = await p.$("#showAll"); const bt = btn ? await btn.textContent() : null;
    if (btn) await btn.click(); const n2 = (await cards(p)).length; const gone = !(await p.$("#showAll"));
    await query(p, "當舖"); const n3 = (await cards(p)).length; const btn2 = await p.$("#showAll");
    const N = CAND["製造"].count;
    Object.assign(d, { first: n1, button: bt, all: n2, gone, pawn: n3, pawnButton: !!btn2 });
    return ok(n1 === 30 && bt === A.show_all_btn.replace("N", String(N)) && n2 === N && gone && n3 <= 30 && n3 > 0 && !btn2, d);
  } finally { await close(p); }
};
async function headState(p) {
  return p.evaluate(([t, lead, c8]) => {
    const h = [...document.querySelectorAll("h1")]; const r = h[0] && h[0].getBoundingClientRect();
    const ta = document.querySelector("#biz,textarea");
    const leadEl = [...document.querySelectorAll("p")].find(e => e.innerText.trim() === lead);
    const ol = leadEl && leadEl.nextElementSibling;
    const li = ol && ol.tagName === "OL" ? [...ol.children].map(x => x.innerText.trim()) : null;
    const after = (x, y) => !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { h1: h.length, text: h[0] && h[0].innerText, inView: !!r && r.top >= 0 && r.bottom <= window.innerHeight && window.scrollY === 0, leadAfterH1: after(h[0], leadEl), olBeforeInput: ta ? after(ol, ta) : true, li, c8: document.body.innerText.includes(c8) };
  }, [A.page_title, A.purpose_lead, C8_PURPOSE]);
}
function rawHas(raw) {
  raw = raw.replace(/<script[\s\S]*?<\/script>/g, ""); // 原始 HTML 之標記本身；script 內之字串不算
  const h1 = (raw.match(/<h1[\s>][\s\S]*?<\/h1>/g) || []);
  const strip = s => s.replace(/<[^>]+>/g, "");
  const hasLead = raw.includes(A.purpose_lead);
  const lis = [A.purpose_item_1, A.purpose_item_2, A.purpose_item_3].every(t => new RegExp(`<li>${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</li>`).test(raw));
  return { h1: h1.length, h1text: h1[0] && strip(h1[0]), hasLead, lis, c8: raw.includes(C8_PURPOSE) };
}
R.Q95 = async (ctx, u) => {
  const d = []; let all = true;
  for (const w of WIDTHS) { const p = await ctx.page(u.tool, w, 768); try { const s0 = await headState(p); await query(p, "室內設計"); const s1 = await headState(p); const rw = rawHas(p.__raw);
    const g = s0.h1 === 1 && s0.text === A.page_title && s0.inView && s1.h1 === 1 && s1.text === A.page_title && rw.h1 === 1 && rw.h1text === A.page_title; d.push({ w, load: s0, after: { h1: s1.h1, text: s1.text }, raw: rw }); all = all && g; } finally { await close(p); } }
  return ok(all, d);
};
R.Q96 = async (ctx, u, env) => {
  const d = []; let all = true;
  for (const w of WIDTHS) { const p = await ctx.page(u.tool, w, 768); try { const s0 = await headState(p); await query(p, "室內設計"); const s1 = await headState(p); const rw = rawHas(p.__raw);
    const items = [A.purpose_item_1, A.purpose_item_2, A.purpose_item_3];
    const g = [s0, s1].every(s => s.leadAfterH1 && s.olBeforeInput && same(s.li, items) && !s.c8) && rw.hasLead && rw.lis && !rw.c8 && !env.src.tool.includes(C8_PURPOSE); d.push({ w, load: s0, after: s1, raw: rw }); all = all && g; } finally { await close(p); } }
  return ok(all, d);
};
R.Q97 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { const s = await p.evaluate(() => { const ta = document.querySelector("#biz"); const lab = document.querySelector(`label[for="${ta.id}"]`); const ids = (ta.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean); return { label: lab && lab.textContent.trim(), ph: ta.getAttribute("placeholder"), described: ids.map(i => (document.getElementById(i) || {}).textContent) }; });
    return ok(s.label === A.input_label && s.ph === A.input_placeholder && s.described.includes(A.privacy_hint), s); } finally { await close(p); }
};
R.Q98 = async (ctx, u) => {
  const chk = p => p.evaluate(([i3, i4]) => { const det = document.querySelector("details"); det.open = true; const all = [...document.querySelectorAll("body *")].filter(e => e.innerText && e.innerText.trim() === i4 && !e.children.length); const e = all[0]; const t3 = [...document.querySelectorAll("li")].find(x => x.innerText.trim() === i3); const r = { n: all.length, inDetails: !!e && det.contains(e), after3: !!e && !!t3 && !!(t3.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) }; det.open = false; return r; }, [A.basis_item_3, A.basis_item_4]);
  const r = await eachWidth(ctx, u.tool, async p => { const s = await chk(p); return ok(s.n === 1 && s.inDetails && s.after3, s); }, [null]);
  const p = await ctx.page(u.tool); let s;
  try { await query(p, AC[0].input); s = await chk(p); s.tagged = (await cards(p)).some(x => x.tag); } finally { await close(p); }
  return ok(r.ok && s.n === 1 && s.inDetails && s.after3 && s.tagged, { widths: r.detail, result: s });
};
R.Q104 = async (ctx, u) => {
  const st = p => p.evaluate(t => { const ta = document.querySelector("#biz"); const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; }; const hs = [...document.querySelectorAll("body *")].filter(e => e.textContent === t && !e.children.length && vis(e)); const ids = (ta.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean); return { len: [...ta.value].length, ml: ta.getAttribute("maxlength"), hints: hs.length, described: ids.some(i => { const e = document.getElementById(i); return e && e.textContent.includes(t) && vis(e); }) }; }, A.input_max_hint);
  const d = {}; const p = await ctx.page(u.tool);
  try {
    await p.click("#biz"); await p.keyboard.type("咖啡廳".repeat(100) + "店"); d.typed = await st(p);
    await p.click("#searchBtn"); d.searchAfterTyped = await p.evaluate(() => ({ disabled: document.querySelector("#searchBtn").disabled, cards: document.querySelectorAll("#results .cand").length }));
    await p.fill("#biz", ""); await p.click("#biz"); await p.keyboard.insertText("店".repeat(400)); d.pasted = await st(p);
    await p.fill("#biz", ""); await p.click("#biz"); await p.keyboard.insertText("店".repeat(299)); d.n299 = await st(p);
    const g = [d.typed, d.pasted].every(s => s.len === 300 && s.ml === "300" && s.hints === 1 && s.described) && d.n299.hints === 0 && !d.searchAfterTyped.disabled && d.searchAfterTyped.cards > 0;
    return ok(g, d);
  } finally { await close(p); }
};
R.Q105 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, AC[0].input);
    d.s1 = await p.evaluate(input => {
      const res = document.querySelector("#results"); const above = e => !!e && (e.getBoundingClientRect().top < res.getBoundingClientRect().top) && !!(e.compareDocumentPosition(res) & Node.DOCUMENT_POSITION_FOLLOWING) && e.getBoundingClientRect().height > 0;
      const ta = document.querySelector("#biz");
      const echo = [...document.querySelectorAll("body *")].filter(e => e !== ta && !e.children.length && (e.textContent || "").includes(input)).length;
      return { h1: above(document.querySelector("h1")), ol: above(document.querySelector("ol")), ta: above(ta), taVal: ta.value === input, btn: above(document.querySelector("#searchBtn")), echo };
    }, AC[0].input);
    await p.fill("#biz", "qwerty火星挖礦"); await p.click("#searchBtn");
    d.s2 = { cards: (await cards(p)).length, nr: await visibleTextCount(p, A.no_result) };
    await p.fill("#biz", "製造"); await p.click("#searchBtn"); await showAll(p);
    await p.fill("#biz", "早餐店"); await p.click("#searchBtn");
    const st = await resState(p);
    d.s4 = { rows: st.rows, sib: st.sib, btn: st.showAll, notice: st.notice, hint: st.old, stale: st.stale };
    const x = CAND["早餐店"];
    const g = d.s1.h1 && d.s1.ol && d.s1.ta && d.s1.taVal && d.s1.btn && d.s1.echo === 0 && d.s2.cards === 0 && d.s2.nr === 1 && same(st.rows, x.rows) && same(st.sib, x.siblings) && !st.showAll && st.notice === 1 && st.old === 0 && st.stale === 0;
    return ok(g, d);
  } finally { await close(p); }
};
R.Q106 = async (ctx, u) => {
  const snap = p => p.evaluate(([disc, ver, att]) => { document.querySelectorAll("details").forEach(x => { x.open = false; }); const all = [...document.querySelectorAll("body *")]; const d = all.find(e => e.textContent === disc && !e.children.length); const v = all.find(e => e.textContent === ver && !e.children.length); let f = d; while (f && !(f.contains(v))) f = f.parentElement; const a = all.find(e => e.textContent === att && ![...e.children].some(c => c.textContent === att)); return { foot: f ? f.outerHTML : null, att: a ? a.outerHTML : null }; }, [A.disclaimer, A.version_line, A.attribution]); // c20：顯名移入頁尾收合列，收合後其 innerText 為空，改以 textContent 定位（期望不變）
  const d = []; let all = true;
  for (const w of [1366, 390]) {
    const p = await ctx.page(u.tool, w, 768);
    try { const s = [await snap(p)]; await query(p, AC[0].input); s.push(await snap(p)); await query(p, "qwerty火星挖礦"); s.push(await snap(p)); await query(p, "製造"); await showAll(p); s.push(await snap(p));
      const g = s.every(x => x.foot && x.foot === s[0].foot && x.att && x.att === s[0].att); d.push({ w, sameFoot: s.map(x => x.foot === s[0].foot), sameAtt: s.map(x => x.att === s[0].att) }); all = all && g; } finally { await close(p); }
  }
  return ok(all, d);
};
async function q107Engine(browser, url, origin) {
  const ctx = new Ctx(browser); const p = await ctx.page(url);
  const st = () => p.evaluate(() => ({ v: document.querySelector("#biz").value, res: document.querySelector("#results").textContent, cards: document.querySelectorAll("#results .cand").length, detailsOpen: [...document.querySelectorAll("details")].some(d => d.open), ac: [document.querySelector("#biz").getAttribute("autocomplete")], pageshow: window.__ps.slice() }));
  const openBasis = () => p.evaluate(() => { document.querySelectorAll("details").forEach(d => { d.open = true; }); });
  try {
    await query(p, AC[0].input); await openBasis(); await p.reload({ waitUntil: "load" }); const a = await st();
    await query(p, AC[0].input); await openBasis(); await p.goto(origin + "/other.html", { waitUntil: "load" });
    await p.goBack({ waitUntil: "commit" }); await p.waitForTimeout(800); const b = await st();
    const wr = await writes(p);
    const clean = s => s.v === "" && s.res === "" && s.cards === 0 && !s.detailsOpen && s.ac.every(x => x === "off");
    return { ok: clean(a) && clean(b) && w0(wr), reload: a, back: b, writes: wr };
  } finally { await close(p); }
}
/* Q107（v1_16，判定方式二十六）：各瀏覽器設定分別判定為通過、未通過或未執行；任一設定未通過者本列未通過；無未通過而有設定未執行（含無法啟動）或未跑者本列未執行；
 * 全部設定通過者本列通過。各設定之判定以三值字串為之，不以 null 參與布林運算（代測判讀 2b6e7f0 四之一）。
 * 判定方式二十七（E155）：env.q107FailFull 或參數 --q107-fail-full 為真者，「完整 Chromium 並啟用往返快取」之設定於啟動時拋錯（不改頁面） */
const q107Verdict = settings => { const v = Object.values(settings).map(x => x.verdict); return v.includes("未通過") ? false : v.includes("未執行") ? null : true; };
R.Q107 = async (ctx, u, env) => {
  const origin = `http://127.0.0.1:${PORT}`;
  const run = async (launch) => {
    let b = null;
    try { b = await launch(); } catch (e) { return { verdict: "未執行", launchFailure: true, error: "判定方式二十五：瀏覽器無法啟動，此設定記未執行；錯誤訊息：" + String(e && e.message || e).split("\n")[0] }; }
    try { const r = await q107Engine(b, u.tool, origin); return { verdict: r.ok ? "通過" : "未通過", ...r }; }
    finally { if (b !== ctx.browser) await b.close().catch(() => { }); }
  };
  const failFull = !!(env && env.q107FailFull) || Q107_FAIL_FULL;
  const settings = {
    chromium_playwright_default: await run(async () => { if (!ctx.browser) throw new LaunchError("瀏覽器無法啟動：" + ctx.launchError); return ctx.browser; }),
    chromium_bfcache_enabled: await run(async () => {
      if (failFull) throw new Error("browserType.launch: 判定方式二十七之自檢（E155）：本設定依參數於啟動時拋錯，非真實環境之失敗");
      return chromium.launch({ channel: "chromium", ignoreDefaultArgs: ["--disable-back-forward-cache"] });
    }),
    firefox: { verdict: "未執行", note: "未跑：七題之七，115/10/23 後以本機 Code 會話補跑" },
    webkit: { verdict: "未執行", note: "未跑：七題之七，115/10/23 後以本機 Code 會話補跑" },
  };
  // 判定方式二十八（驗證表 v1_17）：任一設定無法啟動而記未執行者，以結構化欄位 launchFailure 回報（供刻意錯誤之判定；不以明細之字串比對）
  const lfSet = Object.keys(settings).filter(k => settings[k].verdict === "未執行" && settings[k].launchFailure);
  return { ok: q107Verdict(settings), launchFailure: lfSet.length > 0, launchFailureSettings: lfSet, detail: { settings, verdicts: Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, v.verdict])), failFullSelfCheck: failFull,
    note: "判定方式二十六：任一設定未通過者本列未通過；無未通過而有設定未執行或未跑者本列未執行；全部通過者本列通過" } };
};
R.Q108 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    await p.waitForTimeout(300);
    const res = await p.evaluate(() => [...document.querySelectorAll("link,script,img,source,iframe")].map(e => e.getAttribute("src") || e.getAttribute("href")).filter(s => s && !s.startsWith("data:")));
    const words = ["fonts.googleapis.com", "fonts.gstatic.com", "@font-face", "@import"].filter(w => env.src.tool.includes(w));
    const ff = await p.evaluate(() => getComputedStyle(document.body).fontFamily);
    return ok(res.length === 0 && words.length === 0 && p.__req.length === 1, { nonDataRefs: res, words, requests: p.__req, fontFamily: ff });
  } finally { await close(p); }
};
/* ───────── 八之二、c10 新增 ───────── */
R.Q109 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q109_IN.concat(Q109_TEXT)) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q); await showAll(p); const st = await resState(p); const t = await topState(p); const c = CAND[q];
      const nfOrder = await p.evaluate(([texts]) => { const all = [...document.querySelectorAll("body *")]; const els = texts.map(t => all.filter(e => e.textContent === t && !e.children.length)); const h = document.querySelector("#results h2"); return { counts: els.map(x => x.length), aboveHeading: els.every(x => !x[0] || !h || (!!(x[0].compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) && x[0].getBoundingClientRect().top < h.getBoundingClientRect().top)) }; }, [c.missing.map(notFound)]);
      let g;
      if (Q109_TEXT.includes(q)) { // v1_9 三句：mode 為 text；得分列、補列與標示等於 candidates；不顯示 code_not_found
        const m = candMatch(st, q);
        g = c.mode === "text" && m.ok && st.missing.length === 0 && (c.rows.length ? t.heading === 1 && t.headingText === heading(c.scored_count) : t.heading === 0);
        d[q] = { mode: c.mode, rows: st.rows, sib: st.sib, tags: st.tags, missingShown: st.missing, match: m, heading: t.headingText };
      } else {
        g = c.mode === "code" && same(st.rows, c.rows) && same(st.missing, c.missing) && nfOrder.counts.every(n => n === 1) && nfOrder.aboveHeading && Object.keys(st.tags).length === 0 && st.sibHeading === 0 && st.sib.length === 0
          && (c.rows.length === 0 ? t.heading === 0 && t.notice === 0 : t.heading === 1 && t.headingText === heading(c.scored_count));
        d[q] = { mode: c.mode, rows: st.rows, missing: st.missing, nf: nfOrder, heading: t.heading, headingText: t.headingText, notice: t.notice, sibHeading: st.sibHeading };
      }
      all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q110 = async (ctx, u) => {
  const d = {};
  for (const q of ["咖啡廳 一", "咖啡廳"]) { const p = await ctx.page(u.tool); try { await query(p, q); await showAll(p); const st = await resState(p); d[q] = { rows: st.rows, sib: st.sib, tags: st.tags }; } finally { await close(p); } }
  const x = CAND["咖啡廳"];
  return ok(same(d["咖啡廳 一"], d["咖啡廳"]) && same(d["咖啡廳"].rows, x.rows) && same(d["咖啡廳"].sib, x.siblings) && same(d["咖啡廳"].tags, x.tags), d);
};
R.Q111 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of ["賣化妝品", "咖啡廳 飲料", "做業務", "飲料店 餐飲業"]) { // v1_8 增第四句
    const p = await ctx.page(u.tool);
    try {
      await query(p, q); await showAll(p); const st = await resState(p); const c = CAND[q];
      const tagged = st.rows.map(k => !!st.tags[k]); const lastT = tagged.lastIndexOf(true), firstU = tagged.indexOf(false);
      const orderOk = c.rows ? same(st.rows, c.rows) : same(st.rows.concat(st.sib).slice(0, 30), c.rows_head);
      let g = (lastT < 0 || firstU < 0 || lastT < firstU) && orderOk;
      if (q === "賣化妝品") g = g && st.rows[0] === "F208040" && !!st.tags.F208040;
      d[q] = { head: st.rows.slice(0, 8), taggedFirst: lastT < 0 || firstU < 0 || lastT < firstU, orderOk }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q112 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q112_IN) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q); await showAll(p); const st = await resState(p); const exp = tagsOf(q);
      const supCodes = [...new Set(CAND[q].suppressed.map(x => x[1]))].filter(k => !(k in exp));
      let g = setEq(Object.keys(st.tags), Object.keys(exp)) && Object.keys(exp).every(k => st.tags[k] === exp[k]) && supCodes.every(k => !st.tags[k]);
      if (q === "開豆花店") g = g && !st.rows.includes("F201070") && !st.sib.includes("F201070");
      if (q === "保險經紀") g = g && !st.tags.J602010;
      // v1_9 增列之句之明列條件
      if (q === "腳底按摩") g = g && !st.tags.JF01020;
      if (q === "室內裝修") g = g && !st.tags.E801010;
      if (q === "經營網路平台") g = g && !!st.tags.I301030 && !st.tags.F399040;
      if (q === "電商倉儲、電商") g = g && !!st.tags.F399040;
      if (q === "車輛美容") g = g && !!st.tags.JA01010 && !st.tags.JZ99080;
      d[q] = { tags: st.tags, suppressed: CAND[q].suppressed, suppressedCodesUntagged: supCodes.every(k => !st.tags[k]) }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q113 = async (ctx, u, env) => {
  const d = {}; let all = true;
  for (const q of Q113_IN) {
    const p = await ctx.page(u.tool);
    try { await query(p, q); await showAll(p); const st = await resState(p); const exp = tagsOf(q); d[q] = st.tags; all = all && setEq(Object.keys(st.tags), Object.keys(exp)) && Object.keys(exp).every(k => st.tags[k] === exp[k]) && setEq(Object.keys(st.tags), Q113_LISTED[q]); } finally { await close(p); }
  }
  const X = embedded(env.src.tool, "data-excepts");
  d.embeddedExcepts = X ? X.length : null;
  const exOk = !!X && same(X, E.appendix_d.map(e => [e.short, e.long, e.codes]));
  d.embeddedEqualsAppendixD = exOk;
  return ok(all && exOk && E.appendix_d.length === 13 && X.length === 13, d); // v1_9：13 對（刪第 58、66 對）
};
R.Q114 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q114_IN) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q); await showAll(p); const st = await resState(p); const m = candMatch(st, q);
      let g = m.ok;
      if (q === Q114_IN[0]) g = g && !st.rows.includes("F301020") && !st.rows.includes("F501060");
      if (q === Q114_IN[1]) g = g && !st.tags.F501060;
      if (q === Q114_IN[2] || q === Q114_IN[3]) g = g && !!st.tags.F501060;
      if (q === "賣給餐廳 開早餐店") g = g && !!st.tags.F501060;
      if (q === "做麵包，供應給餐廳") g = g && !st.rows.includes("F501060");
      // v1_11（c12 第一題）：起始字後之空白略過；自打之詞全部出現均與客戶位置重疊者不計
      if (q === "客戶主要是 餐廳和飯店") g = g && st.rows.length === 0 && st.sib.length === 0 && !st.rows.includes("F501060") && !st.rows.includes("J901020");
      if (q === "做麵包，供應給 餐廳") g = g && !st.rows.includes("F501060");
      if (q === "賣給餐廳、飯店，也開早餐店") g = g && !st.rows.includes("J901020") && !!st.tags.F501060;
      if (q === "賣給\u3000餐廳，開早餐店") g = g && !!st.tags.F501060;
      if (q === "賣給、早餐店") g = g && st.rows.length === 0 && st.sib.length === 0; // v1_14 為 0 筆（另以 candMatch 比 candidates）
      // v1_12（c13 第一、二題）：無終點者記錄現況；客戶列舉中之空白為已知限制（規格 P30）；至少一處不重疊者照計
      // v1_13（c14 第一題）：斜線、加號不為客戶位置之終點；下列四句均 0 筆（v1_12 時 F501060 標）
      if (["客戶主要是 餐廳/我也開早餐店", "客戶主要是 餐廳+我也開早餐店", "賣給餐廳+開早餐店", "賣給餐廳/開早餐店"].includes(q)) g = g && st.rows.length === 0 && !st.tags.F501060;
      if (q === "賣給 餐廳自己也開早餐店") g = g && st.rows.length === 0 && st.sib.length === 0;
      if (q === "客戶主要是 餐廳 飯店") g = g && st.rows.includes("J901020");
      if (q === "賣給咖啡館，咖啡館") g = g && !!st.tags.F501030 && same(st.rows, CAND[q].rows);
      // v1_13 十二句：前四句、「賣給餐廳/飯店+我也開早餐店」與全形兩句均 0 筆；「…，也開早餐店」三句均只 F501060 一列且標；
      // 「客戶主要是 餐廳/飯店，我做清潔」與對照句之得分列相同且均不含 J901020、H201010
      if ([...E.q114_c14.slice(0, 5), ...E.q114_c14.slice(10, 12)].includes(q)) g = g && st.rows.length === 0;
      if (E.q114_c14.slice(5, 8).includes(q)) g = g && same(st.rows, ["F501060"]) && !!st.tags.F501060;
      if (E.q114_c14.slice(8, 10).includes(q)) g = g && same(st.rows, (CAND[E.q114_c14[8]] || {}).rows || [null]) && same(st.rows, (CAND[E.q114_c14[9]] || {}).rows || [null]) && !st.rows.includes("J901020") && !st.rows.includes("H201010");
      // v1_15 九句（c16 第一題）：前六句與「賣給餐廳 / 開早餐店」均 0 筆；「賣給餐廳 / 飯店，也開早餐店」只 F501060 一列且標；「客戶主要是 餐廳 飯店 / 民宿」含 J901020 之列（已知限制，規格 P30）
      if ([...E.q114_c16.slice(0, 6), E.q114_c16[7]].includes(q)) g = g && st.rows.length === 0;
      if (q === E.q114_c16[6]) g = g && same(st.rows, ["F501060"]) && !!st.tags.F501060;
      if (q === E.q114_c16[8]) g = g && st.rows.includes("J901020");
      d[JSON.stringify(q)] = { rows: st.rows, sib: st.sib, tags: st.tags, match: m }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all && E.q114_c16.length === 9 && E.q114_c16.every(q => Q114_IN.includes(q)), d); // v1_15：〔抽：q114_c16〕之 9 句均已查
};
R.Q115 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q115_IN) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q); await showAll(p); const st = await resState(p); const exp = tagsOf(q); const n = st.rows.length + st.sib.length;
      let g = setEq(Object.keys(st.tags), Object.keys(exp)) && Object.keys(exp).every(k => st.tags[k] === exp[k]) && n === CAND[q].count;
      if (["包裝", "手作", "工程行", "網路平台", "企劃"].includes(q)) g = g && Object.keys(st.tags).length === 0; // v1_9 增後二
      if (q === "茶葉") g = g && setEq(Object.keys(st.tags), ["C111010", "F102050", "F203010"]); // v1_9
      d[q] = { tags: st.tags, count: n, expectCount: CAND[q].count }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
/* 補列之標題、說明與小標（v1_9）：sibling_heading 為 h3（tabindex -1），其後緊接 sibling_note，其前為最後一筆得分列 */
async function sibState(p) {
  return p.evaluate(([sh, sn, stg]) => {
    const res = document.querySelector("#results"); const all = [...res.querySelectorAll("*")];
    const hs = all.filter(e => e.textContent === sh && ![...e.children].some(c => c.textContent === sh));
    const h = hs[0], next = h && h.nextElementSibling, prev = h && h.previousElementSibling, ae = document.activeElement;
    return { n: hs.length, tag: h ? h.tagName : null, tabindex: h ? h.getAttribute("tabindex") : null, noteNext: !!next && next.textContent === sn && !next.children.length,
      afterNote: next && next.nextElementSibling && next.nextElementSibling.classList.contains("cand") ? next.nextElementSibling.dataset.code : null,
      // DOM 順序（文件順序）上 sibling_heading 之前最近之一張卡（v1_11：補列包於 section 後，heading 不再與得分列同層）
      prevCode: (() => { if (!h) return null; const before = [...res.querySelectorAll(".cand")].filter(c => !!(c.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING)); return before.length ? before[before.length - 1].dataset.code : null; })(),
      notes: all.filter(e => e.textContent === sn && !e.children.length).length, sibTags: all.filter(e => e.textContent === stg && !e.children.length).length,
      active: !!h && ae === h, activeDesc: ae ? (ae.dataset && ae.dataset.code) || ae.tagName + (ae.id ? "#" + ae.id : "") : null,
      section: (() => { // v1_11（c12 第五題）：sibling_heading、sibling_note 與全部補列為同一個 section 之後代，其 aria-labelledby 等於 sibling_heading 之 id；得分列不在其內
        const cardsAll = [...res.querySelectorAll(".cand")]; const hi = h ? cardsAll.filter(c => !!(h.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)) : [];
        const note = next && next.textContent === sn ? next : null;
        const secs = [...document.querySelectorAll("section")].filter(x => !!h && x.contains(h) && !!note && x.contains(note) && hi.every(c => x.contains(c)) && cardsAll.filter(c => !hi.includes(c)).every(c => !x.contains(c)));
        const lab = secs.filter(x => !!h.id && x.getAttribute("aria-labelledby") === h.id);
        return { candidates: secs.length, labelled: lab.length, headingId: h ? h.id : null, ariaOfCandidates: secs.map(x => x.getAttribute("aria-labelledby")) };
      })(),
      // v1_12（c13 第三題）：最後一筆得分列與 sibling_heading 之間（文件順序）無其他元素；section 之 computed display、flex-direction、row-gap 與 #results 相同，border、padding、margin 各邊均為 0
      // v1_13（c14 第四題之三）：判定時只排除該 section 本身與最後一筆得分列之後代，不排除 section 以外之祖先；section 之父元素為 #results
      layout: (() => {
        if (!h) return null;
        const sec = h.closest("section");
        const scored = [...res.querySelectorAll(".cand")].filter(c => !!(c.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) && !(sec && sec.contains(c)));
        const last = scored[scored.length - 1];
        const between = last ? [...document.querySelectorAll("body *")].filter(e => !!(last.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) && !last.contains(e) && !!(e.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) && e !== sec).map(e => e.tagName + (e.id ? "#" + e.id : "")) : null;
        const cs = sec ? getComputedStyle(sec) : null, cr = getComputedStyle(res);
        const sides = ["Top", "Right", "Bottom", "Left"];
        const box = cs ? { border: sides.map(x => cs["border" + x + "Width"]), padding: sides.map(x => cs["padding" + x]), margin: sides.map(x => cs["margin" + x]) } : null;
        const same3 = !!cs && cs.display === cr.display && cs.flexDirection === cr.flexDirection && cs.rowGap === cr.rowGap;
        const zero = !!box && [...box.border, ...box.padding, ...box.margin].every(v => parseFloat(v) === 0);
        const parentIsResults = !!sec && sec.parentElement === res;
        return { between, display: cs && [cs.display, cr.display], flexDirection: cs && [cs.flexDirection, cr.flexDirection], rowGap: cs && [cs.rowGap, cr.rowGap], box, sameAsResults: same3, allZero: zero, parentIsResults, ok: !!between && between.length === 0 && same3 && zero && parentIsResults };
      })(),
      // 指向 sibling_heading（以字樣認定）之 aria-labelledby；三、四、七須為 0
      labelledByHeading: [...document.querySelectorAll("[aria-labelledby]")].filter(x => (x.getAttribute("aria-labelledby") || "").split(/\s+/).some(id => { const t = id && document.getElementById(id); return !!t && t.textContent === sh; })).length };
  }, [A.sibling_heading, A.sibling_note, A.sibling_tag]);
}
const sectionOk = ss => ss.section.labelled >= 1 && !!ss.layout && ss.layout.ok; // v1_12：一、二、六另判 layout（二、六於按「顯示全部」後判）
const sibCardsOk = (st, x) => x.siblings.every(k => st.sibTagByCard[k] === 1) && x.rows.every(k => st.sibTagByCard[k] === 0) && st.sib.every(k => !st.tags[k]);
async function q116Show(ctx, u, w, h, q = "寵物店 寵物美容 寵物旅館") {
  const p = await ctx.page(u.tool, w, h);
  try {
    await query(p, q); const s0 = await resState(p); const first = s0.rows.length + s0.sib.length;
    const bt = await p.$("#showAll"); const btText = bt ? await bt.textContent() : null; await showAll(p); const s1 = await resState(p); const ss = await sibState(p); const x = CAND[q];
    const headingFirstNew = x.rows.length === first && x.siblings.length > 0; // 新列出之第一個元素為 sibling_heading 者
    const g = first === 30 && btText === A.show_all_btn_sib.replace("N", String(x.count)) && sectionOk(ss) && same(s1.rows, x.rows) && same(s1.sib, x.siblings) && s1.sibHeading === 1 && s1.sibHeadingBeforeFirstSib === true
      && ss.tag === "H3" && ss.noteNext && ss.prevCode === x.rows[x.rows.length - 1] && sibCardsOk(s1, x) && (!headingFirstNew || ss.active);
    return { ok: g, detail: { input: q, w, h, first, firstSibHeading: s0.sibHeading, button: btText, expectButton: A.show_all_btn_sib.replace("N", String(x.count)), after: { rows: s1.rows.length, sib: s1.sib.length, sibHeading: s1.sibHeading, adjacent: s1.sibHeadingBeforeFirstSib, sibState: ss }, headingFirstNew, activeAfterShowAll: ss.activeDesc } };
  } finally { await close(p); }
}
R.Q116 = async (ctx, u) => {
  const d = {}; let all = true;
  { const p = await ctx.page(u.tool, 1366, 768);
    try { await query(p, "室內設計"); const st = await resState(p); const t = await topState(p); const ss = await sibState(p); const x = CAND["室內設計"];
      const g = same(st.rows, x.rows) && st.sibHeading === 1 && st.sibHeadingBeforeFirstSib === true && ss.tag === "H3" && ss.tabindex === "-1" && ss.noteNext && ss.notes === 1 && ss.prevCode === x.rows[x.rows.length - 1] && ss.afterNote === x.siblings[0]
        && same(st.sib, x.siblings) && sibCardsOk(st, x) && ss.sibTags === x.siblings.length && t.headingText === heading(x.scored_count) && sectionOk(ss);
      d.一 = { rows: st.rows, sib: st.sib, sibHeading: st.sibHeading, adjacent: st.sibHeadingBeforeFirstSib, sibState: ss, sibTagByCard: st.sibTagByCard, sibTagged: st.sib.filter(k => st.tags[k]), heading: t.headingText, expectHeading: heading(x.scored_count) }; all = all && g; } finally { await close(p); } }
  { const r = await q116Show(ctx, u, 1366, 768); d.二 = r.detail; all = all && r.ok; }
  d.三四 = {};
  for (const q of ["機場園區", "e801060", "E801060,E801010", "當舖"]) { const p = await ctx.page(u.tool, 1366, 768); try { await query(p, q); await showAll(p); const st = await resState(p); const ss = await sibState(p); d.三四[q] = { sibHeading: st.sibHeading, sibNote: ss.notes, sibTag: ss.sibTags, sib: st.sib, tagged: Object.keys(st.tags), labelledByHeading: ss.labelledByHeading }; all = all && st.sibHeading === 0 && ss.notes === 0 && ss.sibTags === 0 && st.sib.length === 0 && ss.labelledByHeading === 0 && (q !== "當舖" || Object.keys(st.tags).length > 0); } finally { await close(p); } }
  { const r = await q116Show(ctx, u, 390, 844); d.五 = r.detail; all = all && r.ok; }
  // 六（v1_10，E91）：得分列恰 30 筆且有補列；先列 30 列均為得分列、無 sibling_heading；按下後新列出之第一個元素為 sibling_heading，焦點在該 h3
  { const q = "企業顧問 修理", x = CAND[q], p = await ctx.page(u.tool, 1366, 768);
    try {
      await query(p, q); const s0 = await resState(p); const bt = await p.$("#showAll"); const btText = bt ? await bt.textContent() : null; await showAll(p); const s1 = await resState(p); const ss = await sibState(p);
      const g = x.scored_count === 30 && x.siblings.length > 0 && s0.rows.length === 30 && s0.sib.length === 0 && s0.sibHeading === 0 && same(s0.rows, x.rows)
        && btText === A.show_all_btn_sib.replace("N", String(x.count)) && sectionOk(ss)
        && same(s1.rows, x.rows) && same(s1.sib, x.siblings) && s1.sibHeading === 1 && s1.sibHeadingBeforeFirstSib === true && ss.tag === "H3" && ss.prevCode === x.rows[x.rows.length - 1] && ss.active;
      d.六 = { input: q, expectScored: x.scored_count, expectSiblings: x.siblings, button: btText, expectButton: A.show_all_btn_sib.replace("N", String(x.count)), before: { rows: s0.rows.length, sib: s0.sib.length, sibHeading: s0.sibHeading }, after: { rows: s1.rows.length, sib: s1.sib, sibHeading: s1.sibHeading, adjacent: s1.sibHeadingBeforeFirstSib, sibState: ss }, activeAfterShowAll: ss.activeDesc, headingFocused: ss.active };
      all = all && g;
    } finally { await close(p); } }
  // 七（v1_11，c12 第三題）：無補列者按鈕用 show_all_btn；頁面無 aria-labelledby 指向 sibling_heading 之元素
  { const q = "製造", x = CAND[q], p = await ctx.page(u.tool, 1366, 768);
    try {
      await query(p, q); const bt = await p.$("#showAll"); const btText = bt ? await bt.textContent() : null; await showAll(p); const st = await resState(p); const ss = await sibState(p);
      const g = x.siblings.length === 0 && x.count > 30 && btText === A.show_all_btn.replace("N", String(x.count)) && st.sib.length === 0 && st.sibHeading === 0 && ss.labelledByHeading === 0;
      d.七 = { input: q, expectCount: x.count, expectSiblings: x.siblings.length, button: btText, expectButton: A.show_all_btn.replace("N", String(x.count)), sibHeading: st.sibHeading, labelledByHeading: ss.labelledByHeading };
      all = all && g;
    } finally { await close(p); } }
  return ok(all, d);
};
R.Q117 = async (ctx, u) => {
  const d = {};
  const p = await ctx.page(u.tool);
  try {
    await query(p, "室內設計");
    d.一 = await p.evaluate(([re, cn, oh]) => {
      const rx = new RegExp(re); const hs = [...document.querySelectorAll("h2")].filter(h => rx.test(h.innerText.trim()));
      const h = hs[0]; const res = document.querySelector("#results"); const all = [...document.querySelectorAll("body *")];
      const notice = all.find(e => e.textContent === cn && !e.children.length); const old = all.find(e => e.textContent === oh && !e.children.length);
      const bf = (x, y) => !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { h2: hs.length, text: h && h.innerText.trim(), active: !!h && document.activeElement === h, labelled: !!h && !!h.id && res.getAttribute("aria-labelledby") === h.id,
        aboveNotice: bf(h, notice), belowOld: !old || bf(old, h), cardTitles: [...res.querySelectorAll(".cand")].map(c => (c.querySelector(".cand-head") || {}).tagName) };
    }, ["^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$", A.candidate_notice, A.old_text_hint]);
    for (const [k, q, t] of [["二", "qwerty火星挖礦", A.no_result], ["三", "G606011", notFound("G606011")]]) {
      await query(p, q);
      d[k] = await p.evaluate(([re, t]) => { const rx = new RegExp(re); const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); return { heading: [...document.querySelectorAll("body *")].filter(h => rx.test((h.innerText || "").trim()) && !h.children.length).length, role: e && e.getAttribute("role"), active: !!e && document.activeElement === e }; }, ["^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$", t]);
    }
    // 四（v1_9）：部分查無時焦點在 results_heading，不在 code_not_found
    await query(p, "E801060、G606011");
    d.四 = await p.evaluate(([re, nf]) => { const rx = new RegExp(re); const h = [...document.querySelectorAll("#results h2")].find(x => rx.test(x.innerText.trim())); const e = [...document.querySelectorAll("body *")].find(x => x.textContent === nf && !x.children.length); return { heading: !!h, active: !!h && document.activeElement === h, activeIsNotFound: !!e && document.activeElement === e }; }, ["^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$", notFound("G606011")]);
  } finally { await close(p); }
  const a = d.一;
  const g = a.h2 === 1 && a.text === heading(CAND["室內設計"].scored_count) && a.active && a.labelled && a.aboveNotice && a.belowOld && a.cardTitles.length > 0 && a.cardTitles.every(t => t === "H3")
    && ["二", "三"].every(k => d[k].heading === 0 && d[k].role === "status" && d[k].active) && d.四.heading && d.四.active && !d.四.activeIsNotFound;
  return ok(g, d);
};
R.Q118 = async (ctx, u) => {
  const d = {};
  const fresh = async () => { const p = await ctx.page(u.tool); await p.click("#biz"); return p; };
  const nCards = p => p.evaluate(() => document.querySelectorAll("#results .cand").length);
  let p = await fresh();
  try { await p.keyboard.type("咖啡廳"); await p.keyboard.press("Enter"); d.一 = { cards: await nCards(p), value: await p.inputValue("#biz") }; } finally { await close(p); }
  p = await fresh();
  try {
    await p.keyboard.type("咖啡廳"); await p.keyboard.press("Shift+Enter"); await p.keyboard.type("飲料");
    d.二 = { value: await p.inputValue("#biz"), cardsBefore: await nCards(p) };
    await p.keyboard.press("Enter"); await showAll(p); const st = await resState(p); d.二.rows = st.rows; d.二.sib = st.sib;
    d.二.match = same(st.rows, CAND["咖啡廳 飲料"].rows) && same(st.sib, CAND["咖啡廳 飲料"].siblings);
  } finally { await close(p); }
  p = await fresh();
  try { await p.keyboard.type("咖啡廳"); await p.keyboard.press("Control+Enter"); d.三 = { cards: await nCards(p) }; } finally { await close(p); }
  p = await fresh();
  try {
    await p.keyboard.type("咖啡廳");
    d.四 = await p.evaluate(() => { const ta = document.querySelector("#biz"); const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", isComposing: true, bubbles: true, cancelable: true }); ta.dispatchEvent(ev); return { cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent }; });
    d.五 = await p.evaluate(() => document.querySelector("#biz").getAttribute("enterkeyhint"));
  } finally { await close(p); }
  // 六（v1_9）：Shift＋Ctrl＋Enter 送出
  p = await fresh();
  try { await p.keyboard.type("咖啡廳"); await p.keyboard.press("Shift+Control+Enter"); d.六 = { cards: await nCards(p), value: await p.inputValue("#biz") }; } finally { await close(p); }
  // 七（v1_9）：keyCode 229 而 isComposing 為假之 Enter 不送出
  p = await fresh();
  try {
    await p.keyboard.type("咖啡廳");
    d.七 = await p.evaluate(() => { const ta = document.querySelector("#biz"); const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 229, isComposing: false, bubbles: true, cancelable: true }); ta.dispatchEvent(ev); return { keyCode: ev.keyCode, isComposing: ev.isComposing, cards: document.querySelectorAll("#results .cand").length }; });
  } finally { await close(p); }
  // 八、九（v1_9；判定方式十八）：派發 compositionend 後 50 毫秒、300 毫秒再派發 Enter keydown（isComposing 為假）
  for (const [k, ms] of [["八", 50], ["九", 300]]) {
    p = await fresh();
    try {
      await p.keyboard.type("咖啡廳");
      d[k] = await p.evaluate(async ms => {
        const ta = document.querySelector("#biz");
        ta.dispatchEvent(new CompositionEvent("compositionend", { data: "廳", bubbles: true }));
        const t0 = performance.now(); await new Promise(r => setTimeout(r, ms));
        const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", isComposing: false, bubbles: true, cancelable: true }); const dt = performance.now() - t0; ta.dispatchEvent(ev);
        return { delayMs: Math.round(dt), cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent.length };
      }, ms);
    } finally { await close(p); }
  }
  // 十（v1_11，記錄現況）：於 compositionend 之事件處理程序同一工作內派發 Enter keydown（isComposing 為假）；不執行查詢
  p = await fresh();
  try {
    await p.keyboard.type("咖啡廳");
    d.十 = await p.evaluate(() => {
      const ta = document.querySelector("#biz"); let fired = false;
      ta.addEventListener("compositionend", () => { fired = true; ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", isComposing: false, bubbles: true, cancelable: true })); }, { once: true });
      ta.dispatchEvent(new CompositionEvent("compositionend", { data: "廳", bubbles: true }));
      return { fired, cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent.length };
    });
  } finally { await close(p); }
  const g = d.一.cards > 0 && !d.一.value.includes("\n") && d.二.value === "咖啡廳\n飲料" && d.二.cardsBefore === 0 && d.二.match && d.三.cards > 0 && d.四.cards === 0 && d.四.res === "" && d.五 === "search"
    && d.六.cards > 0 && d.七.keyCode === 229 && !d.七.isComposing && d.七.cards === 0 && d.八.delayMs < 100 && d.八.cards === 0 && d.八.res === 0 && d.九.delayMs >= 100 && d.九.cards > 0 && d.十.fired && d.十.cards === 0 && d.十.res === 0;
  return ok(g, d);
};
/* Q119（v1_14 改寫，c15 第一題；原「必填提示位置與改選組織型態」）：視窗 1366×768、390×844、844×390、390×180 各一次，輸入「咖啡廳」，
 * 點擊查詢鈕與於業務描述欄按 Enter 各送出一次；各次產生候選、得分列等於〔抽：candidates[咖啡廳].rows〕、焦點在 results_heading、innerText 不含 org_required_old */
async function q119At(ctx, u, w, h, byEnter) {
  const p = await ctx.page(u.tool, w, h);
  try {
    await p.fill("#biz", "咖啡廳");
    if (byEnter) { await p.focus("#biz"); await p.keyboard.press("Enter"); await p.waitForTimeout(50); } else await p.click("#searchBtn");
    const st = await resState(p);
    const d = { w, h, submit: byEnter ? "業務描述欄內按 Enter" : "點擊查詢鈕", rows: st.rows, headingActive: await headingActive(p), orgRequired: (await bodyText(p)).includes(A.org_required_old) };
    return { ok: st.rows.length > 0 && same(st.rows, CAND["咖啡廳"].rows) && d.headingActive && !d.orgRequired, detail: d };
  } finally { await close(p); }
}
R.Q119 = async (ctx, u) => {
  const d = []; let all = true;
  for (const [w, h] of [[1366, 768], [390, 844], [844, 390], [390, 180]]) for (const byEnter of [false, true]) { const r = await q119At(ctx, u, w, h, byEnter); d.push(r.detail); all = all && r.ok; }
  return ok(all, d);
};
/* 指定字樣之元素（葉）是否位於另一字樣之元素（葉）之前（DOM 與縱座標） */
const beforeText = (p, a, b) => p.evaluate(([a, b]) => { const all = [...document.querySelectorAll("body *")]; const f = t => all.find(e => e.textContent === t && !e.children.length); const x = f(a), y = f(b); return !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top; }, [a, b]);
const staleRole = p => p.evaluate(t => { const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); return e ? e.getAttribute("role") : null; }, A.stale_hint);
R.Q120 = async (ctx, u) => {
  const d = {};
  let p = await ctx.page(u.tool);
  try {
    await query(p, "室內設計"); d.一 = (await resState(p)).stale;
    await p.fill("#biz", "室內設計 咖啡廳"); d.二 = { n: (await resState(p)).stale, above: await before(p, A.stale_hint, true), role: await staleRole(p) };
    await p.fill("#biz", "室內設計"); d.三 = (await resState(p)).stale;
    await p.fill("#biz", "室內設計 咖啡廳"); await p.click("#searchBtn"); d.四 = (await resState(p)).stale; // v1_14：無組織型態，刪改選組織型態之一步
  } finally { await close(p); }
  // 六、七（v1_9）：stale_hint 位於第一個 code_not_found 之上；位於 no_result 之上
  p = await ctx.page(u.tool);
  try {
    await query(p, "G606011 G901011"); await p.fill("#biz", "G606011 G901011 改");
    d.六 = { n: (await resState(p)).stale, aboveFirstNotFound: await beforeText(p, A.stale_hint, notFound("G606011")), role: await staleRole(p) };
    await query(p, "qwerty火星挖礦"); await p.fill("#biz", "qwerty火星挖礦 改");
    d.七 = { n: (await resState(p)).stale, aboveNoResult: await beforeText(p, A.stale_hint, A.no_result), role: await staleRole(p) };
  } finally { await close(p); }
  return ok(d.一 === 0 && d.二.n === 1 && d.二.above === true && d.二.role === "status" && d.三 === 0 && d.四 === 0
    && d.六.n === 1 && d.六.aboveFirstNotFound && d.六.role === "status" && d.七.n === 1 && d.七.aboveNoResult && d.七.role === "status", d);
};
/* Q121（v1_9，判定方式十三；F-G-09）：甲＝標籤上緣距視窗上緣 0 至 1 像素或已捲至最底；
 * 乙＝以標籤對齊時第一筆候選之名稱下緣會超出視窗，且 results_heading 之上緣距視窗上緣 0 至 1 像素（乙一），
 *     或（results_heading 對齊後第一筆候選仍不能完整可見時）第一筆候選完整可見且捲動量不大於使其可見所需（乙二，括號情形）。
 * v1_10（判定方式二十一）：「不大於使其可見所需」以「實際捲動量減最小所需在 0 至 1 像素」判定；最小所需＝第一筆候選之代碼與名稱下緣（頁面座標，取大者）減視窗高（小數，不進位）。
 * 長句 q20[3] 改於 390×600（須乙一）與 390×240（須乙二）；不再以 390×844 測長句 */
async function q121Measure(p) {
  await p.waitForTimeout(100);
  const s = await p.evaluate(re => {
    const rx = new RegExp(re);
    const lab = document.querySelector('label[for="biz"]'); const c = document.querySelector("#results .cand"); if (!c) return null;
    const hd = [...document.querySelectorAll("#results h2")].find(x => rx.test(x.innerText.trim()));
    const Y = window.scrollY, vh = window.innerHeight;
    const lr = lab.getBoundingClientRect(), nr = c.querySelector(".cand-name").getBoundingClientRect(), cr = c.querySelector(".cand-code").getBoundingClientRect(), hr = hd ? hd.getBoundingClientRect() : null;
    const atBottom = Y + vh >= document.documentElement.scrollHeight - 1;
    const firstBottomPage = Math.max(nr.bottom, cr.bottom) + Y, labelTopPage = lr.top + Y, headTopPage = hr ? hr.top + Y : null;
    const minNeed = firstBottomPage - vh; // 判定方式二十二（v1_11）：代碼與名稱兩者下緣之較大者減視窗高，小數不進位
    return { labelTop: lr.top, headingTop: hr ? hr.top : null, atBottom, span: firstBottomPage - labelTopPage, spanFromHeading: hr ? firstBottomPage - headTopPage : null, vh, scrollY: Y, minNeed, scrollMinusMinNeed: Y - minNeed };
  }, "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$");
  const f = await firstVisible(p);
  const jia = !!s && ((s.labelTop >= 0 && s.labelTop <= 1) || s.atBottom);
  const yiPremise = !!s && s.span > s.vh;
  const yi1 = !!s && s.headingTop !== null && s.headingTop >= 0 && s.headingTop <= 1;
  const yi2Premise = !!s && s.spanFromHeading !== null && s.spanFromHeading > s.vh;
  const yi2 = yi2Premise && f.ok && s.scrollMinusMinNeed >= 0 && s.scrollMinusMinNeed <= 1;
  const yi = yiPremise && (yi1 || yi2);
  return { s, firstVisible: f.ok, jia, yiPremise, yi1, yi2Premise, yi2, yi, branch: jia ? "甲" : yi ? (yi1 ? "乙（results_heading 對齊）" : "乙（括號情形）") : "無" };
}
R.Q121 = async (ctx, u) => {
  const d = []; let all = true;
  for (const [w, h, q, must] of [[1366, 768, "室內設計", null], [1024, 640, "室內設計", null], [390, 844, "室內設計", null], [390, 500, E.q20[3].input, "乙一"], [390, 240, E.q20[3].input, "乙二"]]) {
    const p = await ctx.page(u.tool, w, h);
    try {
      await query(p, q);
      const m = await q121Measure(p);
      let g = m.firstVisible && (m.jia || m.yi);
      if (must === "乙一") g = g && !m.jia && m.yiPremise && m.yi1;           // v1_10：390×500（v1_15 改，原 390×600；c15b 第一題）須乙款且 results_heading 距上緣 0 至 1 像素
      if (must === "乙二") g = g && !m.jia && m.yiPremise && m.yi2Premise && m.yi2; // v1_10：390×240 須乙款之括號情形（判定方式二十一）
      d.push({ w, h, input: q, mustBranch: must, ...m.s, firstVisible: m.firstVisible, 甲: m.jia, 乙之前提: m.yiPremise, 乙一: m.yi1, 括號情形之前提: m.yi2Premise, 乙二: m.yi2, 走哪一款: m.branch, ok: g }); all = all && g;
    } finally { await close(p); }
  }
  return ok(all, { rows: d });
};
R.Q122 = async (ctx, u) => {
  const p = await ctx.page(u.tool, 1366, 768);
  try {
    await query(p, "當舖");
    // c20：顯名（含授權條款連結）移入頁尾收合列（規格 v1_22 拘29），收合時其 innerText 為空；畫面文字於展開頁尾收合列後讀取（不點擊；固定段乙）
    await p.evaluate(bt => { const sm = [...document.querySelectorAll("details > summary")].find(e => e.textContent.trim() === bt); if (sm) sm.parentElement.open = true; }, A.shell_basis_title);
    const s = await p.evaluate(([pl, sig, lic]) => {
      const a = [...document.querySelectorAll("a")]; const f = pred => a.filter(pred).map(x => ({ aria: x.getAttribute("aria-label"), target: x.getAttribute("target"), text: x.innerText.trim() }));
      return { permit: f(x => x.innerText.trim() === pl), sig: f(x => x.innerText.trim() === sig), lic: f(x => x.getAttribute("href") === lic) };
    }, [A.permit_link, A.signature, LICENSE]);
    const b = await bookingState(p);
    const one = (arr, text) => arr.length === 1 && arr[0].aria === text + A.new_window_suffix && arr[0].target === "_blank";
    return ok(one(s.permit, A.permit_link) && s.permit[0].text === A.permit_link && one(s.sig, A.signature) && s.sig[0].text === A.signature && one(s.lic, LICENSE) && s.lic[0].text === LICENSE && bookingOk(b), { ...s, booking: b });
  } finally { await close(p); }
};
R.Q123 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { await p.evaluate(bt => { const sm = [...document.querySelectorAll("details > summary")].find(e => e.textContent.trim() === bt); if (sm) sm.parentElement.open = true; }, A.shell_basis_title); // v1_19（c20）：展開頁尾收合列後取
    const s = await attribState(p); const t = await p.evaluate(att => { const e = [...document.querySelectorAll("body *")].find(x => x.innerText === att && ![...x.children].some(c => c.innerText === att)); return e ? e.innerText : null; }, A.attribution);
    return ok(E.appendix_a_halfwidth_issues.length === 0 && s.n === 1 && t === A.attribution && !/license ）/.test(t), { halfwidthIssues: E.appendix_a_halfwidth_issues, attributionFound: s.n, innerTextEquals: t === A.attribution }); } finally { await close(p); }
};
R.Q124 = async (ctx, u) => {
  const d = {}; let all = true; const x = CAND["咖啡廳.蛋糕"];
  for (const q of ["咖啡廳.蛋糕", "咖啡廳．蛋糕"]) { const p = await ctx.page(u.tool); try { await query(p, q); await showAll(p); const st = await resState(p); d[q] = { rows: st.rows, sib: st.sib }; all = all && same(st.rows, x.rows) && same(st.sib, x.siblings) && st.rows.includes("C104020"); } finally { await close(p); } }
  return ok(all, d);
};
R.Q125 = async (ctx, u, env) => {
  // 驗證表 v1_9 Q125：「不繪出」＝元素本身或其任一祖先之 computed display 為 none（以外層容器隱藏亦符合）；v1_21（c21）：顯名必繪出，見下方判定方式三十四
  const read = p => p.evaluate(([book, att, disc, sig, vaUrl]) => {
    const disp = e => e ? getComputedStyle(e).display : null;
    const hid = e => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) if (getComputedStyle(x).display === "none") return "none"; return e ? "shown" : null; };
    // c20b（驗證表 v1_20 判定方式三十三之三）：「繪出」＝checkVisibility() 為真；「不繪出」＝本身或任一祖先之 computed display 為 none，或 checkVisibility() 為假
    const draw = e => e ? ((hid(e) === "none" || !e.checkVisibility()) ? "none" : "shown") : null;
    const raw = e => e ? { display: hid(e), checkVisibility: e.checkVisibility() } : null;
    const all = [...document.querySelectorAll("body *")];
    const leaf = t => all.find(e => (e.innerText || e.textContent || "").trim() === t && ![...e.children].some(c => (c.textContent || "").trim() === t));
    return {
      textarea: draw(document.querySelector("#biz")),
      searchBtn: draw(document.querySelector("#searchBtn")),
      booking: draw([...document.querySelectorAll("a")].find(a => a.getAttribute("aria-label") && a.getAttribute("aria-label").startsWith(book))),
      viewAll: draw([...document.querySelectorAll("a")].find(a => a.getAttribute("href") === vaUrl)), // v1_18（規格 v1_21 第十一節之 4）
      原始值: { textarea: raw(document.querySelector("#biz")), searchBtn: raw(document.querySelector("#searchBtn")), booking: raw([...document.querySelectorAll("a")].find(a => a.getAttribute("aria-label") && a.getAttribute("aria-label").startsWith(book))), viewAll: raw([...document.querySelectorAll("a")].find(a => a.getAttribute("href") === vaUrl)) },
      cards: [...document.querySelectorAll("#results .cand")].map(disp),
      attribution: (() => { const e = all.find(e => e.textContent.replace(/\s+/g, "") === att.replace(/\s+/g, "") && ![...e.children].some(c => c.textContent.replace(/\s+/g, "") === att.replace(/\s+/g, ""))); if (!e) return null;
        // v1_19（c20）：顯名隨頁尾收合列之狀態：記所在 details 之 open、是否繪出（getClientRects 有面積者）與自身或祖先之 display
        // 繪出＝checkVisibility() 為真（收合之 details 內容為 content-visibility:hidden，getClientRects 仍有面積，不能據以判定），另記 innerText 長度
        const det = e.closest("details"); const rs = [...e.getClientRects()].filter(r => r.width > 0 && r.height > 0); return { detailsOpen: det ? det.open : null, rendered: e.checkVisibility(), clientRects: rs.length, innerTextLength: (e.innerText || "").length, display: hid(e) }; })(),
      disclaimer: disp(leaf(disc)), signature: disp([...document.querySelectorAll("a")].find(a => a.textContent.trim() === sig)),
    };
  }, [A.booking, A.attribution, A.disclaimer, A.signature, A.view_all_url]);
  const d = {};
  // v1_21（c21；規格 v1_23 拘29、第十一節；判定方式三十四）：顯名必繪出。查「室內設計」後，收合與已展開兩種起始狀態各以兩法判一次：
  //   法一：page.pdf() 產生 PDF（實測 page.pdf() 是否觸發 beforeprint、afterprint；不觸發者以 dispatchEvent 補觸發並註明），以 pdftotext 抽文字判含〔抽：attribution〕全文（空白與換行差異不計）；
  //   法二：dispatchEvent beforeprint 後 emulate print，判顯名 checkVisibility() 為真，再 dispatchEvent afterprint，判 open 回復列印前之值。
  //   起始狀態之展開以設定 details.open 為之（不點擊；固定段乙）。
  const setOpen = (p, v) => p.evaluate(v => { const d = document.querySelector("details.basis"); if (d) d.open = v; }, v);
  const getOpen = p => p.evaluate(() => { const d = document.querySelector("details.basis"); return d ? d.open : null; });
  const norm = t => String(t || "").replace(/\s+/g, "");
  // c22（驗證表 v1_22；判定方式三十五）：
  //   一之法一：列印事件以頁面腳本執行前註冊之獨立監聽器（PRINT_INIT，window capture 階段；isTrusted 為真者為原生事件）計數認定，不以收合列之展開認定；分記原生事件是否觸發、
  //     原生 PDF 是否含顯名、是否以 dispatchEvent 補觸發、補觸發後 PDF 是否含顯名；原生事件未觸發者法一記未執行（ok 為 null），Q125 不判通過（補觸發之 PDF 不計原生路徑之通過）。
  //   （甲）法三：頁面腳本執行前以 capture 階段監聽器對 beforeprint 呼叫 stopImmediatePropagation；起始收合，page.pdf() 之 PDF 含顯名；另頁同樣攔下，emulate print（不派送事件）
  //     顯名 checkVisibility() 為真，回螢幕媒體為假、open 為假。（乙）（丙）以 window.dispatchEvent 派送 beforeprint、afterprint、pageshow；展開收合列以設 details.basis 之 open 為真為之。
  //   （丁）一及（甲）至（丙）各情境結束時 localStorage、sessionStorage 之長度 0、document.cookie 空字串、indexedDB.databases() 空陣列。每一情境以新載入之頁面起始。
  const evs = p => p.evaluate(() => (window.__pev || []).slice());
  const nat = (ev, t) => ev.filter(x => x.type === t && x.isTrusted).length;
  const disp = (p, t) => p.evaluate(t => window.dispatchEvent(t === "pageshow" ? new PageTransitionEvent("pageshow", { persisted: false }) : new Event(t)), t);
  const attrVis = p => p.evaluate(att => { const n = x => x.replace(/\s+/g, ""); const e = [...document.querySelectorAll("body *")].find(e => n(e.textContent) === n(att) && ![...e.children].some(c => n(c.textContent) === n(att))); return e ? e.checkVisibility() : null; }, A.attribution);
  const store = p => p.evaluate(async () => { let idb; try { idb = (await indexedDB.databases()).map(x => x.name); } catch (e) { idb = "例外：" + e.message; }
    const r = { localStorage長度: localStorage.length, sessionStorage長度: sessionStorage.length, cookie: document.cookie, indexedDB: idb };
    r.ok = r.localStorage長度 === 0 && r.sessionStorage長度 === 0 && r.cookie === "" && Array.isArray(idb) && idb.length === 0; return r; });
  const pdfText = async buf => { const f = path.join(TMP, "q125_" + Date.now() + "_" + Math.random().toString(36).slice(2) + ".pdf"); fs.writeFileSync(f, buf);
    const txt = execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"], { encoding: "utf8", maxBuffer: 1 << 26 }); const i = norm(txt).indexOf(norm(A.attribution));
    return { pdf位元組數: buf.length, 含顯名全文: i >= 0, 抽出之顯名文字: i >= 0 ? norm(txt).slice(i, i + norm(A.attribution).length) : null }; };
  d.一 = {}; d.丁 = {};
  for (const [lab, open0] of [["收合", false], ["已展開", true]]) {
    // 法二
    let p = await ctx.page(u.tool);
    try { await query(p, "室內設計"); await setOpen(p, open0); const before = await getOpen(p);
      await p.evaluate(() => window.dispatchEvent(new Event("beforeprint"))); const bpOpen = await getOpen(p); await p.emulateMedia({ media: "print" }); // c22b（判定方式三十六）：派送 beforeprint 後、emulate print media 前讀 open
      const r = await read(p); const during = await getOpen(p);
      await p.evaluate(() => window.dispatchEvent(new Event("afterprint"))); await p.emulateMedia({ media: "screen" });
      const after = await getOpen(p); const 丁 = await store(p);
      d.一[lab + "_法二"] = { 列印前open: before, beforeprint後_emulate前open: bpOpen, 判定方式三十六: bpOpen === true, 列印時open: during, 列印後open: after, 列印時: r, 顯名checkVisibility: r.attribution ? r.attribution.rendered : null, ok: before === open0 && bpOpen === true && !!r.attribution && r.attribution.rendered === true && after === open0 };
      d.丁["一_" + lab + "_法二"] = 丁;
    } finally { await close(p); }
    // 法一（判定方式三十四之一、三十五之一）
    p = await ctx.page(u.tool, 1366, 768, [PRINT_INIT, { stop: false }]);
    try { await query(p, "室內設計"); await setOpen(p, open0); const before = await getOpen(p); const ev0 = await evs(p);
      const buf = await p.pdf({ printBackground: true }); const ev1 = await evs(p);
      const nb = nat(ev1, "beforeprint") - nat(ev0, "beforeprint"), na = nat(ev1, "afterprint") - nat(ev0, "afterprint");
      const fired = nb > 0 && na > 0; const natPdf = await pdfText(buf);
      let dispatched = false, dispPdf = null;
      if (!fired) { // 判定方式三十五之一：補觸發只證明處理程序之效果，不計原生路徑之通過
        dispatched = true; await disp(p, "beforeprint"); dispPdf = await pdfText(await p.pdf({ printBackground: true })); await disp(p, "afterprint"); }
      const after = await getOpen(p); const ev = await evs(p); const 丁 = await store(p);
      d.一[lab + "_法一"] = { 列印前open: before, 列印後open: after, 原生事件是否觸發: fired, 原生beforeprint次數: nb, 原生afterprint次數: na, 獨立監聽器紀錄: ev,
        原生PDF是否含顯名: natPdf.含顯名全文, 原生PDF: natPdf, 是否以dispatchEvent補觸發: dispatched, 補觸發後PDF是否含顯名: dispPdf ? dispPdf.含顯名全文 : null, 補觸發PDF: dispPdf,
        pdf文字含顯名全文: natPdf.含顯名全文, pdf抽出之顯名文字: natPdf.抽出之顯名文字, 認定方法: "頁面腳本執行前以 addInitScript 註冊之 window capture 階段監聽器計數 isTrusted 為真之 beforeprint、afterprint（判定方式三十五之一）",
        ok: !fired ? null : (before === open0 && natPdf.含顯名全文 && after === open0) };
      d.丁["一_" + lab + "_法一"] = 丁;
    } finally { await close(p); }
  }
  // （甲）列印事件不觸發時之備援（判定方式三十五之二，法三）
  d.甲 = {};
  let p = await ctx.page(u.tool, 1366, 768, [PRINT_INIT, { stop: true }]);
  try { await query(p, "室內設計"); await setOpen(p, false); const before = await getOpen(p);
    const pdf = await pdfText(await p.pdf({ printBackground: true })); const ev = await evs(p); const after = await getOpen(p); const 丁 = await store(p);
    d.甲.PDF = { 列印前open: before, 列印後open_記錄: after, 獨立監聽器紀錄: ev, beforeprint已攔下: ev.filter(x => x.type === "beforeprint").every(x => x.stopped), PDF: pdf, ok: before === false && pdf.含顯名全文 };
    d.丁.甲_PDF = 丁;
  } finally { await close(p); }
  p = await ctx.page(u.tool, 1366, 768, [PRINT_INIT, { stop: true }]);
  try { await query(p, "室內設計"); await setOpen(p, false); const before = await getOpen(p);
    await p.emulateMedia({ media: "print" }); const cvP = await attrVis(p); const openP = await getOpen(p);
    await p.emulateMedia({ media: "screen" }); const cvS = await attrVis(p); const openS = await getOpen(p); const ev = await evs(p); const 丁 = await store(p);
    d.甲.列印媒體 = { 列印前open: before, 列印媒體下checkVisibility: cvP, 列印媒體下open: openP, 回螢幕媒體後checkVisibility: cvS, 回螢幕媒體後open: openS, 事件紀錄_應為空: ev,
      ok: before === false && cvP === true && cvS === false && openS === false };
    d.丁.甲_列印媒體 = 丁;
  } finally { await close(p); }
  // （乙）連續列印（判定方式三十五之三）
  d.乙 = {};
  p = await ctx.page(u.tool, 1366, 768, [PRINT_INIT, { stop: false }]);
  try { await query(p, "室內設計"); await setOpen(p, false); const before = await getOpen(p);
    await disp(p, "beforeprint"); const o1 = await getOpen(p); await disp(p, "beforeprint"); const o2 = await getOpen(p); await disp(p, "afterprint"); const after = await getOpen(p); const 丁 = await store(p);
    d.乙.兩次beforeprint一次afterprint = { 列印前open: before, 第一次beforeprint後open: o1, 第二次beforeprint後open: o2, 列印後open: after, ok: before === false && after === false };
    d.丁.乙_兩次beforeprint = 丁;
  } finally { await close(p); }
  p = await ctx.page(u.tool, 1366, 768, [PRINT_INIT, { stop: false }]);
  try { await query(p, "室內設計"); await setOpen(p, false); const before = await getOpen(p);
    await disp(p, "beforeprint"); await disp(p, "afterprint"); const o1 = await getOpen(p); await setOpen(p, true); const o2 = await getOpen(p);
    await disp(p, "beforeprint"); const during = await getOpen(p); await disp(p, "afterprint"); const after = await getOpen(p); const 丁 = await store(p);
    d.乙.列印後展開再列印 = { 列印前open: before, 第一次列印後open: o1, 展開後open: o2, 第二次列印時open: during, 第二次列印後open: after, ok: before === false && after === true };
    d.丁.乙_列印後展開再列印 = 丁;
  } finally { await close(p); }
  // （丙）afterprint 未派送（判定方式三十五之三）
  p = await ctx.page(u.tool, 1366, 768, [PRINT_INIT, { stop: false }]);
  try { await query(p, "室內設計"); await setOpen(p, false); const before = await getOpen(p);
    await disp(p, "beforeprint"); const o1 = await getOpen(p); await disp(p, "pageshow"); const o2 = await getOpen(p); await setOpen(p, true); const o3 = await getOpen(p);
    await disp(p, "beforeprint"); const during = await getOpen(p); await disp(p, "afterprint"); const after = await getOpen(p); const 丁 = await store(p);
    d.丙 = { 列印前open: before, beforeprint後open: o1, pageshow後open: o2, 展開後open: o3, 再列印時open: during, 再列印後open: after, ok: before === false && after === true };
    d.丁.丙 = 丁;
  } finally { await close(p); }
  // 二（v1_9；v1_14 改寫）：只輸入不查詢
  p = await ctx.page(u.tool);
  try { await p.fill("#biz", "室內設計"); await p.emulateMedia({ media: "print" }); d.二 = await read(p); await p.emulateMedia({ media: "screen" }); } finally { await close(p); }
  // 三（v1_11，F-G-04）：讀頁面 CSS 原文，@media print 內隱藏查詢鈕與預約諮詢連結之規則，其選擇器清單不含「:has(」
  const css = [...env.src.tool.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join("\n");
  const printBlocks = []; { let i = 0; while ((i = css.indexOf("@media print{", i)) >= 0) { let dep = 0, j = i + "@media print".length; for (; j < css.length; j++) { if (css[j] === "{") dep++; else if (css[j] === "}") { dep--; if (dep === 0) break; } } printBlocks.push(css.slice(i + "@media print{".length, j)); i = j; } }
  const rules = printBlocks.flatMap(b => [...b.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), decl: m[2] }))).filter(x => /display\s*:\s*none/.test(x.decl));
  p = await ctx.page(u.tool);
  try {
    d.三 = await p.evaluate(([rules, book, vaUrl]) => {
      const btn = document.querySelector("#searchBtn"), bk = [...document.querySelectorAll("a")].find(a => a.getAttribute("aria-label") && a.getAttribute("aria-label").startsWith(book));
      const hits = e => rules.filter(x => { for (let y = e; y && y.nodeType === 1; y = y.parentElement) { try { if (y.matches(x.sel)) return true; } catch (er) { } } return false; }).map(x => x.sel);
      const va = [...document.querySelectorAll("a")].find(a => a.getAttribute("href") === vaUrl);
      return { rulesWithDisplayNone: rules.map(x => x.sel), searchBtnRules: hits(btn), bookingRules: hits(bk), viewAllRules_記錄: va ? hits(va) : null };
    }, [rules, A.booking, A.view_all_url]);
  } finally { await close(p); }
  d.三.printBlocks = printBlocks.length;
  const t3 = d.三.searchBtnRules.length > 0 && d.三.bookingRules.length > 0 && d.三.searchBtnRules.concat(d.三.bookingRules).every(x => !x.includes(":has("));
  d.三.ok = t3;
  // 一之元素判定以收合起始、法二之列印時狀態（beforeprint 後、列印媒體）讀取；顯名必繪出依判定方式三十四：兩種起始狀態、兩法均符
  const s = d.一.收合_法二.列印時;
  d.顯名必繪出 = Object.fromEntries(Object.entries(d.一).map(([k, v]) => [k, v.ok]));
  d.判定方式三十六 = Object.fromEntries(Object.entries(d.一).filter(([k]) => k.endsWith("_法二")).map(([k, v]) => [k, { beforeprint後_emulate前open: v.beforeprint後_emulate前open, ok: v.判定方式三十六 }])); // c22b（驗證表 v1_23）
  d.甲至丁 = { 甲_PDF: d.甲.PDF.ok, 甲_列印媒體: d.甲.列印媒體.ok, 乙_兩次beforeprint一次afterprint: d.乙.兩次beforeprint一次afterprint.ok, 乙_列印後展開再列印: d.乙.列印後展開再列印.ok, 丙: d.丙.ok,
    丁: Object.fromEntries(Object.entries(d.丁).map(([k, v]) => [k, v.ok])) };
  const v22 = d.甲.PDF.ok && d.甲.列印媒體.ok && d.乙.兩次beforeprint一次afterprint.ok && d.乙.列印後展開再列印.ok && d.丙.ok && Object.values(d.丁).every(x => x.ok);
  const notNative = Object.entries(d.一).filter(([k, v]) => k.endsWith("_法一") && v.ok === null).map(([k]) => k); // 判定方式三十五之一：原生事件未觸發者法一記未執行
  d.法一未執行 = notNative;
  const g = t3
    && s.searchBtn === "none" && s.booking === "none" && s.viewAll === "none"
    && s.cards.length > 0 && s.cards.every(x => x !== "none") && Object.values(d.顯名必繪出).every(x => x !== false) && s.disclaimer && s.disclaimer !== "none" && s.signature && s.signature !== "none"
    && d.二.textarea === "shown" && d.二.searchBtn === "none" && d.二.booking === "none" // v1_14：刪組織型態之列印
    && v22;
  if (g && notNative.length) return { ok: null, detail: { ...d, 未執行之理由: "判定方式三十五之一：" + notNative.join("、") + " 之原生列印事件未觸發，法一記未執行，Q125 不判通過" } };
  return ok(g, d);
};
/* Q128（v1_8 新增；v1_9 改；v1_17：ext_c18，217 句）：〔抽：all_inputs〕之每一輸入逐句與 candidates、tag_text 一致；全部列逐列比對，並比 results_heading 之 N；mode 為 empty 者依 Q130 */
const headingN = p => p.evaluate(re => { const rx = new RegExp(re); const h = [...document.querySelectorAll("body *")].filter(e => rx.test((e.innerText || "").trim()) && ![...e.children].some(c => rx.test((c.innerText || "").trim()))); return h.map(e => Number(e.innerText.trim().match(rx)[1])); },
  "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "(\\d+)") + "$");
R.Q128 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const mism = [], zoneMism = []; let n = 0;
  try {
    for (const q of E.all_inputs) {
      await query(p, q); await showAll(p); const st = await resState(p); const c = CAND[q]; n++;
      const tg = tagsOf(q), hn = await headingN(p);
      let rowsOk, tagsOk, missOk, nOk;
      if (c.mode === "empty") { // 依 Q130：不產生候選、不顯示 results_heading 與 no_result，顯示 input_required
        rowsOk = st.rows.length === 0 && st.sib.length === 0; tagsOk = Object.keys(st.tags).length === 0; missOk = st.missing.length === 0; nOk = hn.length === 0 && st.noResult === 0 && st.inputRequired === 1;
      } else {
        rowsOk = same(st.rows, c.rows) && same(st.sib, c.siblings);
        tagsOk = setEq(Object.keys(st.tags), Object.keys(tg)) && Object.keys(tg).every(k => st.tags[k] === tg[k]);
        missOk = same(st.missing, c.missing);
        nOk = c.rows.length ? same(hn, [c.scored_count]) : hn.length === 0;
      }
      // 派工另要求 zone_hint 逐句一致：驗證表 Q128 之應得輸出未列 zone_hint，故只記錄、不入本列判定（zone_hint 之判定在 Q132、Q134）；v1_13：all_inputs 計 171 句；v1_15：187 句
      if ((st.zoneHint === 1) !== !!c.zone_hint || st.zoneHint > 1) zoneMism.push({ input: q, page: st.zoneHint, expect: !!c.zone_hint });
      if (!(rowsOk && tagsOk && missOk && nOk)) mism.push({ input: q, mode: c.mode, rowsOk, tagsOk, missOk, nOk, got: { rows: st.rows, sib: st.sib, tags: st.tags, missing: st.missing, headingN: hn }, expect: { rows: c.rows, siblings: c.siblings, tags: tg, missing: c.missing, scored_count: c.scored_count } });
    }
  } finally { await close(p); }
  return ok(n === E.all_inputs.length && E.all_inputs.length === 217 && mism.length === 0, { inputs: n, expectInputs: E.all_inputs.length, emptyInputs: E.all_inputs.filter(q => CAND[q].mode === "empty").length, over40: E.all_inputs.filter(q => !CAND[q].rows).length, mismatches: mism, zoneHintSupplement: { expectTrue: E.all_inputs.filter(q => CAND[q].zone_hint).length, mismatches: zoneMism } });
};
/* Q129（v1_8 新增；判定方式十九，使用者 115/10/18 裁定甲）：:root 之 --serif、--sans 宣告值逐字等於 css_font_serif、css_font_sans，
 * 且 h1、body 之 computed font-family 除引號外相等（另記結果標題與代碼之 computed 值）；原始碼不含 @font-face、@import 與外部字型網址（同 Q108） */
R.Q129 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    const read = () => p.evaluate(() => {
      const ff = e => e ? getComputedStyle(e).fontFamily : null;
      const rs = getComputedStyle(document.documentElement);
      return { h1: ff(document.querySelector("h1")), body: ff(document.body), resultsHeading: ff(document.querySelector("#results h2")), code: ff(document.querySelector("#results .cand-code")), declSerif: rs.getPropertyValue("--serif").trim(), declSans: rs.getPropertyValue("--sans").trim() };
    });
    const s0 = await read(); await query(p, "室內設計"); const s1 = await read();
    const unq = x => x === null ? null : x.replace(/,\s+/g, ",").replace(/"/g, "");
    const declared = s0.declSerif === A.css_font_serif && s0.declSans === A.css_font_sans;
    const unquoted = unq(s0.h1) === unq(A.css_font_serif) && unq(s0.body) === unq(A.css_font_sans);
    const others = { resultsHeading: unq(s1.resultsHeading) === unq(A.css_font_serif), code: unq(s1.code) === unq(A.css_font_serif) };
    const words = ["@font-face", "@import", "fonts.googleapis.com", "fonts.gstatic.com"].filter(w => env.src.tool.includes(w));
    return ok(declared && unquoted && words.length === 0, { expect: { serif: A.css_font_serif, sans: A.css_font_sans }, computed: { h1: s0.h1, body: s0.body, resultsHeading: s1.resultsHeading, code: s1.code }, declared: { serif: s0.declSerif, sans: s0.declSans }, declaredEqual: declared, equalIgnoringQuotes: unquoted, othersEqualIgnoringQuotes: others, srcWords: words });
  } finally { await close(p); }
};
/* Q130（v1_9 新增）：空白輸入 */
R.Q130 = async (ctx, u) => {
  const ins = E.all_inputs.filter(q => CAND[q].mode === "empty");
  const d = []; let all = true;
  for (const q of ins) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q);
      const st = await resState(p); const hn = await headingN(p);
      const s = await p.evaluate(ir => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; };
        const all = [...document.querySelectorAll("body *")]; const els = all.filter(e => e.textContent === ir && !e.children.length && vis(e));
        const ta = document.querySelector("#biz"); const ids = (ta.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
        const e = els[0];
        return { n: els.length, role: e && e.getAttribute("role"), described: !!e && !!e.id && ids.includes(e.id), active: document.activeElement === ta };
      }, A.input_required);
      await p.keyboard.type("咖");
      const gone = await visibleTextCount(p, A.input_required);
      const g = st.rows.length === 0 && st.sib.length === 0 && hn.length === 0 && st.noResult === 0 && s.n === 1 && s.role === "alert" && s.described && s.active && gone === 0;
      d.push({ input: JSON.stringify(q), cards: st.rows.length + st.sib.length, heading: hn.length, noResult: st.noResult, ...s, afterTypingOneChar: gone }); all = all && g;
    } finally { await close(p); }
  }
  // v1_12（c13 第三題）：「℡」「㍿」NFKC 後為文字（mode text）：不顯示 input_required。
  // v1_14（c15 第一題）：刪組織型態之分述；顯示 no_result（得分 0 筆）
  const d2 = [];
  for (const q of ["℡", "㍿"]) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q); const st = await resState(p); const hn = await headingN(p);
      const g = CAND[q].mode === "text" && CAND[q].scored_count === 0 && st.inputRequired === 0 && st.rows.length === 0 && st.sib.length === 0 && hn.length === 0 && st.noResult === 1;
      d2.push({ input: q, extMode: CAND[q].mode, inputRequired: st.inputRequired, noResult: st.noResult, cards: st.rows.length + st.sib.length, ok: g }); all = all && g;
    } finally { await close(p); }
  }
  return ok(all && ins.length === 10, { empty: d, v1_12: d2 }); // v1_11：增「！」「？？」「…」「!?」「（）」，計 10 句
};
/* Q132（v1_9 新增；v1_17 改用獨立推導 c18，40 句）：頁面、ext_c18 之 candidates、獨立推導檔三方相同（mode、得分列與順序、標示與 phrase_tag 全文、補列、results_heading 之 N、zone_hint 之有無〔v1_12〕） */
R.Q132 = async (ctx, u) => {
  if (!INDEP_FILE) return { ok: null, detail: "未給 --indep（獨立推導檔之路徑），不能執行" };
  const buf = fs.readFileSync(INDEP_FILE);
  if (sha256(buf) !== SHA_INDEP) return { ok: false, detail: "獨立推導檔之 SHA-256 不符：" + sha256(buf) };
  const IND = JSON.parse(buf.toString("utf8"))["results"];
  const p = await ctx.page(u.tool); const d = []; let all = true;
  try {
    for (const q of E.q132_inputs) {
      await query(p, q); await showAll(p); const st = await resState(p); const hn = await headingN(p);
      const c = CAND[q], x = IND[q], tg = tagsOf(q);
      // v1_11：mode 一併比對；頁面之 mode 只就 empty 與否判（空白類之句以 Q130 之期望：input_required 恰一處、無候選、無 results_heading 與 no_result），N 於 empty 時記 0
      const pageEmpty = st.inputRequired === 1 && st.rows.length === 0 && st.sib.length === 0 && hn.length === 0 && st.noResult === 0;
      const page = { empty: pageEmpty, rows: st.rows, siblings: st.sib, tags: st.tags, N: hn.length === 1 ? hn[0] : (pageEmpty || (!st.rows.length && !st.sib.length) ? 0 : null), zone: st.zoneHint === 1 ? true : st.zoneHint === 0 ? false : null };
      const ext = { mode: c.mode, empty: c.mode === "empty", rows: c.rows, siblings: c.siblings, tags: tg, N: c.scored_count, zone: c.zone_hint };
      const ind = x ? { mode: x.mode, empty: x.mode === "empty", rows: x.rows, siblings: x.siblings, tags: x.tags, N: x.scored_count, zone: x.zone_hint } : null;
      // v1_12：zone_hint 之有無一併比對（頁面以 zone_hint 字樣之可見元素恰一處為有、零處為無）
      const eq = (a, b) => !!a && !!b && a.empty === b.empty && (a.mode === undefined || b.mode === undefined || a.mode === b.mode) && same(a.rows, b.rows) && same(a.siblings, b.siblings) && setEq(Object.keys(a.tags), Object.keys(b.tags)) && Object.keys(a.tags).every(k => a.tags[k] === b.tags[k]) && a.N === b.N && a.zone === b.zone;
      const r = { input: q, page_ext: eq(page, ext), page_indep: eq(page, ind), ext_indep: eq(ext, ind), mode: { ext: ext.mode, indep: ind && ind.mode, pageEmpty }, page: { rows: page.rows.length, siblings: page.siblings.length, tagged: Object.keys(page.tags), N: page.N, zone_hint: page.zone }, ext: { mode: ext.mode, rows: ext.rows.length, siblings: ext.siblings.length, N: ext.N, zone_hint: ext.zone }, indep: ind && { mode: ind.mode, rows: ind.rows.length, siblings: ind.siblings.length, N: ind.N, zone_hint: ind.zone } };
      d.push(r); all = all && r.page_ext && r.page_indep && r.ext_indep;
    }
  } finally { await close(p); }
  return ok(all && E.q132_inputs.length === 40 && Object.keys(IND).length === 40 && same(Object.keys(IND), E.q132_inputs), { indepSha256: SHA_INDEP, sentences: d }); // v1_17：40 句（獨立推導 c18 之 results）
};
/* Q134（v1_12 新增；v1_13 改；v1_15 增八句；v1_16 增十三句；v1_17 增二句〔抽：q134_c18〕）：客戶位置延伸至句末之提示（zone_hint）。輸入為〔抽：q134_inputs〕之 48 句（期望一律取 candidates[該句].zone_hint）；
 * v1_13：zone_hint 顯示時焦點在 no_result；computed border 各邊 0、font-size 15px、color 同 candidate_notice（「室內設計」取得）、左右內距 16px；寬 390 重查不溢出 */
const Q134_IN = E.q134_inputs;
const zoneState = p => p.evaluate(([zh, nr]) => {
  const all = [...document.querySelectorAll("body *")];
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; };
  const zs = all.filter(e => (e.innerText || "").trim() === zh && ![...e.children].some(c => (c.innerText || "").trim() === zh) && vis(e));
  const nrs = all.filter(e => (e.innerText || "").trim() === nr && ![...e.children].some(c => (c.innerText || "").trim() === nr) && vis(e));
  const z = zs[0], n = nrs[0], ae = document.activeElement;
  const desc = n ? (n.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean) : [];
  const cs = z ? getComputedStyle(z) : null, sides = ["Top", "Right", "Bottom", "Left"];
  const de = document.documentElement;
  return { n: zs.length, noResult: nrs.length, nextOfNoResult: !!z && !!n && n.nextElementSibling === z, role: z ? z.getAttribute("role") : null, id: z ? z.id : null,
    describedBy: !!z && !!z.id && desc.includes(z.id), noResultDescribedBy: n ? n.getAttribute("aria-describedby") : null, focusOnNoResult: !!n && ae === n, focusOnZoneHint: !!z && ae === z,
    style: cs ? { border: sides.map(x => cs["border" + x + "Width"]), fontSize: cs.fontSize, color: cs.color, paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, marginTop: cs.marginTop, whiteSpace: cs.whiteSpace } : null,
    right: z ? z.getBoundingClientRect().right : null, innerWidth: window.innerWidth, scrollWidth: de.scrollWidth, clientWidth: de.clientWidth,
    textInBody: document.body.innerText.includes(zh) };
}, [A.zone_hint, A.no_result]);
const noticeColor = p => p.evaluate(cn => { const e = [...document.querySelectorAll("body *")].find(x => x.textContent === cn && !x.children.length); return e ? getComputedStyle(e).color : null; }, A.candidate_notice);
R.Q134 = async (ctx, u) => {
  const d = []; let all = Q134_IN.length === 48 && Q134_IN.every(q => !!CAND[q]) && (E.q134_c18 || []).every(q => Q134_IN.includes(q)); // v1_17：48 句（增 q134_c18 之左彎引號二句）
  const p = await ctx.page(u.tool);
  try {
    await query(p, "室內設計"); const nc = await noticeColor(p); // candidate_notice 之 computed color
    const styleOk = z => !!z.style && z.style.border.every(v => parseFloat(v) === 0) && z.style.fontSize === "15px" && !!nc && z.style.color === nc && z.style.paddingLeft === "16px" && z.style.paddingRight === "16px" && z.style.marginTop === "-6px"; // v1_16：margin-top -6px
    for (const q of Q134_IN) {
      await query(p, q); const z = await zoneState(p); const exp = !!(CAND[q] && CAND[q].zone_hint);
      const g = exp ? z.n === 1 && z.nextOfNoResult && z.role === null && z.describedBy && z.focusOnNoResult && !z.focusOnZoneHint && styleOk(z) : z.n === 0 && !z.textInBody;
      d.push({ input: q, expect: exp, ...z, candidateNoticeColor: nc, ok: g }); all = all && g;
    }
    // 另於顯示 zone_hint 之後改查「咖啡廳」：zone_hint 消失
    await query(p, Q134_IN[0]); const z0 = await zoneState(p);
    await query(p, "咖啡廳"); const z1 = await zoneState(p);
    const g = z0.n === 1 && z1.n === 0 && !z1.textInBody;
    d.push({ input: "（" + Q134_IN[0] + " 之後改查）咖啡廳", before: z0.n, after: z1.n, textInBodyAfter: z1.textInBody, ok: g }); all = all && g;
  } finally { await close(p); }
  // v1_13：寬 390 重查「賣給 餐廳自己也開早餐店。」：不溢出，zone_hint 之右緣不大於視窗寬
  { const q = "賣給 餐廳自己也開早餐店。", p2 = await ctx.page(u.tool, 390, 844);
    try {
      await query(p2, q); const z = await zoneState(p2);
      const g = !!CAND[q] && CAND[q].zone_hint === true && z.n === 1 && z.scrollWidth <= z.clientWidth && z.right !== null && z.right <= z.innerWidth;
      d.push({ input: "（寬 390）" + q, expect: true, ...z, ok: g }); all = all && g;
    } finally { await close(p2); } }
  return ok(all, d);
};
/* Q135（v1_15 新增，c16 第二題）：register_note。一、「室內設計」；二、「E801060」（代碼直查）：恰一處元素之 innerText 逐字等於 register_note，
 * DOM 與縱座標位於 candidate_notice 之後、第一筆候選之前（phrase_legend 存在時位於其前）；三、「qwerty火星挖礦」；四、「G606011」（代碼查無）：頁面無此字樣 */
const registerState = p => p.evaluate(([rn, cn, lg]) => {
  const all = [...document.querySelectorAll("body *")];
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; };
  const leaf = t => all.filter(e => (e.innerText || "").trim() === t && ![...e.children].some(c => (c.innerText || "").trim() === t) && vis(e));
  const r = leaf(rn), c = leaf(cn), l = leaf(lg), first = document.querySelector("#results .cand");
  const after = (a, b) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && a.getBoundingClientRect().top < b.getBoundingClientRect().top;
  const x = r[0];
  return { n: r.length, notice: c.length, legend: l.length, afterNotice: after(c[0], x), beforeFirstCard: after(x, first), beforeLegend: l.length ? after(x, l[0]) : null, textInBody: document.body.innerText.includes(rn) };
}, [A.register_note, A.candidate_notice, A.phrase_legend]);
R.Q135 = async (ctx, u) => {
  const d = {}; let all = true;
  const p = await ctx.page(u.tool);
  try {
    for (const [lab, q, shown] of [["一", "室內設計", true], ["二", "E801060", true], ["三", "qwerty火星挖礦", false], ["四", "G606011", false]]) {
      await query(p, q); const s = await registerState(p);
      const g = shown ? s.n === 1 && s.notice === 1 && s.afterNotice && s.beforeFirstCard && s.beforeLegend !== false : s.n === 0 && !s.textInBody;
      d[lab] = { input: q, expectShown: shown, ...s, ok: g }; all = all && g;
    }
  } finally { await close(p); }
  return ok(all, d);
};
/* Q136（v1_16 新增；c17 第一至六題；v1_17 D201011 改列附條件，c17 第九題）：〔抽：plain_codes〕之 14 碼各查一次：各類之白話說明依 plain_by_code（plainCodeOk；dual 者依 Q12）；
 * 〔抽：plain_cond〕之六碼（D101011、D201011、G101041、H704031、H704041、I701011）之頁面不含 plain_sa 與 plain_co 之字樣；依據說明展開後 basis_item_4 逐字（獨立推導 c18 之 plain 另記於明細，不入判定） */
R.Q136 = async (ctx, u) => {
  const out = {}; let all = E.plain_codes.length === 14 && E.plain_cond.length === 6 && E.plain_cond.includes("D201011"); // v1_17：plain_cond 六碼（含 D201011）
  let IP = null; if (INDEP_FILE && fs.existsSync(INDEP_FILE) && sha256(fs.readFileSync(INDEP_FILE)) === SHA_INDEP) IP = JSON.parse(fs.readFileSync(INDEP_FILE, "utf8")).plain || null;
  for (const code of E.plain_codes) {
    const r = await CODE_ROW(ctx, u.tool, code, async (c, p) => { const t = await bodyText(p);
      let g = !!c[0] && c[0].code === code && plainCodeOk(c[0], code);
      const noSaCo = E.plain_cond.includes(code) ? !t.includes(A.plain_sa) && !t.includes(A.plain_co) : null; if (noSaCo === false) g = false;
      const ip = IP && IP[code]; const indepSame = ip ? same(ip.per_cat, PBC[code].per_cat) && ip.dual === PBC[code].dual : null;
      return ok(g, { expect: PBC[code], plain: c[0] && c[0].plain, outside: c[0] && c[0].outside, noPlainSaCo: noSaCo, indepPlainSame: indepSame }); });
    out[code] = r.ok ? { ok: true, indepPlainSame: r.detail.indepPlainSame } : r.detail; all = all && r.ok;
  }
  const p = await ctx.page(u.tool);
  try { await p.evaluate(() => { document.querySelectorAll("details").forEach(d => { d.open = true; }); });
    const n = await visibleTextCount(p, A.basis_item_4); out.basis_item_4 = { visible: n, text: A.basis_item_4 }; all = all && n === 1; } finally { await close(p); }
  return ok(all, out);
};
/* 建置列 Q01～Q04、Q137（於暫存目錄複製 build/ 執行，不動 repo 之輸出）；at 給定者（改版前之版本之 Q137）各檔改取該 commit 之檔（git cat-file） */
function buildSandbox(name, patchPy, mutate, at) {
  const root = path.join(TMP, "build-" + name + "-" + crypto.randomBytes(4).toString("hex")), b = path.join(root, "business-items", "build");
  fs.mkdirSync(b, { recursive: true });
  for (const f of ["build.py", "code_v8.xlsx", "business.pdf", at ? at.ext : EXT_FILE, "page_template.html"]) {
    if (at) fs.writeFileSync(path.join(b, f), execFileSync("git", ["-C", REPO, "cat-file", "-p", `${at.commit}:business-items/build/${f}`], { maxBuffer: 1 << 26 }));
    else fs.copyFileSync(path.join(BUILD, f), path.join(b, f));
  }
  if (patchPy) fs.writeFileSync(path.join(b, "build.py"), patchPy(fs.readFileSync(path.join(b, "build.py"), "utf8")));
  if (mutate) mutate(b);
  return { root, b };
}
function runBuild(sb, args = [], spec = SPEC) {
  const r = spawnSync("python3", ["-I", path.join(sb.b, "build.py"), "--spec", spec, ...args], { encoding: "utf8" });
  const idx = path.join(sb.root, "business-items", "index.html");
  return { code: r.status, out: r.stdout, err: r.stderr, index: fs.existsSync(idx), report: fs.existsSync(path.join(sb.b, "build_report.md")) ? fs.readFileSync(path.join(sb.b, "build_report.md"), "utf8") : null };
}
const pyXlsx = (file, code) => execFileSync("python3", ["-I", "-c", `import openpyxl,sys\nwb=openpyxl.load_workbook(sys.argv[1])\nws=wb.active\n${code}\nwb.save(sys.argv[1])`, file]);
const NEED_SPEC = { ok: null, detail: "未給 --spec（規格 v1_24 之路徑），建置列不能執行" };
R.Q01 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const sb = buildSandbox("Q01", env.patchBuild);
  const r = runBuild(sb);
  const rep = r.report || "";
  const g = r.code === 0 && r.index && !!r.report && rep.includes("code_v8.xlsx｜92149 位元組｜SHA-256 931126c9f6640329fadb06fc18dab8f53fd636e817d01f6e2aa23606e443a52b") && rep.includes("business.pdf｜159336 位元組｜SHA-256 aa1c4e8bf1a9d1e5ce27888bd0c5b22fa7c4c359324c3ca5aa7a3c332408a710") && rep.includes(`筆數：${E.master.count}；不重複代碼：${E.master.count}；重複：無`) && rep.includes(`尾碼 1（許可業務）：${E.master.tail_1} 筆`);
  // v1_16（F-B-03）：重建所得之 index.html 與受驗 commit 中之 business-items/index.html（受驗頁；本程式以 git cat-file 自 HEAD 取出，見 env.src.tool）逐位元組相同
  const rebuilt = r.index ? sha256(fs.readFileSync(path.join(sb.root, "business-items", "index.html"))) : null, tested = sha256(Buffer.from(env.src.tool, "utf8"));
  const sameIdx = !!rebuilt && rebuilt === tested;
  return ok(g && sameIdx, { exit: r.code, index: r.index, report: !!r.report, rebuiltSha256: rebuilt, testedPageSha256: tested, sameAsTestedCommitIndex: sameIdx, testedFrom: env.srcOrigin || "HEAD:business-items/index.html", err: r.err.trim() || undefined });
};
R.Q02 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const sb = buildSandbox("Q02", env.patchBuild, b => pyXlsx(path.join(b, "code_v8.xlsx"), "ws.cell(row=1,column=4).value='定義內客'"));
  const r = runBuild(sb, ["--test-no-hash"]);
  return ok(r.code !== 0 && !r.index && r.err.includes("實際欄名") && r.err.includes("定義內客"), { exit: r.code, index: r.index, err: r.err.trim(), flag: "--test-no-hash", mode: "測試模式（build.py --test-no-hash：只關閉 SHA-256 核對）；雜湊核對先行於欄名核對，故欄名一例須關閉雜湊核對方能觸發（驗證表 v1_8 Q02、七題之二）" });
};
R.Q03 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const s1 = buildSandbox("Q03a", env.patchBuild, b => fs.unlinkSync(path.join(b, "code_v8.xlsx")));
  const r1 = runBuild(s1);
  const s2 = buildSandbox("Q03b", env.patchBuild, b => { const f = path.join(b, "code_v8.xlsx"); const x = fs.readFileSync(f); x[x.length - 1] ^= 0x01; fs.writeFileSync(f, x); });
  const actual = sha256(fs.readFileSync(path.join(s2.b, "code_v8.xlsx")));
  const r2 = runBuild(s2);
  const bp = fs.readFileSync(path.join(s1.b, "build.py"), "utf8");
  const g = r1.code !== 0 && !r1.index && r1.err.includes("資料下載") && r2.code !== 0 && !r2.index && r2.err.includes("931126c9f6640329fadb06fc18dab8f53fd636e817d01f6e2aa23606e443a52b") && r2.err.includes(actual) && !/^\s*(import|from)\s+(urllib|requests|http)/m.test(bp);
  return ok(g, { 例一: { exit: r1.code, index: r1.index, err: r1.err.trim() }, 例二: { exit: r2.code, index: r2.index, err: r2.err.trim() } });
};
R.Q04 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const sb = buildSandbox("Q04", env.patchBuild, b => pyXlsx(path.join(b, "code_v8.xlsx"), "ws.append([c.value for c in ws[2]])"));
  const r = runBuild(sb, ["--test-no-hash"]);
  return ok(r.code !== 0 && !r.index && r.err.includes("代碼重複") && r.err.includes(Object.keys(M).sort()[0]), { exit: r.code, index: r.index, err: r.err.trim(), flag: "--test-no-hash" });
};
/* Q137（v1_17 新增；c17 第十題之一、二）：建置停止路徑。以 build.py 之測試注入（--test-inject；只在本列使用）於解析一覽表後、名單核對前改動資料，各執行一次：
 * 一、H101021 增括號註記「（註：測試）」；二、H203011 增列於第九類；三、D101011 增列於第七類。每次執行前 business-items/index.html 為受驗 commit 之檔（env.src.tool）。
 * 三次均：結束碼 2；index.html 執行前後逐位元組相同；build_report.md 列出該代碼與原因；build_report.md 與 stderr 均含 STOP_NOTE（自規格 v1_20 第八節規則 2 之二（6）之「註明「…」」抽出，不手抄）；
 * 三次後不注入之正常建置所得 index.html 與受驗 commit 之檔逐位元組相同（同 Q01）。env.q137At 給定者（改版前之版本）以該 commit 之 build.py 等檔與規格 v1_19 執行，照記 */
/* v1_18 改寫（c17 第十二、十三題）：二改為 H203011 增列於第二類（[2, 9]）；增四、H203011 增列於第九類（[9, 9]）；五、只給 --test-inject 而不給值；六、H203011 增一括號註記（第九類無白話說明，不觸發停止）。
 * 一至四：結束碼 2、index.html 不變、build_report.md 列出該代碼與原因、報告與 stderr 均含 STOP_NOTE；五、六：結束碼非 0、index.html 不變、stderr 含 STOP_NOTE。
 * 原因之判法：二、四以該代碼所在類別之清單（[2, 9]、[9, 9]）與代碼同列判之（build.py 之字樣：二「列於兩類而非第五、七類」、四「於同一類列兩次以上」）。 */
const Q137_CASES = [["一", ["--test-inject", "note:H101021:（註：測試）"], "H101021", "附括號註記而不在（3）（4）名單", true], ["二", ["--test-inject", "add:H203011:2"], "H203011", "[2, 9]", true],
  ["三", ["--test-inject", "add:D101011:7"], "D101011", "（3）名單之代碼列於兩類", true], ["四", ["--test-inject", "add:H203011:9"], "H203011", "[9, 9]", true],
  ["五", ["--test-inject"], null, null, false], ["六", ["--test-inject", "note:H203011:（註：測試）"], null, null, false]];
// 判定方式三十（驗證表 v1_19）：os.stat 之 st_mtime_ns（以 python3 讀取，與判定方式之字面一致）；精度以連續兩次寫入同一內容之 st_mtime_ns 差與末位零之個數記錄
const mtimeNs = f => execFileSync("python3", ["-I", "-c", "import os,sys;print(os.stat(sys.argv[1]).st_mtime_ns)", f], { encoding: "utf8" }).trim();
function mtimePrecision(f, buf) {
  const xs = []; for (let i = 0; i < 3; i++) { fs.writeFileSync(f, buf); xs.push(mtimeNs(f)); }
  const tz = x => { let n = 0; for (let i = x.length - 1; i >= 0 && x[i] === "0"; i--) n++; return n; };
  let fsType = null; try { fsType = execFileSync("stat", ["-f", "-c", "%T", f], { encoding: "utf8" }).trim(); } catch (e) { }
  return { samples: xs, trailingZeros: xs.map(tz), distinct: new Set(xs).size, fsType, note: xs.every(x => tz(x) < 3) ? "奈秒精度（末三位非全零）" : "末三位為零者有之，精度可能低於奈秒，見 samples" };
}
function stopNote() {
  const m = fs.readFileSync(SPEC, "utf8").match(/建置報告與錯誤訊息並註明「(現存之 index\.html[^」]*)」/); if (!m) throw new Error("規格中找不到建置停止之註明（第八節規則 2 之二（6））"); return m[1];
}
R.Q137 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const at = env.q137At || null;
  if (at && !(at.spec && fs.existsSync(at.spec) && sha256(fs.readFileSync(at.spec)) === at.specSha)) return { ok: null, detail: "未給 " + at.specArg + " 或其 SHA-256 不符；改版前之版本之 Q137 不能執行" };
  const note = stopNote(), tested = Buffer.from(env.src.tool, "utf8"), testedSha = sha256(tested);
  const sb = buildSandbox("Q137", env.patchBuild, null, at), idx = path.join(sb.root, "business-items", "index.html");
  const spec = at ? at.spec : SPEC;
  const d = { stopNote: note, testedPageSha256: testedSha, testedFrom: env.srcOrigin || "HEAD:business-items/index.html", buildFrom: at ? at.commit + "（build.py、" + at.ext + "、page_template.html；" + at.specLabel + "）" : "工作區 build/",
    判定方式三十: "不寫 index.html＝執行前後 SHA-256 相同且 os.stat 之 st_mtime_ns 相同（以 python3 讀取）；任一不同即未通過", mtimePrecision: mtimePrecision(idx, tested) }; let all = true;
  for (const [lab, args, code, reason, stops] of Q137_CASES) {
    fs.writeFileSync(idx, tested); const rp = path.join(sb.b, "build_report.md"); if (fs.existsSync(rp)) fs.unlinkSync(rp);
    const mBefore = mtimeNs(idx);
    const r = runBuild(sb, args, spec);
    const after = fs.existsSync(idx) ? sha256(fs.readFileSync(idx)) : null, mAfter = fs.existsSync(idx) ? mtimeNs(idx) : null, rep = r.report || "";
    const lineOk = stops ? rep.split("\n").some(l => l.includes(code) && l.includes(reason)) : null;
    const x = { args, exit: r.code, indexBefore: testedSha, indexAfter: after, mtimeNsBefore: mBefore, mtimeNsAfter: mAfter, sha256Same: after === testedSha, mtimeSame: mAfter !== null && mAfter === mBefore,
      indexUnchanged: after === testedSha && mAfter !== null && mAfter === mBefore, reportListsCodeAndReason: lineOk, reportHasNote: stops ? rep.includes(note) : null, stderrHasNote: r.err.includes(note), stderr: r.err.trim(), report: rep || null };
    x.ok = stops ? (r.code === 2 && x.indexUnchanged && lineOk && x.reportHasNote && x.stderrHasNote) : (r.code !== 0 && r.code !== null && x.indexUnchanged && x.stderrHasNote); d[lab] = x; all = all && x.ok;
  }
  fs.writeFileSync(idx, tested);
  const r4 = runBuild(sb, [], spec), re = fs.existsSync(idx) ? sha256(fs.readFileSync(idx)) : null;
  d.正常建置 = { normalBuild: true, exit: r4.code, rebuiltSha256: re, sameAsTestedCommitIndex: re === testedSha, err: r4.err.trim() || undefined }; d.正常建置.ok = r4.code === 0 && re === testedSha; all = all && d.正常建置.ok;
  return ok(all, d);
};

/* Q138（v1_18 新增；拘40；外殼 R9、R12）：外殼驗證表 v1_2 定稿之適用列（shell_v1_2.js；射程以外殼表各列之對象欄判定，含標「待正式版合入」者），比對基準一律為 a47269e 之頁面；
 * 本列：適用列無未通過且無未執行者通過，有未通過者未通過，其餘未執行；補填（規格 v1_22 第十一節之 7）未寫入 knowledge 者本列未執行（--shell-fill-commit 未給）。
 * 外殼表與本表對同一事項之期望不一致者以外殼表為準（判定方式二十九），逐列記於 results/外殼v1_2_Q138.json 之 conflicts。 */
let SKV = null, FF_LAUNCH = null;
// 判定方式三十一（驗證表 v1_19；規格 v1_22 第三十七節二甲）：外殼表 R02 之基準為規格 v1_22 之收合列內文（〔抽：attribution〕加〔抽：basis_item_1〕～〔抽：basis_item_4〕），不以 a47269e 之內文為基準
const R02_EXPECT = { text: [A.attribution, A.basis_item_1, A.basis_item_2, A.basis_item_3, A.basis_item_4].join(""), label: "規格 v1_24 之收合列內文（〔抽：attribution〕加〔抽：basis_item_1〕～〔抽：basis_item_4〕；ext_c21_輸出.json；本工具驗證表 v1_19 判定方式三十一），不以 a47269e 之內文為基準" };
function shellKv() {
  if (SKV) return SKV;
  if (!SHELL_SPEC || !fs.existsSync(SHELL_SPEC) || sha256(fs.readFileSync(SHELL_SPEC)) !== SHA_SHELL_SPEC) throw new Error("未給 --shell-spec 或其 SHA-256 不符");
  const sec = fs.readFileSync(SHELL_SPEC, "utf8").split("## 附錄、逐字字樣")[1].split("\n## ")[0]; const kv = {};
  for (const m of sec.matchAll(/^- ([^：\n]+)：「(.*)」\s*$/gm)) { if (kv[m[1].trim()] !== undefined) throw new Error("外殼規格附錄鍵重複：" + m[1]); kv[m[1].trim()] = m[2]; }
  // 規格 v1_21 附錄 A 之外殼鍵與外殼規格附錄逐字相同（ext_c19.py 已核對；此處再核）
  for (const [a, k] of [["shell_disclaimer", "免責句"], ["shell_privacy", "隱私句"], ["shell_basis_title", "頁尾收合列"], ["view_all", "看全部文字"], ["view_all_url", "看全部網址"], ["view_all_aria", "看全部讀屏名"], ["booking", "預約文字"], ["booking_url", "預約網址"], ["booking_aria", "預約讀屏名"]])
    if (A[a] !== kv[k]) throw new Error(`附錄 A ${a} 與外殼規格附錄「${k}」不同`);
  SKV = kv; return kv;
}
// c20b（驗證表 v1_20 判定方式三十二）：F10、X06 之基準頁；未產生者 F10、X06 記未執行（不退回 a47269e）
let BASE32 = null;
const base32Of = u => u.base32 ? { url: u.base32, label: "判定方式三十二之基準頁（make_base32.py 自 tools a47269e 之 business-items/index.html 產生；" + BASE32.基準頁位元組數 + " 位元組，SHA-256 " + BASE32.基準頁SHA256 + "）" } : { url: null, label: "判定方式三十二之基準頁未產生：" + (BASE32 && BASE32.error) };
R.Q138 = async (ctx, u, env) => {
  if (!SHELL_TABLE || !fs.existsSync(SHELL_TABLE) || sha256(fs.readFileSync(SHELL_TABLE)) !== SHA_SHELL_TABLE) return { ok: null, detail: "未給 --shell-table 或其 SHA-256 不符" };
  if (!ctx.browser) throw new LaunchError("瀏覽器無法啟動：" + ctx.launchError);
  const kv = shellKv();
  const K = { bookUrl: kv["預約網址"], vaUrl: kv["看全部網址"], sig: kv["署名"], sigUrl: kv["署名網址"], disc: kv["免責句"], priv: kv["隱私句"], ver: A.version_line };
  const res = await SHELL.runShell({ browser: ctx.browser, url: u.tool, src: env.src.tool, base: { url: u.base, label: "tools a47269e 之 business-items/index.html（c18；SHA-256 " + SHA_BASE_TOOL + "）" }, base32: base32Of(u), r02Expect: R02_EXPECT, kv, K, inputs: E.all_inputs,
    shotsDir: env.q138Shots || null, shotTag: env.q138ShotTag || "x", firefox: FF_LAUNCH, anchor: SHELL_FILL_COMMIT ? "label[for=biz]（規格 v1_24 第十一節之 2；knowledge " + SHELL_FILL_COMMIT + " 之補填以 render_current.py 對 a47269e 重抽，第一個作答元件為 textarea#biz）" : null,
    discOld: A.disclaimer_old, version: "1.0.0" });
  const app = SHELL.APPLICABLE.filter(id => res.rows[id] && res.rows[id].result !== "不適用");
  const failed = app.filter(id => res.rows[id].result === "未通過"), notRun = app.filter(id => res.rows[id].result === "未執行");
  const okv = failed.length ? false : (notRun.length || !SHELL_FILL_COMMIT) ? null : true;
  return { ok: okv, detail: { 適用列: app, 射程標記不適用: Object.fromEntries(Object.entries(res.rows).filter(([k, v]) => v.result === "不適用").map(([k, v]) => [k, v.reason]).concat(Object.entries(SHELL.NOT_APPLICABLE))),
    未通過: failed, 未執行: notRun, 補填commit: SHELL_FILL_COMMIT || null, 探針組數: res.gridCount, rows: res.rows } };
};

const ROW_ORDER = ["Q01", "Q02", "Q03", "Q04", "Q05", "Q06", "Q07", "Q08", "Q09", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q42", "Q43", "Q44", "Q18", "Q19", "Q20", "Q21", "Q86", "Q87", "Q88", "Q89", "Q90", "Q91", "Q92", "Q93", "Q94", "Q100", "Q101", "Q102", "Q103", "Q40", "Q63", "Q65", "Q66", "Q67", "Q68", "Q69", "Q82", "Q83", "Q84", "Q70", "Q71", "Q72", "Q73", "Q74", "Q75", "Q76", "Q77", "Q78", "Q79", "Q85", "Q95", "Q96", "Q97", "Q98", "Q104", "Q105", "Q106", "Q107", "Q108",
  "Q109", "Q110", "Q111", "Q112", "Q113", "Q114", "Q115", "Q116", "Q117", "Q118", "Q119", "Q120", "Q121", "Q122", "Q123", "Q124", "Q125", "Q126", "Q133", "Q128", "Q129", "Q130", "Q132", "Q134", "Q135", "Q136", "Q137", "Q138", "Q80", "Q81", "Q99", "Q127"];
const MANUAL = {
  Q80: "人工列：以 run_x4_c10.py（c22 只增檔頭說明一行，執行內容未改；c22b 未改）對 X4 對照組（對照組 v1_0，40 則）報數字（results/x4_c22_Q80Q99.json），交使用者裁定；判定記未執行",
  Q99: "人工列：以 Q80 同一次執行之輸出報未命中與「說法對到而內部版未列」清單（results/x4_c22_Q80Q99.json），交使用者判讀；判定記未執行",
  Q127: "人工列：以 run_x4_c10.py（c22 只增檔頭說明一行，執行內容未改；c22b 未改）對第二組（對照組第二組 v1_0，20 則）報數字（results/x4_c22_Q127.json），只報數字；判定記未執行",
  Q81: "人工列：截圖以 --shots 全部重產（verify/screenshots/，驗證表 v1_23 之清單，張數不增；c22b 頁面未改〔與 bf4c873 逐位元組相同〕，故不另作截圖比對；c22 之頁面只改列印樣式（@media print 之內）與 pageshow 之重設，螢幕畫面外觀不變）；交使用者與設計稿並排核可；判定記未執行",
  Q126: "人工列：Android 手機 Chrome 之鍵盤（輸入鍵為「搜尋」、注音與英文候選列仍在時按「搜尋」一次即查詢；v1_11 F-G-07），須使用者實機操作；iOS 使用者無裝置；判定記未執行",
  Q133: "人工列：Mac Safari 注音選字之 Enter（v1_11 自 Q126 移出），須使用者實機操作；使用者無 Mac 裝置者記未執行；判定記未執行",
};
const OUT_OF_SCOPE = { D01: "不在射程（驗證表 v1_23 第九之二節）", D02: "同上", D03: "同上", D04: "同上", D05: "同上", D06: "同上" };

/* ───────── 刻意錯誤版 ───────── */
function sub(s, a, b) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`補丁之原字串出現 ${n} 次：${a.slice(0, 60)}`); return s.replace(a, () => b); }
function patchPlain(s, f) { // 主程式內 PLAIN_BY_CODE（逐代碼之白話說明對應；c17）之改動
  const re = /(var PLAIN_BY_CODE=)(\{.*?\});\n/; const m = s.match(re); if (!m) throw new Error("找不到 PLAIN_BY_CODE"); const o = JSON.parse(m[2]); const n = f(o) || o;
  return s.replace(re, (_, a) => a + JSON.stringify(n).replace(/</g, "\\u003c") + ";\n");
}
const forCat = (P, n, k) => { let c = 0; for (const x of Object.values(P)) if (has(x.per_cat, n)) { x.per_cat[n] = k; c++; } if (!c) throw new Error("PLAIN_BY_CODE 無第 " + n + " 類"); };
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function patchJson(s, id, f) { const re = new RegExp(`(id="${id}">)([\\s\\S]*?)(</script>)`); const m = s.match(re); const o = JSON.parse(m[2]); const n = f(o) || o; return s.replace(re, (_, a, __, c) => a + JSON.stringify(n).replace(/</g, "\\u003c") + c); }
const T = "tool", B = "build";
function phrasesV1_10() { // 規格 v1_10 附錄 B（knowledge 68605af；SHA-256 核對）
  if (!SPEC_V1_10 || !fs.existsSync(SPEC_V1_10) || sha256(fs.readFileSync(SPEC_V1_10)) !== SHA_SPEC_V1_10) throw new Error("未給 --spec-v1-10 或其 SHA-256 不符");
  const t = fs.readFileSync(SPEC_V1_10, "utf8"); const i = t.indexOf("\n## 附錄 B"); const j = t.indexOf("\n## ", i + 1); const sec = t.slice(i, j < 0 ? undefined : j);
  const P = {}; for (const ln of sec.split("\n")) { const m = ln.match(/^- ([A-Z0-9]{7})（(.+?)）：「(.*)」$/); if (m) P[m[1]] = m[3].split("、"); } return P;
}
let C10_TOOL = null;
function c10Tool() { // tools 7f2e6e1 之工具頁（v1_11 之字型堆疊；SHA-256 核對）
  if (C10_TOOL === null) { const t = execFileSync("git", ["-C", REPO, "show", `${C10_COMMIT}:business-items/index.html`], { encoding: "utf8", maxBuffer: 1 << 26 }); if (sha256(Buffer.from(t, "utf8")) !== SHA_C10_TOOL) throw new Error("7f2e6e1 之工具頁 SHA-256 不符"); C10_TOOL = t; }
  return C10_TOOL;
}
function pairV1_12(no) { // 規格 v1_12 附錄 D 之第 no 對（knowledge 30902f4；SHA-256 核對）；回傳內嵌格式 [短說法, 長說法, 代碼]
  if (!SPEC_V1_12 || !fs.existsSync(SPEC_V1_12) || sha256(fs.readFileSync(SPEC_V1_12)) !== SHA_SPEC_V1_12) throw new Error("未給 --spec-v1-12 或其 SHA-256 不符");
  const t = fs.readFileSync(SPEC_V1_12, "utf8"); const i = t.indexOf("\n## 附錄 D"); const j = t.indexOf("\n## ", i + 1); const sec = t.slice(i, j < 0 ? undefined : j);
  for (const ln of sec.split("\n")) { const m = ln.match(/^- 第 (\d+) 對：「(.+?)」⊂「(.+?)」：(.+)$/); if (m && Number(m[1]) === no) return [m[2], m[3], m[4].split("、")]; }
  throw new Error("規格 v1_12 附錄 D 無第 " + no + " 對");
}
const ZH_C16 = "  var zh=!rows.length&&zs.some(function(z){return z[1]>z[0]&&cps(x.slice(z[1])).every(function(c){return ZONE_END.indexOf(c)>=0||CLOSERS.indexOf(c)>=0;});});"; // c16 之 zone_hint 條件（規格 v1_18 第七節第二項第 9 步；c14 之條件加右括號、右引號）
const ZH_C14 = "  var zh=!rows.length&&zs.some(function(z){return z[1]>z[0]&&cps(x.slice(z[1])).every(function(c){return ZONE_END.indexOf(c)>=0;});});"; // c14、c15 之條件（E140 之回 v1_17）
let PRE_TOOL = null, C13_TOOL = null, C14_TOOL = null;
const gitTool = (commit, sha) => { const t = execFileSync("git", ["-C", REPO, "show", `${commit}:business-items/index.html`], { encoding: "utf8", maxBuffer: 1 << 26 }); if (sha256(Buffer.from(t, "utf8")) !== sha) throw new Error(commit + " 之工具頁 SHA-256 不符"); return t; };
function preTool() { // 改版前之版本（c22：tools c9302c5 之工具頁，c21；SHA-256 核對）
  if (PRE_TOOL === null) PRE_TOOL = gitTool(PRE_COMMIT, SHA_PRE_TOOL);
  return PRE_TOOL;
}
let BASE_TOOL = null;
function baseTool() { // 外殼 v1_2 之比對基準與舊版回測（tools a47269e 之工具頁，c18；SHA-256 核對）
  if (BASE_TOOL === null) BASE_TOOL = gitTool(BASE_COMMIT, SHA_BASE_TOOL);
  return BASE_TOOL;
}
let C15_TOOL = null;
function c15Tool() { // tools fcba277 之工具頁（c15；SHA-256 核對；E141）
  if (C15_TOOL === null) C15_TOOL = gitTool(C15_COMMIT, SHA_C15_TOOL);
  return C15_TOOL;
}
const embeddedStr = (t, k) => JSON.parse(t.match(/id="data-str">([\s\S]*?)<\/script>/)[1])[k];
let C16_TOOL = null;
function c16Tool() { // tools 2b6e7f0 之工具頁（c16；SHA-256 核對；E151～E153）
  if (C16_TOOL === null) C16_TOOL = gitTool(C16_COMMIT, SHA_C16_TOOL);
  return C16_TOOL;
}
function plainCoBizV1_18() { // E151：規格 v1_18 附錄 A 之 plain_co_biz（2b6e7f0 之工具頁由 build.py 自規格 v1_18 抽出內嵌）
  const v = embeddedStr(c16Tool(), "plain_co_biz"); if (!v || v === A.plain_co_biz) throw new Error("2b6e7f0 之 plain_co_biz 字樣未取得或與 c17 相同"); return v;
}
function basisItem4V1_18() { // E152：規格 v1_18 附錄 A 之 basis_item_4（2b6e7f0 之工具頁依據說明之第四項）
  const t = c16Tool(), m = t.match(new RegExp("<li>" + A.basis_item_3.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "</li>\n<li>([^<]*)</li>"));
  if (!m || m[1] === A.basis_item_4) throw new Error("2b6e7f0 之 basis_item_4 字樣未取得或與 c17 相同"); return m[1];
}
function closersV1_18() { // E153：c16（2b6e7f0）之 CLOSERS 宣告（規格 v1_18 之右括號與右引號）
  const m = c16Tool().match(/var CLOSERS=[^\n]*;/); if (!m || m[0].includes("”")) throw new Error("2b6e7f0 之 CLOSERS 未取得或已含「”」"); return m[0];
}
function c14Tool() { // tools 058fa6f 之工具頁（c14；SHA-256 核對）
  if (C14_TOOL === null) C14_TOOL = gitTool(C14_COMMIT, SHA_C14_TOOL);
  return C14_TOOL;
}
function c13Tool() { // tools 3624af9 之工具頁（c13；SHA-256 核對）
  if (C13_TOOL === null) { const t = execFileSync("git", ["-C", REPO, "show", `${C13_COMMIT}:business-items/index.html`], { encoding: "utf8", maxBuffer: 1 << 26 }); if (sha256(Buffer.from(t, "utf8")) !== SHA_C13_TOOL) throw new Error(C13_COMMIT + " 之工具頁 SHA-256 不符"); C13_TOOL = t; }
  return C13_TOOL;
}
const embeddedZone = t => JSON.parse(t.match(/id="data-str">([\s\S]*?)<\/script>/)[1]).zone_hint;
function zoneHintV1_15() { // E120：規格 v1_15 附錄 A 之 zone_hint（3624af9 之工具頁由 build.py 自規格 v1_15 抽出內嵌）
  const v = embeddedZone(c13Tool()); if (!v || v === A.zone_hint) throw new Error("3624af9 之 zone_hint 字樣未取得或與 c16 相同"); return v;
}
function zoneHintV1_16() { // E129：規格 v1_16 附錄 A 之 zone_hint（058fa6f 之工具頁由 build.py 自規格 v1_16 抽出內嵌）
  const v = embeddedZone(c14Tool()); if (!v || v === A.zone_hint || v === zoneHintV1_15()) throw new Error("058fa6f 之 zone_hint 字樣未取得或與 c16、v1_15 相同"); return v;
}
function zoneHintV1_17() { // E141：規格 v1_17 附錄 A 之 zone_hint（fcba277 之工具頁由 build.py 自規格 v1_17 抽出內嵌）
  const v = embeddedZone(c15Tool()); if (!v || v === A.zone_hint || v === zoneHintV1_15() || v === zoneHintV1_16()) throw new Error("fcba277 之 zone_hint 字樣未取得或與 c16、v1_15、v1_16 相同"); return v;
}
function dataOrgBlock() { // E132：3624af9 之工具頁之 data-org 區塊（原樣）
  const m = c13Tool().match(/<script type="application\/json" id="data-org">[\s\S]*?<\/script>\n/); if (!m) throw new Error("3624af9 之工具頁無 data-org 區塊"); return m[0];
}
function oldFieldset() { // E67：058fa6f 之工具頁之組織型態 fieldset（原樣）
  const m = c14Tool().match(/<fieldset>[\s\S]*?<\/fieldset>\n/); if (!m || !m[0].includes('name="org"')) throw new Error("058fa6f 之工具頁無組織型態之 fieldset"); return m[0];
}
const fontStack = s => { const m = s.match(/:root\{(--serif:[^;]*;--sans:[^;]*);/); if (!m) throw new Error("找不到 :root 之 --serif、--sans"); return m[1]; };
const VARIANTS = [
  ["E01", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 10).items = L2.find(c => c.no === 10).items.filter(i => i.code !== "E801060"); }), ["Q06", "Q18"]],
  ["E02", T, s => sub(s, "if(/1$/.test(row.code)){", "if(false){"), ["Q05"]],
  ["E03", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 7).items = L2.find(c => c.no === 7).items.filter(i => i.code !== "HZ07011"); }), ["Q12", "Q83"]],
  ["E04", T, s => patchJson(patchJson(s, "data-list", L2 => { L2.find(c => c.no === 4).items.splice(1, 0, cat(4).items.find(i => i.code === "G606011")); }), "data-codes", C => { C.push(["G606011", "機場園區經營業", "（測試用加回）"]); }), ["Q13", "Q66", "Q83"]],
  ["E05", T, s => patchJson(s, "data-codes", C => { C.find(r => r[0] === "JA02071")[1] = "JA02071"; }), ["Q68", "Q82"]],
  // v1_14 改寫（c15 第一題）：E06、E07、E67、E68、E97、E104、E111；E07、E97 之舊字樣取自 ext_c15 之附錄 A *_old 鍵，E67 之組織型態選項取自 tools 058fa6f 之工具頁（SHA-256 核對）
  ["E06", T, s => sub(s, 'f.appendChild(el("p","flag-title cat-title",r.title));', 'if(r.no!==7)f.appendChild(el("p","flag-title cat-title",r.title));'), ["Q84"]], // 第七類之代碼不標類別原文
  ["E07", T, s => sub(s, "  return a;\n}", "  (RESTR[row.code]||[]).forEach(function(r){if(" + JSON.stringify(OLD_CONFLICT_LTD) + ".indexOf(r.no)>=0)a.appendChild(el(\"p\",\"conflict\"," + JSON.stringify(A.conflict_prefix_old) + "+r.title));});\n  return a;\n}"), ["Q08", "Q14", "Q15", "Q43", "Q84"]], // 依固定之組織型態（有限公司）判衝突並顯示 conflict_prefix_old
  ["E08", T, s => sub(s, "依政府資料開放授權條款第 1 版利用", ""), ["Q63"]],
  ["E09", T, s => sub(s, "var q=biz.value,r=search(q);", "var q=biz.value,r=search(q);localStorage.setItem(\"q\",q);"), ["Q78"]],
  ["E10", T, s => sub(s, "var q=biz.value,r=search(q);", "var q=biz.value,r=search(q);fetch(location.href);"), ["Q78"]],
  ["E11", T, s => sub(s, `content="${A.tool_version}"`, `content="${A.tool_version}${A.forbidden_version_suffix}"`), ["Q75"]],
  ["E12", T, s => sub(s, `<p class="as-of">${A.version_line}</p>`, `<p class="as-of">版本 v1.0.0｜法規依據擷取日 115/10/15</p>`), ["Q74"]],
  ["E13", T, s => { const sig = s.match(/<a class="sig"[^>]*>[^<]*<\/a>\n/)[0]; return sub(sub(s, sig, ""), `<p class="as-of">${A.version_line}</p>`, `<p class="as-of">${A.version_line}</p>\n${sig}`); }, ["Q70"]],
  ["E14", T, s => sub(s, 'f.appendChild(el("p","flag-sub restriction-note",S.restriction_note));', ""), ["Q06", "Q17"]],
  ["E15", T, s => sub(sub(patchJson(s, "data-codes", C => { C.forEach(r => r.push(M[r[0]][1])); }), "BY[r[0]]={code:r[0],name:r[1],def:r[2],", "BY[r[0]]={code:r[0],name:r[1],def:r[2],en:r[3],"), 'h.appendChild(el("span","cand-name",e.name));a.appendChild(h);', 'h.appendChild(el("span","cand-name",e.name));h.appendChild(el("span","cand-en",e.en));a.appendChild(h);'), ["Q19", "Q82"]],
  ["E16", T, s => sub(s, "rows.sort(function(a,b){", "if(!rows.length)rows=ORDER.slice(0,5).map(function(k){return {code:k,nh:0,tot:0,via:false,tag:null};});rows.sort(function(a,b){"), ["Q21"]],
  ["E17", T, s => patchJson(s, "data-codes", C => { C.forEach(r => { r[2] = r[2].replace(/\s/g, ""); }); }), ["Q82"]],
  ["E18", T, s => { const bk = s.match(/<a class="sy-book-btn"[^>]*>.*?<\/a>/)[0]; return sub(s, bk, bk + bk); }, ["Q72"]], // c19：預約連結內含 ↗ 之 span、與看全部工具同列（補丁依 c19 原文改寫，義不變）
  ["E19", T, s => patchJson(s, "data-phrases", P => { P.F501030 = P.F501030.filter(x => x !== "咖啡廳"); }), ["Q86", "Q92"]],
  ["E20", T, s => sub(s, "SCANW.forEach(function(w){if(occ(x,w).some(function(o){return !overlaps(o,zs);}))words[w]=true;});", ""), ["Q86", "Q87", "Q89", "Q91"]],
  ["E21", T, s => sub(s, "{s=3;via.push(w);}", "{s=2;via.push(w);}"), ["Q128"], { // v1_8 改應抓列；v1_10：「企管顧問 進出口」為必抓之句，其餘有差異之句列出
    must: det => ({ ok: !!det.Q128 && Array.isArray(det.Q128.mismatches) && det.Q128.mismatches.some(m => m.input === "企管顧問 進出口"), mismatchInputs: det.Q128 && det.Q128.mismatches ? det.Q128.mismatches.map(m => m.input) : null }) }],
  ["E22", T, s => sub(s, "else if(typed[w]&&bigramHit(w,e.n+e.d))s=1;", "else if(bigramHit(w,e.n+e.d))s=1;"), ["Q94"]],
  ["E23", T, s => sub(s, 'if(row.tag)a.appendChild(el("span","phrase-tag",row.tag));', 'a.appendChild(el("span","phrase-tag",row.tag||S.phrase_tag.replace("〔說法〕","")));'), ["Q89", "Q90", "Q116"]],
  ["E24", T, s => sub(s, 'return S.phrase_tag.replace("〔說法〕",forms.join("」「"));', 'return "依經濟部常見說法對到";'), ["Q86", "Q90", "Q102"]],
  ["E25", T, s => sub(s, `<h1>${A.page_title}</h1>`, `<h2>${A.page_title}</h2>`), ["Q95"]],
  ["E26", T, s => { const head = s.match(/<h1>[\s\S]*?<\/ol>\n/)[0]; return sub(sub(s, head, ""), "<script>\n(function(){", `<script>\ndocument.querySelector(".page-head .wrap").insertAdjacentHTML("afterbegin",${JSON.stringify(head)});\n(function(){`); }, ["Q95", "Q96"]],
  ["E27", T, s => sub(sub(sub(s, `<li>${A.purpose_item_1}</li>`, `<li>1.${A.purpose_item_1}</li>`), `<li>${A.purpose_item_2}</li>`, `<li>2.${A.purpose_item_2}</li>`), `<li>${A.purpose_item_3}</li>`, `<li>3.${A.purpose_item_3}</li>`), ["Q96"]],
  ["E28", T, s => sub(s, `placeholder="${A.input_placeholder}"`, 'placeholder="例：咖啡廳、室內設計、補習班"'), ["Q97"]],
  ["E29", T, s => sub(s, `class="sy-book-btn" href="${A.booking_url}"`, `class="sy-book-btn" href="${A.booking_url_old}"`), ["Q72"]],
  ["E30", T, s => sub(s, `aria-label="${A.booking_aria}"`, `aria-label="${A.booking_aria_old}"`), ["Q72"]],
  ["E31", T, s => sub(s, `<li>${A.basis_item_4}</li>\n`, ""), ["Q73", "Q98"]],
  ["E32", T, s => patchJson(s, "data-phrases", P => { P.F501060 = P.F501060.filter(x => x !== "早餐店"); P.F501030.push("早餐店"); }), ["Q88", "Q92"]],
  ["E33", T, s => sub(s, "return {code:k,tag:null};", 'return {code:k,tag:PHRASES[k]?S.phrase_tag.replace("〔說法〕",PHRASES[k][0]):null};'), ["Q69"]],
  ["E34", T, s => patchJson(s, "data-phrases", P => { P.F399040 = P.F399040.filter(x => x !== "蝦皮"); }), ["Q87", "Q91", "Q92"]],
  ["E35", T, s => sub(s, 'return cps(t).length>HINT_LEN&&(t.indexOf("業務")>=0||/[一二三四五六七八九十]+、/.test(t));', "return cps(t).length>HINT_LEN;"), ["Q20"]],
  ["E36", T, s => sub(s, "var SEP=/[\\s、,，。.．;；\\/／+＋]+/;", "var SEP=/[\\s、,，。.．;；\\/／+＋和與及]+/;"), ["Q100"]],
  ["E37", T, s => sub(s, 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);', ""), ["Q101"]],
  ["E38", T, s => sub(s, "if(r.tagged){var lg=", "if(true){var lg="), ["Q101"]],
  ["E39", T, s => sub(s, 'forms.join("」「")', 'forms.slice(0,1).join("」「")'), ["Q102"]],
  ["E40", T, s => sub(s, "var keep=via.filter(function(w){return !via.some(function(o){return o!==w&&o.indexOf(w)>=0;});});", "var keep=via.slice();"), ["Q102"]],
  ["E41", T, s => patchJson(s, "data-phrases", P => { P.H601011.push("保險經紀"); }), ["Q92", "Q103"]],
  ["E42", T, s => sub(s, ' maxlength="300"', ""), ["Q104"]],
  ["E43", T, s => sub(s, "state={q:q,rows:r.rows,all:all};", 'state={q:q,rows:r.rows,all:all};form.hidden=true;var ec=el("div","empty");ec.appendChild(el("p",null,q));results.appendChild(ec);'), ["Q105"]], // c15：頁面無組織型態，回顯卡只含輸入
  ["E44", T, s => sub(s, 'var n=el("p","empty",S.no_result);', 'document.querySelector(".sy-disclaimer").hidden=true;var n=el("p","empty",S.no_result);'), ["Q106"]],
  ["E45", T, s => sub(s, 'window.addEventListener("pageshow",resetAll);\nresetAll();', "").replace(/ autocomplete="off"/g, ""), ["Q107"]],
  ["E46", T, s => sub(s, "<title>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap">\n<title>'), ["Q78", "Q108"]],
  ["E47", T, s => { const at = s.match(/<p class="attribution" id="attribution">[\s\S]*?<\/p>\n/)[0]; return sub(sub(s, at, ""), `<p class="as-of">${A.version_line}</p>\n`, `<p class="as-of">${A.version_line}</p>\n${at}`); }, ["Q63"]],
  ["E52", T, s => sub(s, "return lit[0]||c[0]||w;", "return c[0]||w;"), ["Q102"]],
  ["E55", T, s => sub(s, "if(segs.length&&segs.every(function(t){return !!segCode(t);})){", "if(segs.length===1&&!!segCode(segs[0])){"), ["Q109"]],
  ["E56", T, s => sub(s, "if(cps(w).length>=2&&!TRIG", "if(w&&!TRIG"), ["Q110"]],
  ["E57", T, s => sub(s, "return (b.via-a.via)||(b.nh-a.nh)", "return (b.nh-a.nh)"), ["Q111", "Q128"]], // v1_8 改應抓列
  ["E58", T, s => sub(s, "if(ow.length&&ow.every(covered))supp[", "if(false)supp["), ["Q112"]],
  ["E59", T, s => sub(s, "if(PH[L][k]||EXC[", "if(PH[L][k]||false&&EXC["), ["Q113"]],
  ["E60", T, s => sub(s, "var nb=normBreaks(q),x=nb.x,zs=zonesOf(x,nb.br);", "var nb=normBreaks(q),x=nb.x,zs=[];"), ["Q114"]],
  ["E61", T, s => { const P = phrasesV1_10(); return patchJson(s, "data-phrases", () => P); }, ["Q92", "Q115"]],
  ["E62", T, s => sub(s, "var sib=ORDER.filter(function(k){return pre[", "var sib=[].filter(function(k){return pre["), ["Q116"]],
  ["E63", T, s => sub(s, "return {code:k,tag:null,sib:true};", 'return {code:k,tag:S.phrase_tag.replace("〔說法〕",""),sib:true};'), ["Q116"]],
  ["E64", T, s => sub(s, 'var h=el("h2","results-heading",S.results_heading.replace("N",String(r.rows.length)));h.id="resultsHeading";h.tabIndex=-1;results.appendChild(h);', 'var h=null;'), ["Q101", "Q117"]],
  ["E65", T, s => sub(s, "if(focusEl)focusEl.focus({preventScroll:true});", ""), ["Q117"]],
  ["E66", T, s => sub(s, "if(e.shiftKey&&!e.ctrlKey&&!e.metaKey)return;\n  e.preventDefault();\n  if(performance.now()-compEnd<100)return;\n  run();", 'if(e.ctrlKey||e.metaKey||(!e.shiftKey&&!e.altKey&&biz.value.indexOf("\\n")<0)){e.preventDefault();if(performance.now()-compEnd<100)return;run();}'), ["Q118"]],
  ["E67", T, s => sub(s, '<div><button type="submit" class="btn-primary" id="searchBtn">', oldFieldset() + '<div><button type="submit" class="btn-primary" id="searchBtn">'), ["Q42"]], // 加回組織型態之選項（回 v1_16；fieldset 取自 058fa6f 之工具頁）
  ["E68", T, s => sub(s, "  var all=r.rows.concat(r.siblings);", '  var orq=el("p","alert",' + JSON.stringify(A.org_required_old) + ');orq.id="orgRequired";orq.setAttribute("role","alert");bizMsg.appendChild(orq);return;\n  var all=r.rows.concat(r.siblings);'), ["Q42", "Q44", "Q119"]], // 未選組織型態即顯示 org_required_old 且不產生候選（回 v1_16；頁面無選項，故一律顯示）
  ["E69", T, s => sub(s, 'syncMax();syncStale();});', 'syncMax();});'), ["Q120"]],
  ["E70", T, s => sub(s, "scrollAfter(scrollEl,all.length?h:null);", 'var t0=results.firstElementChild;if(t0){t0.scrollIntoView({block:"start"});var fc=results.querySelector(".cand-head");if(fc&&fc.getBoundingClientRect().bottom>window.innerHeight)fc.scrollIntoView({block:"center"});}'), ["Q121"]],
  ["E71", T, s => sub(s, ` aria-label="${A.signature}${A.new_window_suffix}"`, ""), ["Q122"]],
  ["E72", T, s => sub(s, `>${LICENSE}</a>）`, `>${LICENSE}</a> ）`), ["Q63", "Q123"]],
  ["E73", T, s => sub(s, "var SEP=/[\\s、,，。.．;；\\/／+＋]+/;", "var SEP=/[\\s、,，。．;；\\/／+＋]+/;"), ["Q124"]],
  ["E74", T, s => sub(sub(s, 'return cps(t).length>HINT_LEN&&(t.indexOf("業務")>=0||/[一二三四五六七八九十]+、/.test(t));', "return cps(t).length>HINT_LEN;"), "if(oldHint(q)){", "if(oldHint(q)&&!r.tagged){"), ["Q20"]],
  ["E75", T, s => sub(s, 'var d=document.querySelector("details.basis");if(d)d.open=false;', ""), ["Q107"]],
  ["E76", T, s => sub(s, "@media print{.btn-primary,.sy-book-row,", "@media print{.sy-book-row,"), ["Q125"]], // c12：補丁依分列後之原文改寫；c19：列印規則增 .sy-book-row、.sy-view-all，依 c19 原文改寫（義不變：不隱藏查詢鈕）
  // v1_8 新增
  ["E77", T, s => patchJson(s, "data-phrases", P => { if (!P.F501030.includes("茶飲")) throw new Error("F501030 無「茶飲」"); P.F501030 = P.F501030.filter(x => x !== "茶飲"); }), ["Q93", "Q92", "Q128"]],
  ["E78", T, s => sub(s, "return (b.via-a.via)||(b.nh-a.nh)||(b.tot-a.tot)||", "return (b.via-a.via)||(b.tot-a.tot)||(b.nh-a.nh)||"), ["Q111", "Q128"]],
  ["E79", T, s => sub(s, ":root{" + fontStack(s) + ";", ":root{" + fontStack(c10Tool()) + ";"), ["Q129"]],
  // E80「補列改依說法表代碼之順序（不依字母序）」：補列依說法表對到之得分列（頁面順序）逐一取其同類代碼，同一類內仍依字母序
  ["E80", T, s => sub(s, "var sib=ORDER.filter(function(k){return pre[k.slice(0,4)]&&!scored[k];}).map(", "var sib=[];rows.forEach(function(r){if(r.via)ORDER.forEach(function(k){if(k.slice(0,4)===r.code.slice(0,4)&&!scored[k]&&sib.indexOf(k)<0)sib.push(k);});});sib=sib.map("), ["Q116", "Q128"]],
  // v1_9 新增（E81～E104）
  ["E81", T, s => patchJson(s, "data-excepts", X => { X.push(pairV1_12(58)); }), ["Q112", "Q128", "Q132"]],
  ["E82", T, s => patchJson(s, "data-excepts", X => { X.push(pairV1_12(66)); }), ["Q112", "Q128"]],
  ["E83", T, s => patchJson(s, "data-phrases", P => { if (P.F399040.includes("網路平台")) throw new Error("F399040 已有「網路平台」"); P.F399040.push("網路平台"); }), ["Q115", "Q92"]], // v1_10：刪 Q112
  ["E84", T, s => sub(s, "if(/\\s/.test(ch)){br[x.length]=true;return;}", "if(ch===\"\\n\"||ch===\"\\r\"){br[x.length]=true;return;}\n    if(/\\s/.test(ch))return;"), ["Q114", "Q128", "Q132"]],
  ["E85", T, s => sub(s, "&&!TRIG.some(function(g){return w.indexOf(g)===0;})", ""), ["Q114", "Q128", "Q132"]],
  ["E86", T, s => sub(s, '  if(!segs.length||!/[\\p{L}\\p{N}]/u.test(nfkc(q)))return {mode:"empty",rows:[],siblings:[],missing:[],tagged:false};\n', ""), ["Q130"]], // c12：空白判定為同一句
  ["E87", T, s => sub(s, 'S.results_heading.replace("N",String(r.rows.length))', 'S.results_heading.replace("N",String(all.length))'), ["Q101", "Q116", "Q117", "Q128"]],
  ["E88", T, s => sub(s, '\n  if(row.sib)a.appendChild(el("span","sib-tag",S.sibling_tag));', ""), ["Q116"]],
  ["E89", T, s => sub(s, 'var sn=el("p","sib-note",S.sibling_note);sn.id="siblingNote";box.appendChild(sn);', ""), ["Q116"]],
  ["E90", T, s => sub(s, 'var sh=el("h3","sib-heading",S.sibling_heading);', 'var sh=el("p","sib-heading",S.sibling_heading);'), ["Q116"]],
  ["E91", T, s => sub(s, 'var x=showRows(results.querySelectorAll(".cand").length,state.all.length);b.replaceWith(x.frag);if(x.first)x.first.focus({preventScroll:false});',
    'var n0=results.querySelectorAll(".cand").length;var x=showRows(n0,state.all.length);b.replaceWith(x.frag);var c0=results.querySelectorAll(".cand")[n0];if(c0)c0.focus({preventScroll:false});'), ["Q116"]],
  ["E92", T, s => sub(s, 'h.id="staleHint";h.setAttribute("role","status");', 'h.id="staleHint";'), ["Q120"]],
  ["E93", T, s => sub(s, "\n  else if(!stale&&cur)cur.remove();", ""), ["Q120"]],
  ["E94", T, s => sub(s, "  if(head){window.scrollTo(0,Math.max(0,Math.floor(pageTop(head))));if(fullyVisible(target))return;}\n", ""), ["Q121"]],
  ["E95", T, s => sub(sub(s, "window.scrollBy(0,Math.ceil(r.bottom-window.innerHeight));", "window.scrollBy(0,-Math.ceil(r.bottom-window.innerHeight));"), "else if(r.top<0)window.scrollBy(0,Math.floor(r.top));", "else if(r.top<0)window.scrollBy(0,-Math.floor(r.top));"), ["Q121"]],
  ["E96", T, s => sub(s, "\n  if(performance.now()-compEnd<100)return;", ""), ["Q118"]],
  ["E97", T, s => sub(s, "  return a;\n}", "  if((RESTR[row.code]||[]).some(function(r){return " + JSON.stringify(OLD_NO_ORG_LIMIT) + ".indexOf(r.no)<0;}))a.appendChild(el(\"p\",\"flag flag-sub org-undecided\"," + JSON.stringify(A.org_undecided_note_old) + "));\n  return a;\n}"), ["Q43"]], // 帶組織型態限制之代碼附 org_undecided_note_old（回 v1_16 之未定）
  ["E98", T, s => sub(s, 'focusEl=h;scrollEl=results.querySelector(".cand-head");', 'focusEl=focusEl||h;scrollEl=results.querySelector(".cand-head");'), ["Q117"]],
  ["E99", T, s => sub(s, "if(segs.length&&segs.every(function(t){return !!segCode(t);})){\n    var seen=[];segs.forEach(function(t){var k=segCode(t);",
    "if(segs.length&&segs.some(function(t){return !!segCode(t);})){\n    var seen=[];segs.forEach(function(t){var k=segCode(t)||norm(t).toUpperCase();"), ["Q109"]],
  ["E100", T, s => sub(s, "results.appendChild(showRows(0,Math.min(SHOW_FIRST,all.length)).frag);", 'results.appendChild(showRows(0,Math.min(SHOW_FIRST,all.length)).frag);if(!r.siblings.length&&r.mode==="text"){var e0=el("h3","sib-heading",S.sibling_heading);e0.tabIndex=-1;results.appendChild(e0);}'), ["Q116"]],
  ["E101", T, s => sub(s, "return pre[k.slice(0,4)]&&!scored[k];", "return pre[k.slice(0,4)];"), ["Q116", "Q128"]],
  ["E102", T, s => sub(s, "    var c=card(r);box.appendChild(c);if(!first)first=c;", "    var c=card(r);if(r.sib&&i===state.rows.length&&sh)box.insertBefore(c,sh);else box.appendChild(c);if(!first)first=c;"), ["Q116"]],
  ["E103", T, s => sub(s, 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);', 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);results.querySelectorAll(".code-not-found").forEach(function(n){results.insertBefore(n,cn);});'), ["Q109"]],
  ["E104", T, s => sub(s, "  if(performance.now()-compEnd<100)return;\n  run();", "  if(performance.now()-compEnd<100)return;"), ["Q44", "Q119"]], // 業務描述欄內按 Enter 不送出
  // v1_11 新增（E105～E111；各回 v1_13 之一處）
  ["E105", T, s => sub(s, "(br[j]&&j!==o[1]&&!adj)", "(br[j]&&!adj)"), ["Q114", "Q128", "Q132"]], // c16：補丁依含斜線、加號條件之原文改寫（只刪「起始字後緊接之空白略過」）
  ["E106", T, s => sub(s, "&&occ(x,w).some(function(o){return !overlaps(o,zs);})){typed[w]=true;", "){typed[w]=true;"), ["Q114", "Q128", "Q132"]],
  ["E107", T, s => sub(s, "(r.siblings.length?S.show_all_btn_sib:S.show_all_btn)", "S.show_all_btn"), ["Q116"]],
  ["E108", T, s => sub(s, "@media print{.btn-primary,.sy-book-row,.sy-book-btn,.sy-view-all{display:none}}", "@media print{fieldset:not(:has(input:checked)),.btn-primary,.sy-book-row,.sy-book-btn,.sy-view-all{display:none}}"), ["Q125"]], // c19 依原文改寫 // 隱藏查詢鈕之規則與 :has() 合列（回 v1_13 之合列；c15 頁面已無組織型態，合列之 :has() 選擇器照 v1_13 原文之一）
  ["E109", T, s => sub(s, '    if(r.sib){\n      if(!sec){sec=el("section","sib-section");sec.id="siblingSection";sec.setAttribute("aria-labelledby","siblingHeading");frag.appendChild(sec);}\n      box=sec;\n    }\n', ""), ["Q116"]],
  ["E110", T, s => sub(s, "||!/[\\p{L}\\p{N}]/u.test(nfkc(q))", ""), ["Q130", "Q128", "Q132"]],
  ["E111", T, s => sub(s, 'focusEl=h;scrollEl=results.querySelector(".cand-head");', 'focusEl=results.querySelector(".cand");scrollEl=results.querySelector(".cand-head");'), ["Q44", "Q119"]], // 查詢後焦點不移至 results_heading（改移至第一張卡）
  // v1_12 新增（E112～E118）
  // E112（v1_13 改寫；v1_12 之 E112 為其反向）：斜線、加號為客戶位置之終點（回 v1_15）
  ["E112", T, s => sub(s, 'var ZONE_END=",，。;；.．!！?？";', 'var ZONE_END=",，。;；.．!！?？/／+＋";'), ["Q114", "Q128", "Q132", "Q134"]],
  ["E113", T, s => sub(s, "if(r.zoneHint){", "if(false){"), ["Q134"]],
  // E114：得分列不為 0、或無延伸至句末之客戶位置時亦顯示 zone_hint（文字比對一律顯示；有候選時置於候選區頂端之 candidate_notice 之後）
  ["E114", T, s => sub(sub(s, ZH_C16, "  var zh=true;"),
    'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);', 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);if(r.zoneHint){var z2=el("p","zone-hint",S.zone_hint);z2.id="zoneHint";results.appendChild(z2);}'), ["Q134", "Q132"]],
  ["E115", T, s => sub(s, 'zh.id="zoneHint";results.appendChild(zh);', 'zh.id="zoneHint";results.insertBefore(zh,n);'), ["Q134"]],
  ["E116", T, s => sub(s, ".sib-section{display:flex;flex-direction:column;gap:16px}", ".sib-section{display:flex;flex-direction:column;gap:16px;border:1px solid var(--stone-300);border-radius:10px;padding:12px}"), ["Q116"]],
  ["E117", T, s => sub(s, "||!/[\\p{L}\\p{N}]/u.test(nfkc(q))", "||!/[\\p{L}\\p{N}]/u.test(q)"), ["Q130"]],
  ["E118", T, s => sub(s, "&&occ(x,w).some(function(o){return !overlaps(o,zs);})){typed[w]=true;", "&&occ(x,w).every(function(o){return !overlaps(o,zs);})){typed[w]=true;"), ["Q114", "Q128", "Q132"]],
  // v1_13 新增（E119～E128）
  ["E119", T, s => sub(s, ZH_C16, "  var zh=!rows.length&&zs.some(function(z){return z[1]>z[0]&&z[1]===x.length;});"), ["Q134", "Q132"]], // 終點之後只有終點符號者不視同句末（回 v1_15）
  ["E120", T, s => patchJson(s, "data-str", o => { o.zone_hint = zoneHintV1_15(); }), ["Q134"]], // zone_hint 用 v1_15 之字樣（自 tools 3624af9 之工具頁內嵌字樣取出，SHA-256 核對）
  ["E121", T, s => sub(s, 'zh.id="zoneHint";results.appendChild(zh);', 'zh.id="zoneHint";zh.tabIndex=-1;results.appendChild(zh);focusEl=zh;'), ["Q134"]], // 焦點移至 zone_hint（D12）
  ["E122", T, s => sub(s, ".zone-hint{margin:-6px 0 0;padding:0 16px;font-size:15px;color:var(--graphite-700)}", ".zone-hint{margin:-6px 0 0;padding:0 16px;font-size:15px;color:var(--graphite-700);white-space:nowrap}"), ["Q134"]], // D13
  ["E123", T, s => sub(s, 'if(!sec){sec=el("section","sib-section");sec.id="siblingSection";sec.setAttribute("aria-labelledby","siblingHeading");frag.appendChild(sec);}',
    'if(!sec){sec=el("section","sib-section");sec.id="siblingSection";sec.setAttribute("aria-labelledby","siblingHeading");var wr=el("div","sib-wrap");wr.style.cssText="border:1px solid #d4d0c8;padding:12px;border-radius:10px";wr.appendChild(sec);frag.appendChild(wr);}'), ["Q116"]], // 補列 section 外再包一層有框線與內距之元素（D16）
  ["E124", T, s => sub(s, 'n.setAttribute("role","status");n.tabIndex=-1;results.appendChild(n);if(!focusEl)focusEl=n;});',
    'n.setAttribute("role","status");n.tabIndex=-1;results.appendChild(n);if(!focusEl)focusEl=n;});if(r.missing.length){var z3=el("p","zone-hint",S.zone_hint);z3.id="zoneHint";results.appendChild(z3);}'), ["Q134"]], // 代碼直查查無時亦顯示 zone_hint（D05）
  ["E125", T, s => sub(s, ZH_C16, "  var zh=!rows.length&&zs.some(function(z){return cps(x.slice(z[1])).every(function(c){return ZONE_END.indexOf(c)>=0||CLOSERS.indexOf(c)>=0;});});"), ["Q134", "Q132"]], // 不檢查客戶位置不為空（D02）
  ["E126", T, s => sub(s, ZH_C16, "  var zh=!rows.length&&zs.some(function(z){return z[1]>z[0];});"), ["Q134"]], // 不檢查延伸至句末（D04）
  ["E127", T, s => sub(s, ZH_C16, ZH_C16.replace("var zh=!rows.length&&", "var zh=!rows.length&&!/\\s$/.test(nfkc(q))&&")), ["Q134"]], // 句末空白視為客戶位置之終點（D09；終點為空白者其後非「無字或只有終點符號」之延伸，故不顯示）
  ["E128", T, s => sub(s, ".zone-hint{margin:-6px 0 0;padding:0 16px;font-size:15px;color:var(--graphite-700)}", ".zone-hint{margin:-6px 0 0;padding:0 16px;font-size:15px;color:var(--graphite-700);border:1px solid var(--stone-300);border-radius:10px}"), ["Q134"]], // zone_hint 加框線
  // v1_14 新增（E129）
  ["E129", T, s => patchJson(s, "data-str", o => { o.zone_hint = zoneHintV1_16(); }), ["Q134"]], // zone_hint 用 v1_16 之字樣（自 tools 058fa6f 之工具頁內嵌字樣取出，SHA-256 核對）
  // v1_15 新增（E130～E141）
  ["E130", T, s => sub(s, '<div><button type="submit" class="btn-primary" id="searchBtn">', `<p class="hint">${A.org_options_old}</p>\n<div><button type="submit" class="btn-primary" id="searchBtn">`), ["Q42"]], // 畫面以一般文字段落顯示 org_options_old（無 radio）
  ["E131", T, s => patchJson(s, "data-str", o => { o.org_required_old = A.org_required_old; }), ["Q42"]], // 內嵌資料殘留 org_required_old 而畫面不顯示（Q42 四）
  ["E132", T, s => sub(s, '<script type="application/json" id="data-excepts">', dataOrgBlock() + '<script type="application/json" id="data-excepts">'), ["Q42"]], // 植入 3624af9 之 data-org 區塊（原樣，不改可見字樣；Q42 四）
  ["E133", T, s => patchPlain(s, P => forCat(P, "14", "plain_co")), ["Q84", "Q43"]], // 第十四類附 plain_co（c17：補丁改依 PLAIN_BY_CODE）
  ["E134", T, s => patchPlain(s, P => forCat(P, "9", "plain_co")), ["Q84"]], // 第九類亦附白話說明（plain_co）（c17：補丁改依 PLAIN_BY_CODE）
  ["E135", T, s => patchPlain(s, P => { P.HZ07011.per_cat["5"] = "plain_sa"; }), ["Q43"]], // HZ07011 只附一類（第五類）（c17：補丁改依 PLAIN_BY_CODE；第五類附依類別之說明）之白話說明
  ["E136", T, s => sub(s, ".plain-note{font-weight:400}", ".plain-note{font-weight:700}"), ["Q84"]], // 白話說明加粗
  ["E137", T, s => sub(s, 'var rn=el("p","notice",S.register_note);rn.id="registerNote";results.appendChild(rn);', ""), ["Q135"]], // 刪除 register_note
  ["E138", T, s => sub(s, 'var rn=el("p","notice",S.register_note);rn.id="registerNote";results.appendChild(rn);', 'if(r.mode!=="code"){var rn=el("p","notice",S.register_note);rn.id="registerNote";results.appendChild(rn);}'), ["Q135"]], // 代碼直查不顯示 register_note
  ["E139", T, s => sub(s, "(br[j]&&j!==o[1]&&!adj)", "(br[j]&&j!==o[1])"), ["Q114", "Q128", "Q132", "Q134"]], // 斜線、加號旁之空白仍為終點（回 v1_17）
  ["E140", T, s => sub(s, ZH_C16, ZH_C14), ["Q134", "Q132"]], // 右括號、右引號不視同終點符號（回 v1_17）
  ["E141", T, s => patchJson(s, "data-str", o => { o.zone_hint = zoneHintV1_17(); }), ["Q134"]], // zone_hint 用 v1_17 之字樣（自 tools fcba277 之工具頁內嵌字樣取出，SHA-256 核對）
  // v1_16 新增（E142～E155）
  ["E142", T, s => sub(s, "/* 第八節規則 2 之二（v1_19）：白話說明逐代碼決定", "/* 第八節規則 2 之二（v1_18）：白話說明逐代碼決定"), ["Q01"]], // 手工改動 index.html 一字（不經 build.py）
  ["E143", T, s => sub(s, '<script type="application/json" id="data-str">', '<template><p>測試用之樣板內容</p></template>\n<script type="application/json" id="data-str">'), ["Q42"]], // 加 template 元素
  ["E144", T, s => sub(s, '<script type="application/json" id="data-str">', '<script>[]</script>\n<script type="application/json" id="data-str">'), ["Q42"]], // 加無 type 之 script 元素（空陣列字面）
  ["E145", T, s => sub(sub(s, "S.plain_label+S[pk]", "S[pk]"), "S.plain_label+S[pc.dual]", "S[pc.dual]"), ["Q84", "Q136", "Q43"]], // 白話說明不加 plain_label
  ["E146", T, s => sub(sub(s, '    if(pk)f.appendChild(el("p","flag-sub plain-note",S.plain_label+S[pk]));\n', ""),
    '    f.appendChild(el("p","flag-sub restriction-note",S.restriction_note));\n', '    f.appendChild(el("p","flag-sub restriction-note",S.restriction_note));\n    if(pk)f.appendChild(el("p","flag-sub plain-note",S.plain_label+S[pk]));\n'), ["Q84", "Q136"]], // 白話說明移到括號註記與 restriction_note 之後
  ["E147", T, s => patchPlain(s, P => forCat(P, "8", "plain_co")), ["Q84", "Q136"]], // 第八類附 plain_co
  ["E148", T, s => patchPlain(s, P => { for (const k of E.plain_cond) { const n = Object.keys(P[k].per_cat)[0]; P[k].per_cat[n] = plainOf(Number(n)).key; } }), ["Q136"]], // 五碼仍依類別附 plain_sa、plain_co
  ["E149", T, s => patchPlain(s, P => { P.HZ07011.per_cat = { "5": plainOf(5).key, "7": plainOf(7).key }; P.HZ07011.dual = null; }), ["Q12", "Q136"]], // HZ07011 兩類之下各附依類別之白話說明，不附 plain_dual
  ["E150", T, s => sub(s, 'if(pc&&pc.dual)a.appendChild(el("p","flag flag-sub dual-note plain-note",S.plain_label+S[pc.dual]));', 'if(pc&&pc.dual)a.appendChild(el("p","flag flag-sub dual-note",' + JSON.stringify(A.dual_category_note_old) + '));'), ["Q12", "Q42"]], // HZ07011 附 dual_category_note_old（回 v1_18）
  ["E151", T, s => patchJson(s, "data-str", o => { o.plain_co_biz = plainCoBizV1_18(); }), ["Q84", "Q136"]], // plain_co_biz 用 v1_18 之字樣（自 tools 2b6e7f0 之工具頁取出，SHA-256 核對）
  ["E152", T, s => sub(s, `<li>${A.basis_item_4}</li>`, `<li>${basisItem4V1_18()}</li>`), ["Q73", "Q98", "Q136"]], // basis_item_4 用 v1_18 之字樣（自 tools 2b6e7f0 之工具頁取出）
  ["E153", T, s => sub(s, s.match(/var CLOSERS=[^\n]*;/)[0], closersV1_18()), ["Q134", "Q132"]], // 右引號不含「”」「’」「"」「'」（回 v1_18；CLOSERS 自 tools 2b6e7f0 之工具頁取出）
  ["E154", T, s => sub(s, ".zone-hint{margin:-6px 0 0;", ".zone-hint{margin:0 0 0;"), ["Q134"]], // zone_hint 之上緣負邊距改為 0
  ["E155", "self", s => s, ["Q107"]], // 驗證程式自檢（判定方式二十七；v1_17 判準文字）：令完整 Chromium 啟用往返快取之設定啟動失敗（頁面不改）；抓到＝該設定之判定為未執行且錯誤訊息含「判定方式二十七之自檢」
  // v1_17 新增（E156～E161）
  ["E156", B, s => sub(s, '    print("建置停止（規格第八節規則 2 之二（6））：" + "；".join(lines), file=sys.stderr)', '    with open(OUT_HTML, "a", encoding="utf-8", newline="\\n") as f:\n        f.write("\\n<!-- 建置停止時仍寫入 -->\\n")\n    print("建置停止（規格第八節規則 2 之二（6））：" + "；".join(lines), file=sys.stderr)'), ["Q137"]], // 建置停止時仍寫 index.html
  ["E157", B, s => sub(s, 'STOP_NOTE = "現存之 index.html 為前次建置之輸出，不是本次結果。"', 'STOP_NOTE = ""'), ["Q137"]], // 建置停止時不註明 STOP_NOTE（報告與錯誤訊息）
  ["E158", B, s => sub(s, '    stop += [f"- {k}：（3）名單之代碼列於兩類（{in_list[k]}）" for k in multi if k in PLAIN_COND]\n', ""), ["Q137"]], // （3）名單之代碼列於兩類時不停止（依（5）附 plain_dual）
  ["E159", T, s => patchPlain(s, P => { if (!P.D201011 || P.D201011.per_cat["5"] !== "plain_cond") throw new Error("PLAIN_BY_CODE 之 D201011 不是 plain_cond"); P.D201011.per_cat["5"] = "plain_sa"; }), ["Q136"]], // D201011 仍附 plain_sa（回 v1_19）
  ["E160", T, s => { const m = s.match(/var CLOSERS="([^\n]*)";/); if (!m) throw new Error("找不到 CLOSERS"); return sub(s, m[0], 'var CLOSERS="' + m[1] + '\u201c\u2018";'); }, ["Q134"]], // 右引號集合誤含左彎引號「“」「‘」
  ["E161", T, s => sub(s, 'var d=document.querySelector("details.basis");if(d)d.open=false;', ""), ["Q107"], { failFull: true, check28: true }], // 驗證程式自檢（判定方式二十八）：E75 之補丁加完整 Chromium 啟用往返快取之設定啟動失敗；抓到＝E75 記未執行並附錯誤訊息（不記未抓到）
  // c19（驗證表 v1_18）：E162～E171
  ["E162", T, s => sub(s, `<p class="sy-disclaimer">${A.shell_disclaimer}</p>`, `<p class="sy-disclaimer">${A.disclaimer_old}</p>`), ["Q70", "Q42", "Q138"]], // 頁尾免責回舊長版（回 v1_17）
  ["E163", T, s => sub(s, `<summary>${A.shell_basis_title}</summary>`, `<summary>${A.basis_title_old}</summary>`), ["Q73", "Q138"]], // 頁尾收合列之 summary 回 basis_title_old
  ["E164", T, s => sub(s, `<p class="sy-privacy" id="shellPrivacy">${A.shell_privacy}</p>\n`, ""), ["Q78", "Q138"]], // 刪除隱私句
  ["E165", T, s => sub(sub(s, `${A.booking}<span aria-hidden="true">↗</span></a><a class="sy-view-all"`, `${A.booking}</a><a class="sy-view-all"`), "</style>", '.sy-book-btn::after{content:"\\2197"}\n</style>'), ["Q72"]], // 預約之 ↗ 改以 ::after 呈現（回 v1_17）
  ["E166", T, s => sub(s, `<a class="sy-view-all" href="${A.view_all_url}" target="_blank" rel="noopener noreferrer" aria-label="${A.view_all_aria}">${A.view_all}<span aria-hidden="true">↗</span></a>`, ""), ["Q70", "Q138"]], // 刪除看全部工具
  ["E167", T, s => sub(s, "@media print{.btn-primary,.sy-book-row,.sy-book-btn,.sy-view-all{display:none}}", "@media print{.btn-primary,.sy-book-btn{display:none}}"), ["Q125"]], // 列印時看全部工具照印
  ["E168", B, s => sub(s, "for k in multi if in_list[k] != PLAIN_DUAL_CATS]", "for k in multi if in_list[k] != PLAIN_DUAL_CATS and len(set(in_list[k])) == 1]"), ["Q137"]], // 非第五、七類之兩個不同類別不停止（[2, 9]）
  ["E169", B, s => sub(s, "    multi = sorted(k for k in list_codes if sum(1 for _, x in occ if x == k) > 1)", "    multi = sorted(k for k in list_codes if len({n for n, x in occ if x == k}) > 1)"), ["Q137"]], // 以集合去重判多類（[9, 9] 不停止）
  ["E170", B, s => sub(s, "    if any(a == \"--test-inject\" and (i + 1 >= len(argv) or argv[i + 1].startswith(\"--\")) for i, a in enumerate(argv)):\n        abort(", "    if False:\n        abort(").replace("    inject = [argv[i + 1] for i, a in enumerate(argv) if a == \"--test-inject\"]", "    inject = [argv[i + 1] for i, a in enumerate(argv) if a == \"--test-inject\" and i + 1 < len(argv)]"), ["Q137"]], // 注入參數無值時照常建置並寫 index.html（回 v1_20 之 build.py）
  ["E171", B, s => sub(s, "    if injected:\n        abort(\"測試注入未觸發", "    if injected:\n        print(\"建置中止：測試注入未觸發規則 2 之二（6）之建置停止\", file=sys.stderr); sys.exit(2)\n        abort(\"測試注入未觸發"), ["Q137"]], // 中止（注入未觸發停止）時 stderr 不附註明句
  // c20（驗證表 v1_19）新增
  ["E172", T, s => sub(sub(s, `${A.view_all}<span aria-hidden="true">↗</span></a>`, `${A.view_all}</a>`), "</style>", '.site-foot .sy-view-all::after{content:"\\2197"}\n</style>'), ["Q72", "Q138"]], // 看全部工具之 ↗ 改以 ::after 呈現（c19 第八輪 B-07）
  ["E173", T, s => sub(s, ".sy-book-row{display:flex;", ".sy-book-row{align-self:flex-start;display:flex;"), ["Q138"], // 預約列設 align-self:flex-start（c19 第八輪 G-02；外殼 Z76 之等效案）；期望 Q138 之外殼 F02 未通過，另記其他列之交叉失敗
    { must: det => { const r = (det.Q138 && det.Q138.rows) || {}; const failed = Object.keys(r).filter(k => r[k].result === "未通過");
      return { ok: !!r.F02 && r.F02.result === "未通過", F02: r.F02 ? r.F02.result : null, F02不符樣本: r.F02 && r.F02.detail && r.F02.detail.不符 ? r.F02.detail.不符.slice(0, 3) : null, 其他列之交叉失敗: failed.filter(k => k !== "F02") }; } }],
  ["E174", T, s => { const at = s.match(/<p class="attribution" id="attribution">[\s\S]*?<\/p>\n/)[0]; return sub(sub(s, at, ""), '<section id="results" aria-live="off"></section>\n', '<section id="results" aria-live="off"></section>\n' + at); }, ["Q63"]], // 顯名留在候選區之下、頁尾之前（回 v1_18）
  ["E175", T, s => { const at = s.match(/<p class="attribution" id="attribution">[\s\S]*?<\/p>\n/)[0]; return sub(sub(s, at, ""), "</ol>\n</details>", "</ol>\n" + at + "</details>"); }, ["Q63", "Q73"]], // 顯名在頁尾收合列內但置於 basis_item_4 之後
  ["E176", T, s => sub(s, 'window.addEventListener("beforeprint",function(){var d=document.querySelector("details.basis");if(!d)return;if(printOpen===null)printOpen=d.open;d.open=true;});\n', ""), ["Q125"]], // 移除 beforeprint 之處理（列印時收合列不展開，回 v1_20）
  ["E177", T, s => sub(s, 'window.addEventListener("afterprint",function(){var d=document.querySelector("details.basis");if(d&&printOpen!==null)d.open=printOpen;printOpen=null;});\n', ""), ["Q125"]], // afterprint 不回復（列印後收合列維持展開）
  // c22（驗證表 v1_22）：補丁以 c22 頁面之原字串為準
  ["E178", T, s => sub(s, "@media print{details.basis::details-content{content-visibility:visible;display:block}}\n", ""), ["Q125"]], // 刪除列印樣式中頁尾收合列 ::details-content 之備援（回 v1_21）
  ["E179", T, s => sub(s, "if(printOpen===null)printOpen=d.open;", "printOpen=d.open;"), ["Q125"]], // 刪除 beforeprint 之 printOpen===null 守門（連續列印時覆寫列印前之狀態）
  ["E180", T, s => sub(s, "d.open=printOpen;printOpen=null;});", "d.open=printOpen;});"), ["Q125"]], // 刪除 afterprint 末之 printOpen=null（第二次列印回復為陳舊之狀態）
  ["E181", T, s => sub(s, "if(d)d.open=false;printOpen=null;", "if(d)d.open=false;"), ["Q125"]], // pageshow 之重設不清除 printOpen（回 v1_21）
  ["E182", T, s => sub(s, "if(printOpen===null)printOpen=d.open;d.open=true;});", 'if(printOpen===null)printOpen=d.open;d.open=true;localStorage.setItem("e182","1");});'), ["Q125"]], // beforeprint 時寫入 localStorage 一筆
  ["E183", T, s => sub(s, "@media print{details.basis::details-content{content-visibility:visible;display:block}}\n", "details.basis::details-content{content-visibility:visible;display:block}\n"), ["Q125"]], // 頁尾收合列 ::details-content 之備援改為不限列印媒體（螢幕上收合時亦繪出內文）
  // 補充刻意錯誤（驗證表 E 列未涵蓋之可程式判定列，各至少一個；沿用 v1_6 執行之 X01～X21，補丁依 c10 之頁面改寫）
  ["X01", B, s => sub(s, 'with open(OUT_REPORT, "w", encoding="utf-8", newline="\\n") as f:\n        f.write("\\n".join(rep))\n    return 0', "pass\n    return 0"), ["Q01"]], // c17：build.py 另有建置停止之報告寫入（plain_stop），原字串加「return 0」以唯一定位
  ["X02", B, s => sub(s, "    if missing or len(head) != len(HEAD):", "    head = HEAD\n    if False:"), ["Q02"]],
  ["X03", B, s => sub(s, "    if not no_hash:\n        bad =", "    if False:\n        bad ="), ["Q03"]],
  ["X04", B, s => sub(s, "    if dup:", "    if False:"), ["Q04"]],
  ["X05", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 10).items.find(i => i.code === "J701010").note = ""; }), ["Q07"]],
  ["X06", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 5).items = L2.find(c => c.no === 5).items.filter(i => i.code !== "F112010"); }), ["Q08"]], // c15 改寫：原改衝突對照表
  ["X07", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 14).items = L2.find(c => c.no === 14).items.filter(i => i.code !== "J905010"); }), ["Q09", "Q15"]], // c15 改寫
  ["X08", T, s => sub(s, "if(/1$/.test(row.code)){", "if(/1$/.test(row.code)&&!RESTR[row.code]){"), ["Q10"]],
  ["X09", T, s => sub(s, 'a.appendChild(el("p","cand-def",e.def));', 'a.appendChild(el("p","cand-def",e.def));if(!(RESTR[row.code]||[]).length)a.appendChild(el("p","flag",S.restriction_note));'), ["Q11"]],
  ["X10", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 1).items = L2.find(c => c.no === 1).items.filter(i => i.code !== "H101021"); }), ["Q14"]], // c15 改寫
  ["X11", T, s => sub(s, 'a.appendChild(el("p","flag flag-sub zz-not-alone",S.zz_not_alone));', ""), ["Q16"]],
  ["X12", T, s => sub(s, "<title>", "<!-- https://data.gcis.nat.gov.tw/od/data/api/xxxx -->\n<title>"), ["Q40"]],
  ["X13", T, s => sub(s, '<div><button type="submit" class="btn-primary" id="searchBtn">', '<fieldset hidden></fieldset>\n<div><button type="submit" class="btn-primary" id="searchBtn">'), ["Q42"]], // c15 改寫：頁面留有空 fieldset
  ["X14", T, s => sub(s, 'if(pc&&pc.dual)a.appendChild(el("p","flag flag-sub dual-note plain-note",S.plain_label+S[pc.dual]));', ""), ["Q43"]], // c17 改寫：兩類並列不附 plain_dual
  ["X15", T, s => sub(s, '<p class="attribution" id="attribution">', '<img src="https://www.moea.gov.tw/logo.png" alt="" width="1" height="1">\n<p class="attribution" id="attribution">'), ["Q65"]],
  ["X16", T, s => patchJson(s, "data-codes", C => C.filter(r => r[0] !== "D101101")), ["Q67"]],
  ["X17", T, s => sub(s, `<a class="sig" href="${A.signature_url}" target="_blank"`, `<a class="sig" href="${A.signature_url}"`), ["Q71"]],
  ["X18", T, s => sub(s, '<p class="attribution" id="attribution">', '<div style="width:1400px;height:1px"></div>\n<p class="attribution" id="attribution">'), ["Q76"]],
  ["X19", T, s => sub(s, "scrollAfter(scrollEl,all.length?h:null);", ""), ["Q77"]],
  ["X20", T, s => sub(s, "return (b.via-a.via)||(b.nh-a.nh)||(b.tot-a.tot)||", "return (b.via-a.via)||(b.tot-a.tot)||"), ["Q79"]],
  ["X21", T, s => sub(s, "var SHOW_FIRST=30,", "var SHOW_FIRST=100000,"), ["Q85"]],
];
// 改版前之版本所跑之列（c22）：派工指定 Q125（判定方式三十五所涉之列）；c21 時為 fb163dd 之 Q125；c20b 時為 52d2f0d 之 Q106、Q122、Q125、Q138；c20 時為 64b2966 之 Q42、Q63、Q72、Q73、Q123、Q125、Q137
const PRE_ROWS = ["Q125"];
const VARIANTS_OUT_OF_SCOPE = { E48: ["D01"], E49: ["D02"], E50: ["D03"], E51: ["D05"], E53: ["D04"], E54: ["D04", "D06"] };
// Q80、Q81、Q99、Q126、Q127 為人工列。E45 刪除 pageshow 之重設、載入時之重設（本頁兩者為同一函式）與 autocomplete="off"。

/* Z76 之前提量測（c20）：1440×900 初始狀態，預約列（div.sy-book-row）之寬與其內容寬、頁尾容器（footer#siteFoot > div.wrap）之內容區寬 */
async function z76Premise(browser, url) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  try { await p.goto(url); return await p.evaluate(() => { const row = document.querySelector(".sy-book-row"), wrap = row && row.parentElement; if (!row) return null;
      const kids = [...row.children].map(e => e.getBoundingClientRect()); const cw = kids.length ? Math.max(...kids.map(r => r.right)) - Math.min(...kids.map(r => r.left)) : 0;
      const ws = getComputedStyle(wrap); const wrapContent = wrap.clientWidth - parseFloat(ws.paddingLeft) - parseFloat(ws.paddingRight);
      return { 預約列寬: row.getBoundingClientRect().width, 預約列內容寬: cw, 頁尾容器內容區寬: wrapContent, 前提成立: cw < wrapContent, 預約列_justify_content: getComputedStyle(row).justifyContent }; });
  } finally { await c.close(); }
}

/* ───────── 執行 ───────── */
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", () => { PORT = server.address().port; r(); }));
  let browser = null, launchError = null;
  try { browser = await chromium.launch({ timeout: 120000 }); } catch (e) { launchError = String(e && e.message || e).split("\n")[0]; console.log("瀏覽器無法啟動：", launchError); }
  const ctx = new Ctx(browser, launchError);
  fs.mkdirSync(path.join(VERIFY, "screenshots"), { recursive: true });
  const toolSrc = fs.readFileSync(path.join(TOOL, "index.html"), "utf8");
  // v1_16（Q01）：受驗 commit 中之 business-items/index.html（git cat-file 自 HEAD 取出）；與工作區不同者，受驗頁改用 HEAD 之檔並記錄
  let headSrc = null; try { headSrc = execFileSync("git", ["-C", REPO, "cat-file", "-p", "HEAD:business-items/index.html"], { encoding: "utf8", maxBuffer: 1 << 26 }); } catch (e) { headSrc = null; }
  const headMatchesWorktree = headSrc !== null && headSrc === toolSrc;
  const headCommit = (() => { try { return execFileSync("git", ["-C", REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch (e) { return null; } })();
  const report = fs.readFileSync(path.join(BUILD, "build_report.md"), "utf8");
  const baseEnv = { src: { tool: toolSrc }, srcOrigin: headMatchesWorktree ? `HEAD（${headCommit}）:business-items/index.html（與工作區逐位元組相同）` : "工作區 business-items/index.html（與 HEAD 之檔不同或 HEAD 無此檔）", report, buildPy: path.join(BUILD, "build.py"), patchBuild: null };
  const urls = { tool: publish("main", toolSrc) };
  { let s0 = null; try { s0 = baseTool(); } catch (e) { } if (s0) urls.base = publish("base_" + BASE_COMMIT, s0); } // Q138 之比對基準（a47269e）
  // c20b（判定方式三十二）：外殼 F10、X06 之基準頁，由 make_base32.py 自 a47269e 之 git blob 產生
  try { const f = path.join(TMP, "base32.html"); const o = execFileSync("python3", ["-I", path.join(VERIFY, "make_base32.py"), REPO, f], { encoding: "utf8" }); BASE32 = JSON.parse(o.trim()); urls.base32 = publish("base32_" + BASE_COMMIT, fs.readFileSync(f, "utf8")); }
  catch (e) { BASE32 = { error: String(e && e.message || e).split("\n")[0] }; }
  console.log("判定方式三十二之基準頁：", JSON.stringify(BASE32));
  // Q138（P06）：Firefox 先實測能否執行
  try { const ff = await pw.firefox.launch({ timeout: 60000 }); FF_LAUNCH = { ok: true, version: ff.version() }; await ff.close(); } catch (e) { FF_LAUNCH = { ok: false, error: String(e && e.message || e).split("\n")[0] }; }
  console.log("Firefox：", JSON.stringify(FF_LAUNCH));
  baseEnv.q138Shots = path.join(VERIFY, "results", "外殼v1_2_L05截圖"); fs.mkdirSync(baseEnv.q138Shots, { recursive: true }); baseEnv.q138ShotTag = "c22"; // L05 之聚焦截圖另存（Q81 之截圖張數不增）
  async function runRow(id, u, env) {
    if (MANUAL[id]) return { result: "未執行", detail: MANUAL[id] };
    try { const r = await R[id](ctx, u, env); const res = r.ok === null ? "未執行" : r.ok ? "通過" : "未通過"; return { result: res, detail: r.detail, launchFailure: res === "未執行" && !!r.launchFailure, launchFailureSettings: r.launchFailureSettings }; }
    catch (e) {
      const msg = String(e && e.message || e).split("\n")[0];
      if (e instanceof LaunchError || LAUNCH_RE.test(msg)) return { result: "未執行", detail: "判定方式二十五：瀏覽器無法啟動，記未執行；錯誤訊息：" + msg, launchFailure: true };
      return { result: "未通過", detail: "例外：" + msg };
    }
  }
  const results = {};
  const rows = ONLY ? ROW_ORDER.filter(r => ONLY.includes(r)) : ROW_ORDER;
  for (const id of rows) { results[id] = await runRow(id, urls, baseEnv); console.log(id, results[id].result, ONLY && results[id].result !== "通過" ? JSON.stringify(results[id].detail).slice(0, 1500) : ""); }

  // 全部輸入逐句一致：v1_8 起為 Q128（上開逐列內執行）

  // Q81 截圖（驗證表 v1_9 之清單；c11 之補列與標題改動，全部重產）
  const shots = path.join(VERIFY, "screenshots"); fs.mkdirSync(shots, { recursive: true });
  const shotFiles = [];
  if (ARGV.includes("--shots") && (!ONLY || ONLY.includes("Q81")) && browser) { // c16：頁面增白話說明與 register_note、zone_hint 字樣有變，全部以 --shots 重產；驗證表 v1_15 增三張
    const plan = [["01_載入", null], ["02_Q05", "C802041"], ["03_Q12", "HZ07011"], ["04_Q14", "H101021"], ["05_Q16", "ZZ99999"], ["06_Q21", "qwerty火星挖礦"], ["07_Q42", "咖啡廳"], ["08_Q86", AC[0].input], ["09_Q20第1句", E.q20[0].input], ["10_Q102咖啡廳手搖飲", "咖啡廳 手搖飲"],
      ["11_Q116室內設計補列", "室內設計"], ["13_Q120輸入已改未再查", "stale"], ["14_頁尾依據說明展開", "basis"], ["15_Q134賣給餐廳自己也開早餐店", "賣給 餐廳自己也開早餐店"],
      ["16_Q43HZ07011白話說明", "HZ07011"], ["17_Q09J905010白話說明", "J905010"], ["18_Q135室內設計register_note", "室內設計"],
      ["19_Q136D101011plain_cond", "D101011"], ["20_Q136IZ17010plain_co_domestic", "IZ17010"]]; // v1_15 增三張；v1_16 增二張
    for (const w of [1366, 390]) for (const [name, act] of plan) {
      const p = await ctx.page(urls.tool, w, 768);
      try {
        if (act === "basis") await p.evaluate(() => { document.querySelector("details").open = true; });
        else if (act === "stale") { await query(p, "室內設計"); await p.fill("#biz", "室內設計 咖啡廳"); }
        else if (act) await query(p, act);
        await p.evaluate(() => window.scrollTo(0, 0)); const f = `${name}_${w}.png`; await p.screenshot({ path: path.join(shots, f), fullPage: true }); shotFiles.push(f);
      } finally { await close(p); }
    }
  }

  // c15 派工起：頁面原始碼與 innerText 中附錄 A *_old 五鍵字樣之殘留檢查（不入列之判定；Q42 等另各自判定）
  const oldResidual = { source: {}, innerText: {} };
  if (!ONLY && browser) {
    for (const k of OLD_KEYS) oldResidual.source[k] = toolSrc.includes(A[k]);
    const states = [["載入後", null], ["咖啡廳", "咖啡廳"], ["F112010", "F112010"], ["H101021", "H101021"], ["J905010", "J905010"], ["HZ07011", "HZ07011"], ["室內設計（顯示全部）", "室內設計"], ["製造（顯示全部）", "製造"], ["qwerty火星挖礦", "qwerty火星挖礦"], ["空白", ""]];
    const p = await ctx.page(urls.tool);
    try {
      for (const [lab, q] of states) {
        if (q !== null) { await query(p, q); await showAll(p); }
        for (const media of ["screen", "print"]) { await p.emulateMedia({ media }); const t = await bodyText(p); oldResidual.innerText[lab + "／" + media] = OLD_KEYS.filter(k => t.includes(A[k])); }
        await p.emulateMedia({ media: "screen" });
      }
    } finally { await close(p); }
    oldResidual.anyFound = Object.values(oldResidual.source).some(Boolean) || Object.values(oldResidual.innerText).some(x => x.length > 0);
  }

  // 刻意錯誤
  const errs = {};
  if (!ONLY || ERRS_ONLY) for (const [id, kind, patch, expect, opt] of VARIANTS) {
    if (ERRS_ONLY && !ERRS_ONLY.includes(id)) continue;
    let env = { ...baseEnv, q138Shots: null }, u = { ...urls };
    try {
      if (kind === T) { const s = patch(toolSrc); env.src = { ...env.src, tool: s }; env.srcOrigin = "刻意錯誤版 " + id; u.tool = publish("v_" + id, s); }
      else if (kind === "self") { env.q107FailFull = true; } // E155：判定方式二十七（頁面不改）
      else { env.patchBuild = patch; patch(fs.readFileSync(path.join(BUILD, "build.py"), "utf8")); }
      if (opt && opt.failFull) env.q107FailFull = true; // E161：判定方式二十八之自檢（頁面依補丁改動，另令完整 Chromium 啟用往返快取之設定啟動失敗）
    } catch (e) { errs[id] = { expect, error: "補丁未套用：" + e.message, allCaught: false, notRun: /--spec-v1-10/.test(e.message) }; console.log(id, "補丁未套用", e.message); continue; }
    const got = {}, det = {}, lfOf = {};
    for (const r of expect) { const x = await runRow(r, u, env); got[r] = x.result; det[r] = x.detail; lfOf[r] = !!x.launchFailure; }
    errs[id] = { expect, got, caught: expect.filter(r => got[r] === "未通過"), allCaught: expect.every(r => got[r] === "未通過"),
      exceptions: Object.fromEntries(expect.filter(r => typeof det[r] === "string" && det[r].startsWith("例外")).map(r => [r, det[r]])) }; // 判未通過之原因為例外者另記（供判讀）
    // 判定方式二十五、二十八：對應列因瀏覽器無法啟動而未執行者（runRow 之結構化欄位 launchFailure；明細為字串或物件均同），該刻意錯誤記未執行並附錯誤訊息（不記未抓到）
    const lf = expect.filter(r => got[r] === "未執行" && lfOf[r]);
    const lfMsg = r => typeof det[r] === "string" ? det[r] : (det[r] && det[r].settings ? Object.entries(det[r].settings).filter(([k, v]) => v.launchFailure).map(([k, v]) => k + "：" + v.error).join("；") : JSON.stringify(det[r]));
    if (lf.length && kind !== "self") { errs[id].notRun = true; errs[id].allCaught = null; errs[id].error = "判定方式二十五、二十八：瀏覽器無法啟動（" + lf.join("、") + "）：" + lfMsg(lf[0]); }
    if (kind === "self") { // 判定方式二十七（驗證表 v1_17 之 E155 判準）：該設定之判定為未執行且錯誤訊息含「判定方式二十七之自檢」者為抓到；Q107 列記未執行不單獨構成抓到
      const d = det.Q107 || {}, st = d.settings && d.settings.chromium_bfcache_enabled;
      const caught = !!st && st.verdict === "未執行" && /判定方式二十七之自檢/.test(st.error || "");
      errs[id] = { expect, got, rule: "判定方式二十七（驗證表 v1_17 E155 之判準）：抓到＝「完整 Chromium 並啟用往返快取」之設定之判定為未執行且錯誤訊息含「判定方式二十七之自檢」；Q107 列記未執行不單獨構成抓到", fullBfcacheSetting: st, caught: caught ? ["Q107"] : [], allCaught: caught };
    }
    if (opt && opt.check28) { // 判定方式二十八之自檢（E161）：抓到＝E75 之補丁於此設定下記未執行（不記未抓到）且附錯誤訊息
      const inner = { notRun: errs[id].notRun === true, allCaught: errs[id].allCaught, error: errs[id].error || null, launchFailureSettings: (det.Q107 && det.Q107.settings) ? Object.keys(det.Q107.settings).filter(k => det.Q107.settings[k].launchFailure) : [] };
      const caught = inner.notRun && inner.allCaught === null && !!inner.error;
      errs[id] = { expect, got, rule: "判定方式二十八：E75 之補丁加完整 Chromium 啟用往返快取之設定啟動失敗；抓到＝E75 記未執行（不記未抓到）並附錯誤訊息", e75Equivalent: inner, caught: caught ? ["Q107"] : [], allCaught: caught };
    }
    if (opt && opt.must) { const m = opt.must(det); errs[id].mustCatch = m; errs[id].allCaught = errs[id].allCaught && m.ok; }
    if (expect.includes("Q125") && det.Q125 && typeof det.Q125 === "object") errs[id].Q125分項 = { 三: det.Q125.三 ? det.Q125.三.ok : null, 顯名必繪出: det.Q125.顯名必繪出, 判定方式三十六: det.Q125.判定方式三十六, 甲至丁: det.Q125.甲至丁 }; // c22：只記錄（供判讀），不入判定
    // c20：受測頁本身之 Q138 已有未通過之列者，刻意錯誤版之 Q138 未通過不單獨構成檢出證據；另記相對受測頁新增之未通過列（外殼表列）
    if (expect.includes("Q138") && det.Q138 && det.Q138.rows) {
      const baseFailed = (results.Q138 && results.Q138.detail && results.Q138.detail.未通過) || [];
      const vf = Object.keys(det.Q138.rows).filter(k => det.Q138.rows[k].result === "未通過");
      errs[id].Q138 = { 受測頁本身即未通過之列: baseFailed, 錯誤版未通過之列: vf, 相對受測頁新增之未通過列: vf.filter(k => !baseFailed.includes(k)) };
      if (errs[id].mustCatch) errs[id].mustCatch.其他列之交叉失敗_扣除受測頁本身即未通過之列 = (errs[id].mustCatch.其他列之交叉失敗 || []).filter(k => !baseFailed.includes(k));
    }
    console.log(id, JSON.stringify(got));
  }
  for (const [id, ex] of Object.entries(VARIANTS_OUT_OF_SCOPE)) errs[id] = { expect: ex, notRun: true, error: "不在射程（以開發中頁 v0.2.0 為底；驗證表 v1_23 第十節），不執行", allCaught: null };

  // Q138：外殼表第十五節之錯誤案例（適用本工具或「施於任一適用工具」者；shell_v1_2.js 之 ZCASES）；每案執行全部適用列並記錄全部未通過列
  const zres = {};
  const zWanted = id => !ONLY || (ERRS_ONLY && ERRS_ONLY.includes(id));
  if (browser && SHELL_SPEC && SHELL_TABLE && (!ONLY || ERRS_ONLY)) {
    const kv = shellKv(); const K = { bookUrl: kv["預約網址"], vaUrl: kv["看全部網址"], sig: kv["署名"], sigUrl: kv["署名網址"], disc: kv["免責句"], priv: kv["隱私句"], ver: A.version_line };
    for (const [id, what, expect, patch, why] of SHELL.ZCASES) {
      if (!zWanted(id)) continue;
      const rec = { 受測工具: "營業項目查詢（business-items）", 植錯: what, 須報未通過之列: expect };
      if (!patch) { zres[id] = { ...rec, result: "未執行", reason: why }; console.log(id, "未執行（前提不存在）"); continue; }
      let s;
      try { s = patch(toolSrc, kv, A); } catch (e) { zres[id] = { ...rec, result: "未執行", reason: "補丁未套用：" + e.message }; continue; }
      const zu = publish("z_" + id, s);
      const r = await SHELL.runShell({ browser, url: zu, src: s, base: { url: urls.base, label: "a47269e" }, base32: base32Of(urls), r02Expect: R02_EXPECT, kv, K, inputs: E.all_inputs, shotsDir: null, shotTag: id, firefox: FF_LAUNCH,
        anchor: SHELL_FILL_COMMIT ? "label[for=biz]" : null, discOld: A.disclaimer_old, version: "1.0.0" });
      const failedAll = Object.keys(r.rows).filter(k => r.rows[k].result === "未通過");
      const got = Object.fromEntries(expect.map(k => [k, r.rows[k] ? r.rows[k].result : "不在本工具射程"]));
      rec.植錯位置 = "index.html（以施作完成之頁面為底，只改一處；補丁見 shell_v1_2.js ZCASES）"; rec.畫面狀態與尺寸 = "全部適用列之狀態與尺寸（見各列）";
      const baseFailedZ = (results.Q138 && results.Q138.detail && results.Q138.detail.未通過) || [];
      rec.各列結果 = got; rec.全部未通過列 = failedAll; rec.受測頁本身即未通過之列 = baseFailedZ; rec.未預期之交叉失敗 = failedAll.filter(k => !expect.includes(k) && !baseFailedZ.includes(k));
      rec.預期列中受測頁本身即未通過者 = expect.filter(k => baseFailedZ.includes(k)); // c20：此等列之「抓到」不作檢出證據
      let valid = true, note = null;
      if (id === "Z76") { const g = r.rows.F02 && r.rows.F02.detail; const s14 = g && g.不符 ? g.不符.filter(x => x.size === "1440×900") : []; rec.前提量測 = await z76Premise(browser, zu); if (!s14.length) { valid = false; note = "前提成立、植錯機制於本工具不生效：預約列內容寬小於頁尾容器內容區寬（前提量測），但預約列為頁尾欄（直向 flex、align-items:center）內之收縮容器，寬等於其內容，justify-content 改 flex-start 不改其內容之位置；1440×900 之中心差仍 ≤ 1px。F02 置中之檢出力改由本工具驗證表 E173（預約列 align-self:flex-start）證明（c19 第八輪 G-02）"; } }
      if (id === "Z98") { const m = r.rows.F10 && r.rows.F10.detail && r.rows.F10.detail.量測 ? r.rows.F10.detail.量測.find(x => x.新版相鄰間距) : null; const gp = m ? m.新版相鄰間距.find(x => x.b === "預約") : null; rec.前提量測 = gp ? { 前鄰至預約列: gp.gap, 基準上限: m.基準上下限[1] } : null; if (!gp || Math.abs(gp.gap - (m.基準上下限[1] + 12)) > 1) { valid = false; note = "植錯無效：前元素至預約列之距離不等於基準最大值加 12px"; } }
      if (id === "Z03") { const g = r.rows.G01 && r.rows.G01.detail; rec.前提量測 = g ? { 結果狀態可見預約數之樣本: (g.不符 || []).slice(0, 2) } : null; }
      const caught = valid && expect.filter(k => r.rows[k]).every(k => r.rows[k].result === "未通過");
      const noEvid = caught && rec.預期列中受測頁本身即未通過者.length > 0 && expect.filter(k => r.rows[k]).every(k => baseFailedZ.includes(k));
      zres[id] = { ...rec, 植錯有效: valid, 說明: note, result: !valid ? "植錯無效" : noEvid ? "抓到（不作檢出證據：所列之列於受測頁本身即未通過）" : caught ? "抓到" : "未抓到", 明細: Object.fromEntries(expect.filter(k => r.rows[k]).map(k => [k, r.rows[k].detail])) };
      console.log(id, zres[id].result, JSON.stringify(got), "交叉", JSON.stringify(rec.未預期之交叉失敗));
    }
  }

  // 改版前之判法（c22b）：tools bf4c873 之 verify.js（驗證表 v1_22 之判法；SHA-256 核對）對本頁面跑 Q125 與 E176（派工：照記，以示新判法之差異）。
  //   舊程式以 git cat-file 取出，暫置於本目錄（使 __dirname 所指之 build/、工具頁與 shell_v1_2.js 與本程式相同），以 --only Q125、--errs-only E176 各執行一次並以 --dump 另存，執行後刪除暫存檔。
  const pre = {};
  if (!ONLY) {
    const oldJs = path.join(VERIFY, ".verify_" + PRE_JUDGE_COMMIT + ".js");
    try {
      const buf = execFileSync("git", ["-C", REPO, "cat-file", "-p", `${PRE_JUDGE_COMMIT}:business-items/build/verify/verify.js`], { maxBuffer: 1 << 26 });
      if (sha256(buf) !== SHA_PRE_JUDGE) throw new Error(`${PRE_JUDGE_COMMIT} 之 verify.js SHA-256 不符`);
      fs.writeFileSync(oldJs, buf);
      const pass = []; for (let i = 0; i < ARGV.length; i++) { const a = ARGV[i]; if (a === "--shots") continue; if (["--only", "--errs-only", "--dump"].includes(a)) { i++; continue; } pass.push(a); }
      const runOld = (extra, lab) => { const f = path.join(TMP, "pre_" + lab + ".json"); const r = spawnSync("node", [oldJs, ...pass, ...extra, "--dump", f], { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 28, timeout: 1800000 });
        if (r.status !== 0 || !fs.existsSync(f)) throw new Error(`舊判法 ${lab} 執行失敗（結束碼 ${r.status}）：` + String(r.stderr || "").slice(-500)); return JSON.parse(fs.readFileSync(f, "utf8")); };
      const q = runOld(["--only", "Q125"], "Q125"), e = runOld(["--errs-only", "E176"], "E176");
      pre.page = { commit: "本頁面（與 " + PRE_JUDGE_COMMIT + " 逐位元組相同）", sha256: sha256(Buffer.from(toolSrc, "utf8")) };
      pre.judge = { commit: PRE_JUDGE_COMMIT, file: "business-items/build/verify/verify.js", sha256: SHA_PRE_JUDGE, 判法: "驗證表 v1_22（判定方式三十四、三十五；無判定方式三十六）", tested_commit_by_old: q.tested_commit, tool_sha256_by_old: q.tool_sha256 };
      pre.rows = { Q125: { result: q.rows.Q125.result, detail: q.rows.Q125.detail } };
      pre.errs = { E176: e.deliberate_errors.E176 };
      console.log("改版前之判法 Q125", pre.rows.Q125.result, "E176 全數抓到", pre.errs.E176 && pre.errs.E176.allCaught);
      pre.expectFail = []; pre.expectPass = []; pre.passAsRecorded = Object.keys(pre.rows);
    } catch (err) { pre.error = String(err.message).split("\n")[0]; }
    finally { try { fs.unlinkSync(oldJs); } catch (er) { } }
    pre.earlier = "c22 批（bf4c873）已以 c9302c5 之頁面跑 Q125；c21 批（c9302c5）已以 fb163dd 跑 Q125；c20b 批（fb163dd）已以 52d2f0d 跑 Q106、Q122、Q125、Q138；更早版本之回測記於各該批之結果.json；本批之派工射程只含以 bf4c873 之驗證程式（v1_22 判法）對本頁面跑 Q125 與 E176（照記），未重跑其餘";
  }
  // Q138 之舊版回測（外殼表第十五節；規格 v1_22 第十一節之 6）：以 a47269e 跑同一組適用列（R02 之基準依判定方式三十一同為規格 v1_22 之收合列內文）
  let shellOld = null;
  if (!ONLY && results.Q138) {
    let s = null; try { s = baseTool(); } catch (e) { shellOld = { error: "git show 失敗或 SHA-256 不符：" + String(e.message).split("\n")[0] }; }
    if (s !== null) { const u = { ...urls, tool: publish("old_" + BASE_COMMIT, s) }; const env = { ...baseEnv, src: { ...baseEnv.src, tool: s }, srcOrigin: BASE_COMMIT + ":business-items/index.html", q138Shots: null };
      const x = await runRow("Q138", u, env); shellOld = { result: x.result, detail: x.detail }; console.log("舊版回測（a47269e）Q138", x.result); }
  }

  // Q138 之外殼表逐列結果另表（results/外殼v1_2_Q138.json）：新版、舊版回測（a47269e）、預期未通過清單之核對、錯誤案例、外殼表與本表期望之比較
  let shellOut = null;
  if (!ONLY && results.Q138) {
    let expectFail = null, precheckErr = null;
    try { const pj = JSON.parse(fs.readFileSync(SHELL_PRECHECK, "utf8")); const r0 = pj["business-items"]; expectFail = [...new Set(Object.entries(r0).filter(([k, v]) => String(v).startsWith("預檢未通過")).map(([k]) => k.split("/")[0]))]; } catch (e) { precheckErr = String(e.message); }
    const oldRows = shellOld && shellOld.detail && shellOld.detail.rows || {};
    const passedOld = (expectFail || []).filter(k => oldRows[k] && oldRows[k].result === "通過");
    const newRows = results.Q138.detail && results.Q138.detail.rows || {};
    shellOut = { 外殼驗證表: "knowledge d938e6b inbox/外殼v1_2/外殼一致化_外殼驗證表_v1_2.md（SHA-256 " + SHA_SHELL_TABLE + "）", 受測頁: { sha256: sha256(toolSrc), from: baseEnv.srcOrigin }, 比對基準: "tools a47269e business-items/index.html（SHA-256 " + SHA_BASE_TOOL + "）；F10、X06 之基準依判定方式三十二為基準頁（" + (BASE32 && BASE32.基準頁SHA256 ? BASE32.基準頁位元組數 + " 位元組，SHA-256 " + BASE32.基準頁SHA256 : "未產生") + "）", 判定方式三十二之基準頁: BASE32,
      Firefox: FF_LAUNCH, 補填commit: SHELL_FILL_COMMIT || null, Q138結果: results.Q138.result,
      新版: Object.fromEntries(Object.entries(newRows).map(([k, v]) => [k, { result: v.result, reason: v.reason, detail: v.detail }])),
      射程標記不適用: SHELL.NOT_APPLICABLE,
      舊版回測: { 頁面: "a47269e", R02之基準: R02_EXPECT.label, rows: Object.fromEntries(Object.entries(oldRows).map(([k, v]) => [k, { result: v.result, detail: v.detail }])), 預期未通過清單_static_precheck重抽: expectFail, 重抽錯誤: precheckErr, 預期未通過而舊版報通過: passedOld },
      錯誤案例: zres,
      與本工具驗證表期望之比較: [
        { 外殼列: "L03", 本表列: "Q70", 不同: "Q70 期望預約與看全部工具同一列；L03 容許寬度不足時看全部工具折至預約正下方", 依判定方式二十九: "以外殼表為準（L03）；本頁於全部量測尺寸（含 320 寬）均並排，兩者皆符" },
        { 外殼列: "G05、L02", 本表列: "Q72", 不同: "Q72 期望 rel 含 noopener；G05、L02 期望 rel 含 noopener 與 noreferrer", 依判定方式二十九: "以外殼表為準；本頁 rel 為 noopener noreferrer，兩者皆符" },
        { 外殼列: "A02、E03、F03、G01、L01 等（全尺寸 45 組加兩種縮放）", 本表列: "Q70、Q72（寬 320、390、768、1366，高 768）", 不同: "量測尺寸之範圍不同", 依判定方式二十九: "以外殼表為準，外殼列以全尺寸量測；本表列照其字面之尺寸另行判定" },
        { 外殼列: "G05、L02", 本表列: "Q72", 不同: "c19 時 Q72 字面以 innerText 判連結文字（innerText 含 aria-hidden 之「↗」）；外殼 G05、L02 以主文字（排除 aria-hidden 之後代元素；外殼表稱「可見文字」）判", 依判定方式二十九: "驗證表 v1_19 已改 Q72 字面為主文字（v1_21 改稱，原稱可見文字；排除 aria-hidden=\"true\" 之後代元素後之文字，另記原始 innerText），與外殼表讀法相同；c19 之判定（通過）不變（c19 第八輪 G-01）" },
        { 外殼列: "R02", 本表列: "Q73、Q63", 不同: "外殼表 R02 之基準為 10/23 版（本工具為 a47269e）之收合列內文；本工具契約 c20 於收合列內增顯名一段，與 a47269e 不同", 依判定方式二十九: "依判定方式三十一（規格 v1_22 第三十七節二，使用者 115/10/20 裁定甲），本工具 R02 之基準改為規格 v1_22 之收合列內文（attribution 加 basis_item_1～4）；屬本工具契約之異動而非外殼之偏離，經總對話通知外殼專用對話" },
        { 外殼列: "F10", 本表列: "Q63、Q73（規格 v1_22 拘29、第十一節）", 不同: "外殼表 F10 期望一：頁尾收合列（details）本身之子元素數與其非 summary 後代之子元素數、textContent 與 10/23 版（本工具為 a47269e）相同；本工具契約 c20 於收合列內增顯名一段（子元素數 2→3、textContent 增顯名全文）", 依判定方式二十九: "c20b 起依判定方式三十二（驗證表 v1_20；使用者 115/10/20 裁定甲）：F10 之基準改為基準頁（make_base32.py 自 a47269e 之 git blob 只把 p#attribution 搬入頁尾收合列、為 summary 之後第一個內文元素；位元組數與 SHA-256 見「判定方式三十二之基準頁」），其餘比對方法照外殼表；屬本工具契約之異動（與判定方式三十一同）。c20 時以 a47269e 為基準照外殼表判定為未通過" },
        { 外殼列: "X06", 本表列: "Q63（規格 v1_22 拘29）", 不同: "外殼表 X06 期望除外殼元素外逐內容區塊之正規化文字與 10/23 版相同；本工具契約 c20 將顯名移入頁尾，頁尾區塊之文字因而與 a47269e 不同", 依判定方式二十九: "c20b 起依判定方式三十二：X06 之基準改為同一基準頁，其餘比對方法照外殼表；c20 時以 a47269e 為基準判定為未通過" },
        { 外殼列: "L05", 本表列: "（無對應列；派工 c20b 之頁面修正）", 不同: "c20 時 320×844、981×640 之焦點框底緣超出視窗（預約 849.6＞844、646.5＞640；看全部工具 848.6＞844、645.5＞640）", 依判定方式二十九: "c20b 於 page_template.html 加 .sy-book-btn,.site-foot .sy-view-all{scroll-margin-block:8px}（≥ outline-width 3px＋outline-offset 3px＋2px；外觀不變，使用者 115/10/20 裁定第三十四題）；實測值見 L05 之明細（Tab 與 element.focus() 兩種方式）。不改外殼表之期望" },
        { 外殼列: "P06", 本表列: "Q107", 不同: "P06 須 Chromium 與 Firefox 各一次（重新整理）；Q107 為 Chromium、Firefox、WebKit 之重新整理與上一頁返回", 依判定方式二十九: "兩列均因 Firefox 無法啟動而記未執行" },
      ] };
    fs.mkdirSync(path.join(VERIFY, "results"), { recursive: true });
    fs.writeFileSync(path.join(VERIFY, "results", "外殼v1_2_Q138.json"), JSON.stringify(shellOut, null, 1));
    if (passedOld.length) console.log("停止回報：預期未通過之列於舊版報通過", passedOld);
  }
  if (browser) await browser.close(); server.close();
  const outDir = path.join(VERIFY, "results"); fs.mkdirSync(outDir, { recursive: true });
  const count = { 通過: 0, 未通過: 0, 未執行: 0 }; Object.values(results).forEach(r => count[r.result]++);
  const covered = new Set(VARIANTS.flatMap(v => v[3]));
  const out = { generated_by: "verify.js", spec: "營業項目查詢工具_規格_v1_24.md（契約 c22）", table: "營業項目查詢工具_驗證表_v1_23.md（knowledge 8cd104c）", batch: "c22b", base32: BASE32, shell_table: "外殼一致化_外殼驗證表_v1_2.md（knowledge d938e6b）", tested_commit: headCommit, tested_page_from_head: headMatchesWorktree, ext_sha256: sha256(fs.readFileSync(path.join(BUILD, EXT_FILE))), tool_sha256: sha256(toolSrc),
    browser_launch_error: launchError,
    flags: { build_test_mode: "--test-no-hash（Q02、Q04；只關閉 SHA-256 核對）", spec_given: !!SPEC, spec_v1_10_given: !!SPEC_V1_10, spec_v1_12_given: !!SPEC_V1_12, spec_v1_21_given: !!SPEC_V1_21, shell_spec_given: !!SHELL_SPEC, shell_table_given: !!SHELL_TABLE, shell_precheck_given: !!SHELL_PRECHECK, shell_fill_commit: SHELL_FILL_COMMIT || null, firefox_launch: FF_LAUNCH, indep_given: !!INDEP_FILE, indep_sha256: SHA_INDEP },
    count, rows: results, out_of_scope: OUT_OF_SCOPE, old_strings_residual: oldResidual, screenshots: shotFiles.length ? shotFiles : fs.readdirSync(shots).filter(f => f.endsWith(".png")).sort(), screenshots_regenerated: shotFiles.length > 0, deliberate_errors: errs, pre_revision: pre,
    row_ids_missing_vs_table: ROW_ORDER.filter(r => !results[r]), extra_ids: Object.keys(results).filter(r => !ROW_ORDER.includes(r)),
    programmatic_rows_without_error_version: ROW_ORDER.filter(r => !MANUAL[r] && !covered.has(r)) };
  if (!ONLY) fs.writeFileSync(path.join(outDir, "結果.json"), JSON.stringify(out, null, 1));
  if (ONLY && argOf("--dump")) fs.writeFileSync(argOf("--dump"), JSON.stringify(out, null, 1)); // 試跑用：--only 時另存明細（不寫 results/）
  console.log(JSON.stringify({ count, errsNotAllCaught: Object.entries(errs).filter(([k, v]) => v.allCaught === false).map(([k, v]) => [k, v.got || v.error]), uncovered: out.programmatic_rows_without_error_version }, null, 1));
  fs.rmSync(TMP, { recursive: true, force: true });
})().catch(e => { console.error(e); process.exit(1); });
