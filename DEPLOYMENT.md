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
| 1-1 | 開公司決策工具 | `v3.6.11` | `/1-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-1/) | `https://tools.sytaxes.com/1-1/` | `2026-10-07` | LIVE |
| 1-3 | 有限公司設立互動工具 | `v1.0.20` | `/1-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/1-3/) | `https://tools.sytaxes.com/1-3/` | `2026-10-07` | LIVE |
| 2-1 | 地址登記決策工具 | `v2.1.10` | `/2-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-1/) | `https://tools.sytaxes.com/2-1/` | `2026-10-07` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.9.2` | `/2-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/2-2/) | `https://tools.sytaxes.com/2-2/` | `2026-10-07` | LIVE |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.47` | `/3-2/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/3-2/) | `https://tools.sytaxes.com/3-2/` | `2026-10-07` | LIVE |
| 4-1 | 損益兩平互動試算工具 | `v1.6.13` | `/4-1/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-1/) | `https://tools.sytaxes.com/4-1/` | `2026-10-07` | LIVE |
| 4-3 | 現金流量預算表 | `v1.13.8` | `/4-3/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-3/) | `https://tools.sytaxes.com/4-3/` | `2026-10-07` | LIVE |
| 4-4 | 停業、歇業與解散導航 | `v1.6.9` | `/4-4/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/4-4/) | `https://tools.sytaxes.com/4-4/` | `2026-10-07` | LIVE |
| resolution | 公司決議程序與時程整理工具 | `v0.3.9` | `/resolution/` | [開啟工具](https://sytax-academy.github.io/shengyan-tools/resolution/) | `https://tools.sytaxes.com/resolution/` | `2026-10-07` | LIVE |

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準。

九支（1-1 v3.6.11、1-3 v1.0.20、2-1 v2.1.10、2-2 v1.9.2、3-2 v1.5.47、4-1 v1.6.13、4-3 v1.13.8、4-4 v1.6.9、resolution v0.3.9）為 115/10/07 外殼一致化 C 批（只改外殼：側欄甲乙丙三區、乙區列出全部可能步驟與「結果」、到達結果時未走到之步驟標「本次不適用」、乙區捲動提示獨立一列、側欄版面條件改為寬 981 以上且高 640 以上、免責短版加「你輸入的資料只在這個頁面使用，不會送出。」、頁尾依序免責長版、署名、預約、版本行並置中、版本行兩段格式；2-1 判斷原則移主欄可收合卡、預約改回側欄；resolution meta robots 改 index,follow、tool-version 去「-test」、官方依據連結移至頁尾之上；題目、選項、結果、計算與法源文字未改，未改色）。依據為 shengyan-knowledge「inbox/外殼一致化C批/」之《外殼規格》v1_0 與《驗證表》v1_0（凍結於 commit 744faed）；功能規格抽取 v1_0 見 commit fe6bae8；驗證執行紀錄與驗證總表 v1_1 見 commit 09e1d7f。驗證結果（只有 Chromium；45 種尺寸加兩種縮放）：通過 196、未通過 1、未執行 4。未通過為 1-3 SB06（1440×640 側欄乙區只完整露出 2 步），使用者 115/10/07 裁定接受，留 D 批處理；H05（resolution 版本行逐字）原判未通過，因名詞解釋程式自動插入說明字，使用者 115/10/07 裁定扣除插入字判定後通過；未執行為 1-3 C06（無「第 N 步」字樣）與 D03 三支（1440×900 乙區皆超出，觸發不了）。內容同一性 X01～X06 全數通過（依序作答四支全路徑窮舉：1-1 25,531、2-1 2,029、4-4 198、resolution 382 狀態，新舊差異 0）。位元組數與 SHA-256 為合入前自測試分支 test/shell-c 之 git blob 實算（九支 index.html 與已驗證之 commit d3a6980 相同）；使用者 115/10/07 實機並排核可合入，上開未通過與未執行經使用者裁定後合入，作為公開版本規則第 5 條之核可；合入前確認 Project Instruction 現行為 v1.6（115/10/07）。九支前一版（1-1 v3.6.10、1-3 v1.0.19、2-1 v2.1.9、2-2 v1.9.1、3-2 v1.5.46、4-1 v1.6.12、4-3 v1.13.7、4-4 v1.6.8、resolution v0.3.8）之位元組數與 SHA-256 見 git 歷史（commit f3ce5d8）。115/10/07 合入 main（PR #12，merge commit e64a091）；GitHub Pages 部署（pages build and deployment #72，commit e64a091）成功（build、report-build-status、deploy 三項）；使用者 115/10/07 公開頁 smoke：本機 Windows PowerShell 自 tools.sytaxes.com 取回九支 index.html，位元組數與 SHA-256 與上表全部相符；手機走 1-1、2-1 至結果頁，頁尾版本號與版面正常；改記 LIVE；以下各段為前一版之紀錄，保留為歷史。

（前一版紀錄）下表 3-2、4-1、4-3、4-4 四列為 115/10/01 墨灰改版改色第一批（該批原含 2-2 v1.8.9，2-2 自 v1.9.1 起見下段）（只改色彩層，依《聖彥學堂 Design System v2.0》定稿 r8；驗證表 shengyan-knowledge「inbox/墨灰改版/墨灰改版_改色驗證表_v1_0」凍結於 commit f7efa17、補充（Z5）v1_0 凍結於 commit 0e65d2d；執行紀錄 v1_1 見 commit 24d5f2b）合入前自測試分支 test/ink-gray-1（commit 5e5f8ab）之 git blob 實算；使用者 115/10/01 S01 實機核可；合入前確認 Project Instruction 現行為 v1.5。115/10/01 合入 main（PR #9，merge commit 4bfd9dd）；GitHub Pages 部署（pages build and deployment #64，commit 4bfd9dd）成功；使用者 115/10/01 S02 公開頁 smoke：五支版號正確、配色正確、走至結果頁正常，4-4 桌機寬度側欄右緣分隔線可見；改記 LIVE。五支前一版（2-2 v1.8.8、3-2 v1.5.45、4-1 v1.6.11、4-3 v1.13.6、4-4 v1.6.7）之位元組數與 SHA-256 見 git 歷史（commit e892050）。

1-1、1-3、2-1 三列為 115/10/02 墨灰改版改色第二批（1-1 v3.6.9 → v3.6.10、1-3 v1.0.18 → v1.0.19、2-1 v2.1.8 → v2.1.9；只改色彩層，依《聖彥學堂 Design System v2.0》定稿 r8；容許差異 Z1 版本字串、Z5 1-1 與 1-3 側欄右緣 inset 1px paper-300、Z6 README 版號；2-1 側欄既有右緣框線換色 paper-300）。驗證表為 shengyan-knowledge「inbox/墨灰改版/」之《墨灰改版_改色驗證表》v1_0（第二批射程）、補充（Z5）v1_0 與第二批補充 v1_2（凍結於 commit c1b5c4a）；色彩處置表 1-1 v1_3、1-3 v1_1、2-1 v1_1（2-1 含使用者 115/10/01 裁定 D1 至 D5）；驗證總表與執行紀錄 v1_0 見 commit ad1542f（三支合計通過 96、未通過 4、未執行 29；只有 Chromium）。未通過四項：M22 三支（停用按鈕以透明度表示，透明度不在本批容許差異，原樣保留，舊版同樣未通過）與 W05 2-1（手機頂列未來小籤合成後 3.24，使用者裁定 D5 甲照實記未通過，登錄既有缺陷 K11）；既有缺陷 K12（2-1 .btn:hover 覆蓋主要按鈕 hover）本批不修。位元組數與 SHA-256 為合入前自測試分支 test/ink-gray-2 於 rebase 至 main 93bbe20 後之 git blob 實算（三支 index.html 與已驗證之 commit 6f8c256 之 blob 相同）；使用者 115/10/02 S01 實機並排核可；合入前確認 Project Instruction 現行為 v1.5。115/10/02 合入 main（PR #11，merge commit 1e0ea54）；GitHub Pages 部署（pages build and deployment #68，commit 1e0ea54）成功；使用者 115/10/06 S02 公開頁 smoke：本機 PowerShell 取回三支之位元組數與 SHA-256 與本表相符，iPhone 走至結果頁之頁尾版本號正確、無深藍殘留、文字清楚；改記 LIVE。三支前一版（1-1 v3.6.9、1-3 v1.0.18、2-1 v2.1.8，預約入口每畫面一個小批）之位元組數與 SHA-256 見 git 歷史（commit 93bbe20）。

2-2 列為 115/10/02 參數集中化（v1.8.9 → v1.9.1；年度參數改由單一 PARAMS 區塊承載，逐字內嵌正本《勞健保年度參數_v1_2.json》；職災保費改引 share.occUnit、share.occUnion；畫面與計算結果與 v1.8.9 相同，版本字串除外）。驗證表 shengyan-knowledge「inbox/2-2參數集中化/2-2參數集中化_驗證表_v1_3」凍結於 commit 6d34d40，A01～A04、B01～B13、C01～C09、D01、D02 全數通過，執行紀錄 v1_3 見 commit 6f122e4；位元組數與 SHA-256 為合入前自測試分支 test/2-2-params（commit 5d4053d）之 git blob 實算。E01～E03 為 Claude 代測（115/10/02）：E01 於使用者 Windows Chrome 並排兩版，受僱者與負責人路線之結果頁文字只差版本字串，負責人頁有一處 0.026px 次像素寬度差，使用者接受並判通過；E02 為 390×844 內嵌框之模擬代測，非實體手機；E03 於使用者 Excel 2019 開啟 xlsx v1.5.0 並修改 B63、B5，連動正確且無錯誤值。使用者 115/10/02 依上開結果核可合入（原文：「同意合入，請你幫我執行。」），作為公開版本規則第 5 條之並排核可；合入前確認 Project Instruction 現行為 v1.5。115/10/02 合入 main（PR #10，merge commit a085eb0）；GitHub Pages 部署（pages build and deployment #66，commit a085eb0）成功；使用者 115/10/02 公開頁 smoke（tools.sytaxes.com/2-2/）：頁尾版本 v1.9.1、受僱者月薪 35,000 之公司每月實際人事成本 42,196 元、負責人代表組合之保費總額 5,391 元，三項正確；改記 LIVE。既有缺陷 K07（#bMaxWrap 於員工數 0 時 opacity .45）經使用者裁定本批不修。前一版 2-2 v1.8.9 之位元組數與 SHA-256 見 git 歷史（commit d792ad0）。

resolution 列為 115/10/06 新上線之公司決議程序與時程整理工具 v0.3.8（內容凍結版 v0.2.13，commit 1139b1ed8fb0fd509b8bf3c08a7e0419261715d4；v0.3.8 以之為底只改色彩層，依《聖彥學堂 Design System v2.0》定稿 r8，容許差異為版本字串與側欄右緣 inset 1px paper-300）。驗證表為 shengyan-knowledge「inbox/resolution_v1_8/」之《驗證表》v1_16（207 列，連同附錄 G 治理掃描程式與清單凍結於 commit 180e4b8）與「inbox/resolution_v0_2/」之《配色補充驗證表》v1_3（commit 3f2a1c3）；執行紀錄 v0_18 見 commit fb8d0ea。原驗證表：通過 204、未通過 1、未執行 2。未通過為 T94（期望字面與畫面不符，使用者 115/09/30 裁定驗證表誤植，工具不改）；未執行為 T73、T147（期望對象為正式網址，部署後執行；未執行不視為通過）。附錄 G 2,232 頁未通過 0 行。配色補充驗證表 P01～P17、P19 通過（P13 依使用者裁定甲以對照檔判定），P18 經使用者 115/10/06 以 iPhone Safari 實機判讀通過。位元組數與 SHA-256 為合入前自測試分支 test/resolution-v1（commit 8b4ab95033abea470feb64e68f797e8722f71792）之 git blob 實算；使用者 115/10/06 核可合入；合入前確認 Project Instruction 現行為 v1.6（115/10/06）。115/10/06 合入 main（merge commit 5e8a553，同一 commit 更新本檔）；GitHub Pages 部署（pages build and deployment #69，commit 5e8a553）成功；使用者 115/10/06 公開頁確認：PowerShell 取回 124,793 位元組、SHA-256 與上表相同，瀏覽器頁尾版本 v0.3.8、配色正確、可走至結果頁。部署後 T73、T147 均通過（執行紀錄 v0_19、v0_20 見 shengyan-knowledge commit ced6981、5e09627）：T73 於正式網址走 M1～M6 各一條路線至結果頁，初始導覽以外之請求 0；T147 部署 commit 之檔無自動取得第二個檔案之參照，正式網址取回之檔與該 commit 位元組數及 SHA-256 相同。改記 LIVE。版本 meta 之「-test」字樣依使用者裁定併入下一小批。本工具無前一公開版。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.11` | 91,411 | `183bc2fc31c1979a445b6e36e26c8b16fca1fbf089a2cd3d579d74ae4ce8561f` |
| 1-3 | `v1.0.20` | 53,405 | `e9868abf2b482c9de887b6454253b86dfc831896412ac85d084d6eea4dffd015` |
| 2-1 | `v2.1.10` | 131,405 | `aff86ae78323bd64ece6e3bfd17f71ca977dc40417bd9d176e4e10375371a97a` |
| 2-2 | `v1.9.2` | 128,206 | `56dc9b7022200b82bb07a873eb758d17b978c3836293ebfb04f3742ab9b2ceb1` |
| 3-2 | `v1.5.47` | 944,227 | `2a716de7b317bf187b6eb3b6da5cf3a38fe9a7bc703d71c025e279f4c0e1c83b` |
| 4-1 | `v1.6.13` | 139,751 | `37525ecb41de7b13e9ac0db9410e636c7d075df5ed61cfed914ee9f6455c34db` |
| 4-3 | `v1.13.8` | 1,022,024 | `2e0ce554b5a1136254ce2ac14f5edab940220aa1535b3aba9f94cf86a8455189` |
| 4-4 | `v1.6.9` | 105,147 | `7b1ffaddee47601e82b6b627afc34c9d6525180eace1a41827789d6056fcf5b7` |
| resolution | `v0.3.9` | 129,328 | `ecd075a6014ad112a99f4c84ecf3e19656ce3f4b371e37a8ae74d56ca271f44d` |

## 網站地圖

根目錄 `robots.txt` 與 `sitemap.xml` 為 115/10/07 網站地圖小批新增，只列免費工具四支（1-1、1-3、2-1、resolution）；會員工具（2-2、3-2、4-1、4-3、4-4）不列，各工具 index.html 與 meta robots 未改（會員工具是否對搜尋引擎隱藏，留待會員工具搬移另議；稅務罰則試算上線時另批加入）。依據為 shengyan-knowledge「inbox/sitemap/」之《tools網站地圖_驗證表》v1_0（凍結於 commit 21e07ad）；驗證執行紀錄 v1_0 見 commit 59b395f（SM01～SM05 通過；舊版回測 main 80590a3 SM01～SM04 未通過）。位元組數與 SHA-256 為合入前自測試分支 test/sitemap（commit ed8563a）之 git blob 實算；使用者 115/10/07 以 git blob 全文核對後核可合入；合入前確認 Project Instruction 現行為 v1.6（115/10/07）。115/10/07 合入 main（PR #13，merge commit 54d8cc4）；GitHub Pages 部署（pages build and deployment #74，commit 54d8cc4）成功（build、report-build-status、deploy 三項）；使用者 115/10/07 公開頁 smoke：本機 Windows PowerShell 自 tools.sytaxes.com 取回 robots.txt 與 sitemap.xml，狀態碼 200，位元組數與 SHA-256 與下表相符（SM06、SM07），所列四網址狀態碼均為 200（SM08）；改記 LIVE。

| 檔 | Bytes | SHA-256 | Status |
|---|---:|---|---|
| `robots.txt` | 70 | `6177e05c8200f464a00975d037a41ddfa045ffca833715b71c2211d77bcf1497` | LIVE |
| `sitemap.xml` | 505 | `2972ebd602b1defbcd093c470259496e4a0aa7dd8686a608db38f0d169965ba0` | LIVE |

`sitemap.xml` 所列四網址（lastmod 均為 2026-10-07）：

- `https://tools.sytaxes.com/1-1/`
- `https://tools.sytaxes.com/1-3/`
- `https://tools.sytaxes.com/2-1/`
- `https://tools.sytaxes.com/resolution/`

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
