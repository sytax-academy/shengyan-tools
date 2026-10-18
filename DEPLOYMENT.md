# 聖彥學堂｜財稅互動工具 Deployment Registry

> 用途：GitHub 公開部署總表。  
> 本檔為各工具現行版本與 SHA-256 之唯一權威來源（115/09/22 裁定）；原所稱私人 Release Identity Registry 與工廠 Registry 均為歷史，不再作為核對依據。每次合入 main 時於同一 commit 更新本檔。

## 網站資訊

- Organization：[sytax-academy](https://github.com/sytax-academy)
- Repository：[shengyan-tools](https://github.com/sytax-academy/shengyan-tools)
- 正式網址（115/10/13 起）：工具由官網主機提供，`https://sytaxes.com/tools/〔代號〕/`；會員工具之入口為 `https://sytaxes.com/tools/go/?t=〔代號〕`（官網主機端檢查登入，未登入導向 /dashboard/，登入後回原工具並保留網址參數）；工具總覽為 `https://sytaxes.com/interactive-tools/`。官網不自動同步本 repo，發布須經官網後台「工具管理」上傳（見公開版本規則第 8 條）。
- 舊網址：`https://tools.sytaxes.com/` 與 `https://sytax-academy.github.io/shengyan-tools/` 為同一 GitHub Pages 站，115/10/13 起只提供 `docs/` 之轉址頁（見「舊網址轉址頁」段）；自訂網域照舊。
- Deployment branch：`main`
- Deployment source：`/docs`（115/10/13 由 `/(root)` 切換；使用者截圖確認 Custom domain 仍為 tools.sytaxes.com、DNS check successful、Enforce HTTPS 勾選；pages build and deployment #83 成功）
- 免費四支（1-1、1-3、2-1、resolution）之原檔仍為本 repo `/〔代號〕/index.html`；會員五支（2-2、3-2、4-1、4-3、4-4）之原檔自 115/10/13 起移至私人 repo [shengyan-tools-member](https://github.com/sytax-academy/shengyan-tools-member) 之 `/〔代號〕/index.html`（見「會員工具正本私人化」段）。兩者之版本與 SHA-256 均以本檔為唯一權威；切換後均不由 Pages 對外提供。

## Current Deployments

| Tool ID | 工具名稱 | Current Release | GitHub Path | 正式網址 | 類別 | Last Deployed | Status |
|---|---|---|---|---|---|---|---|
| 1-1 | 開公司決策工具 | `v3.6.11` | `/1-1/` | `https://sytaxes.com/tools/1-1/` | 免費 | `2026-10-07` | LIVE |
| 1-3 | 有限公司設立互動工具 | `v1.1.0` | `/1-3/` | `https://sytaxes.com/tools/1-3/` | 免費 | `2026-10-18` | PENDING（官網現為 v1.0.20；待 115/10/23 凍結後之交付包上傳核對，見公開版本規則第 8 條） |
| 2-1 | 地址登記決策工具 | `v2.1.10` | `/2-1/` | `https://sytaxes.com/tools/2-1/` | 免費 | `2026-10-07` | LIVE |
| 2-2 | 投保級距試算工具 | `v1.10.1` | 私人 repo `/2-2/` | `https://sytaxes.com/tools/go/?t=2-2` | 會員 | `2026-10-12` | LIVE |
| 3-2 | 常見費用報帳與抵稅速查工具 | `v1.5.48` | 私人 repo `/3-2/` | `https://sytaxes.com/tools/go/?t=3-2` | 會員 | `2026-10-12` | LIVE |
| 4-1 | 損益兩平互動試算工具 | `v1.6.15` | 私人 repo `/4-1/` | `https://sytaxes.com/tools/go/?t=4-1` | 會員 | `2026-10-18` | PENDING（官網現為 v1.6.14；上傳時點由總對話安排，見公開版本規則第 8 條） |
| 4-3 | 現金流量預算表 | `v1.13.9` | 私人 repo `/4-3/` | `https://sytaxes.com/tools/go/?t=4-3` | 會員 | `2026-10-12` | LIVE |
| 4-4 | 停業、歇業與解散導航 | `v1.7.3` | 私人 repo `/4-4/` | `https://sytaxes.com/tools/go/?t=4-4` | 會員 | `2026-10-17` | PENDING（官網現為 v1.6.10；待 115/10/23 凍結後之交付包上傳核對，見公開版本規則第 8 條） |
| resolution | 公司決議程序與時程整理工具 | `v0.4.0` | `/resolution/` | `https://sytaxes.com/tools/resolution/` | 免費 | `2026-10-17` | PENDING（官網現為 v0.3.9；待 115/10/23 凍結後之交付包上傳核對，見公開版本規則第 8 條） |
| business-items | 營業項目查詢 | `v0.2.0`（開發中頁） | `/business-items/` | `https://sytaxes.com/tools/business-items/` | 免費 | `2026-10-17` | PENDING（官網尚未上傳；115/10/23 凍結後之交付包，見公開版本規則第 8 條） |
| penalty | 稅務罰則試算 | `v0.3.2` | `/penalty/` | `https://sytaxes.com/tools/penalty/` | 免費 | `2026-10-18` | PENDING（官網尚未上傳；115/10/23 凍結後之交付包，見公開版本規則第 8 條） |
| owner-salary | 負責人薪資與股利稅負試算 | `v0.4.0` | 私人 repo `/owner-salary/` | 未設定（官網路徑、卡片與門禁待 🌐 官網經營設定） | 會員 | `2026-10-18` | 未上線（不在 115/10/23 交付批；上線時依公開版本規則第 8 條辦理） |

上表 LIVE 之九支（1-3 為 v1.0.20）於 115/10/13 經使用者以官網管理員身分於瀏覽器主控台取回 `https://sytaxes.com/tools/〔代號〕/`：狀態碼均 200，位元組數與 SHA-256 均與下表（1-3 為前一版 v1.0.20：53,405 位元組，SHA-256 `e9868abf2b482c9de887b6454253b86dfc831896412ac85d084d6eea4dffd015`）相符，即官網版核對通過（公開版本規則第 8 條）。

## Release Identity（SHA-256）

以各工具 `index.html` 之 SHA-256 為準。

penalty 列為 115/10/18 合入之 v0.3.2（稅務罰則試算，免費），取代原定交付之 v0.3.1：來源分支 test/penalty-v2（commit 4d1522bdc594b336dc29af4d03b82dc28655aa71），只改 penalty/index.html；meta robots index,follow、tool-version「penalty v0.3.2」；新增法條全文連結（law.moj.gov.tw、law-out.mof.gov.tw，只於點擊時另開新分頁，不傳送輸入）與列印時展開依據說明；計算與金額不變。依據為 shengyan-knowledge「inbox/penalty/」之契約 c30（knowledge f51fa67：規格 v2_30、驗證表 v2_28、法源登錄 v0_28、配色驗證表 v2_1）；驗證摘要依 inbox/批次狀態/penalty.md（commit 93e447c）所載：執行紀錄 v0_26、v0_27，程式判定列全部通過，獨立代測與 Firefox 136.0 實測通過；變動範圍兩方覆審採納表 v1_1；使用者 115/10/18 實機 M02、M04、M05 通過，M06 依使用者裁定改為代查並抽點 5 個全部正確（代查紀錄 v1_1），P19 iOS 未執行經裁定接受，M03 待上傳後。位元組數與 SHA-256 為自 commit 4d1522b 之 git blob 實算。合入前確認 Project Instruction 現行為 v2.3；本段與合入同一 commit。官網尚未上傳，待 115/10/23 凍結後之交付包（第 8 條）上傳並核對通過後改記 LIVE。前一版 v0.3.1（275,342 位元組，SHA-256 14aa650370f0dc6dd986bce19827fededa9ba058d87e9aa17df93181f1c8339b）之段落保留不改。

4-1 列為 115/10/18 合入私人 repo 之 v1.6.15（損益兩平互動試算工具，會員；原檔住私人 repo shengyan-tools-member）：只改 #step-fixed 提示句為「精確金額請查 2-2 投保級距試算工具。」並加連往 https://sytaxes.com/tools/go/?t=2-2 之內文連結（另開新視窗）、連結樣式與版本兩處；meta robots noindex,nofollow；以私人 repo merge commit 5d4315c2371f07d0c218624cc15c5b4e78801c07 合入私人 repo main（公開版本規則第 9 條）；依據為 shengyan-knowledge「inbox/4-1連結/」之契約 c1（knowledge a265aaf：規格 v0_2；驗證表 v0_3）；驗證摘要依 inbox/批次狀態/4-1.md（75e0497）所載：L01～L14 全數通過、E0～E10 全數抓到（代測判讀 v0_2），使用者 M01 實機 115/10/18 通過，GPT 變動範圍覆審採納表 v1_0；位元組數與 SHA-256 為自私人 repo commit c3e2198 之 git blob 實算；合入前確認 Project Instruction 現行為 v2.3；官網現為 v1.6.14，上傳後辦 M02 與未登入直開門禁測項。

1-3 列為 115/10/18 合入之 v1.1.0（有限公司設立互動工具，免費）：來源分支 test/1-3-v1.1（commit 70a470fffb03ab5dda6e0cea539c4d7eda9af540），只改 1-3/index.html、1-3/README.md；meta robots index,follow、tool-version「1-3 v1.1.0」。依據為 shengyan-knowledge「inbox/1-3改版/」之契約 v0.30、《驗證表》v1_29、ext_c30（knowledge 352e7ee）。驗證摘要依 shengyan-knowledge inbox/批次狀態/1-3.md（commit e365bc5）所載：115 列，109 通過、0 未通過、5 未執行（V46、V55、V56、V57、V103 人工列，均有使用者確認），V26 不適用，代測判讀 v1_15；定稿兩方審查第十輪採納表 v1_0；使用者 115/10/18 實機核可。位元組數與 SHA-256 為自 commit 70a470f 之 git blob 實算。合入前確認 Project Instruction 現行為 v2.3；本段與合入同一 commit。官網現為 v1.0.20，待 115/10/23 凍結後之交付包（第 8 條）上傳並核對通過後改記 LIVE。前一版 v1.0.21（53,405 位元組，SHA-256 72ac018424b7bd5f7c24cd39b929a5e37227dc8aa6410a6184e30a0c61ee790f）之段落保留不改，見下方 115/10/13 官網搬遷轉址批段。

owner-salary 列為 115/10/18 合入私人 repo 之 v0.4.0（會員工具；原檔住私人 repo shengyan-tools-member）；meta robots noindex,nofollow；以私人 repo merge commit bab6afa782bfd76bec08ffd05c36744242247d75 合入私人 repo main（公開版本規則第 9 條）；依據為 shengyan-knowledge「inbox/owner-salary/」之契約 c4（knowledge ce82be1：規格 v0_20、法源登錄 v0_12、驗證表 v0_12）；驗證摘要依 inbox/批次狀態/owner-salary.md（d2b013b）所載：181 列 180 通過、0 未通過、1 未執行（M02，上線時辦理），M01 以模擬實走代替（使用者 115/10/17 指示），第三輪變動範圍兩方覆審採納表 v1_1；位元組數與 SHA-256 為自私人 repo commit d749027 之 git blob 實算；合入前確認 Project Instruction 現行為 v2.3；尚未上線，官網路徑、卡片與門禁待 🌐。

owner-salary 列為 115/10/17 合入私人 repo 之 v0.3.0（會員工具；原檔住私人 repo shengyan-tools-member）；meta robots noindex,nofollow；以私人 repo merge commit 3ab7c38fabf8c68d9be42d86179d2b548f14c885 合入私人 repo main（公開版本規則第 9 條）；依據為 shengyan-knowledge「inbox/owner-salary/」之契約 c3（knowledge aae12a7：規格 v0_19、法源登錄 v0_11、驗證表 v0_11）；驗證摘要依 inbox/批次狀態/owner-salary.md（e731c44）所載：176 通過、0 未通過、2 未執行，M01 以模擬實走代替（使用者 115/10/17 指示），第二輪變動範圍兩方覆審採納表 v1_1；位元組數與 SHA-256 為自私人 repo commit c854d0f 之 git blob 實算；合入前確認 Project Instruction 現行為 v2.3；尚未上線，官網路徑、卡片與門禁待 🌐。

penalty 列為 115/10/17 首次合入之 v0.3.1（稅務罰則試算，免費）：來源分支 test/penalty-v1（commit a9cf27e9aded4dc9dc319693d744f5ffcb713b35），只新增 penalty/index.html；meta robots index,follow、tool-version「penalty v0.3.1」。驗證摘要依 shengyan-knowledge inbox/批次狀態/penalty.md（commit aaf048a）所載：契約 c28（knowledge 53b6b16）；自驗 412 通過、0 未通過、7 未執行，獨立代測 0 未通過，Firefox 136.0 實測通過；使用者 115/10/17 實機 M02、M04、M05 通過，P19 iOS 未執行經裁定接受，M03 待上傳後。位元組數與 SHA-256 為自該 commit 之 git blob 實算；該分支自舊 main 0016d09 分出，樹內之會員舊目錄（2-2、3-2、4-1、4-3、4-4）自合併基準起未改動，三方合併後 main 之刪除保留。合入前確認 Project Instruction 現行為 v2.3；本段與合入同一 commit。官網尚未上傳，待 115/10/23 凍結後之交付包（第 8 條）上傳並核對通過後改記 LIVE。

resolution 列為 115/10/17 合入之 v0.4.0（公司決議程序與時程整理工具，免費）：來源分支 test/resolution-v2（commit ba723ac2f0b1de62af589ed4e09612bbb1c4d8bd），只改 resolution/index.html、resolution/README.md；meta robots index,follow、tool-version「resolution v0.4.0」。驗證摘要依 shengyan-knowledge inbox/批次狀態/resolution.md（commit b1dc46d）所載：契約 c11（knowledge cac1cde）；《驗證表》v1_27 248 列，240 通過、0 未通過、8 未執行，代測判讀 v0_28 逐列相同；使用者 115/10/17 實機並排核可。位元組數與 SHA-256 為自該 commit 之 git blob 實算。合入前確認 Project Instruction 現行為 v2.3；本段與合入同一 commit。官網現為 v0.3.9，待 115/10/23 凍結後之交付包（第 8 條）上傳並核對通過後改記 LIVE。前一版 v0.3.9（129,328 位元組，SHA-256 ecd075a6014ad112a99f4c84ecf3e19656ce3f4b371e37a8ae74d56ca271f44d）見本檔 git 歷史（commit 31cce5d）。

4-4 列為 115/10/17 合入之 v1.7.3（會員工具；原檔住私人 repo shengyan-tools-member）：日期改為民國三欄輸入、期限試算與結果頁改寫、增設預約諮詢連 https://sytaxes.com/contact-us/（不帶參數，任何畫面恰一個）、會員工具說明句改為「LINE 或 Email」版；meta robots noindex,nofollow；無瀏覽器儲存、無對外請求。依據為 shengyan-knowledge「inbox/4-4/改版/」之契約 c12～c16 與《驗證表》v1_19（凍結於 commit 9a5e4ba，113,107 位元組；122 列程式判定列全數通過，刻意錯誤版 77 份全數抓到）；使用者 115/10/17 實機 F119、F120 通過；定稿兩方審查與變動範圍覆審均「修正後可定稿」，修正已入契約 c14～c16。位元組數與 SHA-256 為自私人 repo 測試分支 test/4-4-v1.7（commit d858ee1）之 git blob 實算；115/10/17 以私人 repo merge commit ddcf3f724d51fc5d26b9c47a26b8a3ed7b67903a 合入私人 repo main（公開版本規則第 9 條）；合入前確認 Project Instruction 現行為 v2.3。官網現為 v1.6.10，待 115/10/23 凍結後之交付包上傳並核對通過後改記 LIVE。前一版 v1.6.10（105,153 位元組，SHA-256 1e01de6ed2657d305a5a4ffd5ab6fd7553215e00b2596c9e9d469dd4e72bfd57）見本檔 git 歷史（commit c98ef73）。

business-items 列為 115/10/17 首次合入之開發中頁 v0.2.0（營業項目查詢，免費；正式版 v1.0.0 尚未合入）：頁面說明本工具開發中、列出完成後之用途三項，預約諮詢連 https://sytaxes.com/contact-us/ ，「看全部工具」連 https://sytaxes.com/interactive-tools/ ；meta robots noindex,nofollow、tool-version「business-items v0.2.0」；無瀏覽器儲存、無對外請求。依據為 shengyan-knowledge「inbox/工具十三/」之《營業項目查詢工具_規格》v1_10（契約 c9）、《驗證表》v1_6、ext_c9b（凍結於 commit 68605af）；開發中頁驗證 D01～D06 通過（Code 自驗與代測一致；代測判讀 inbox/工具十三/代測_b43ef1c/代測判讀_v1_0.md，commit 3fdf797）；使用者 115/10/17 實機確認；定稿審查以第二批設計審閱代之（使用者裁定 R4 甲；採納表 inbox/工具十三/第二批設計審閱/，commit d7d71fc）。位元組數與 SHA-256 為自測試分支 test/business-items-v1（commit b43ef1c）之 business-items/dev/index.html 之 git blob 實算，以同一內容存為本 repo /business-items/index.html；該分支之正式版 business-items/index.html（v1.0.0）、dev/ 與 build/ 均未合入。合入前確認 Project Instruction 現行為 v2.3；本段與合入同一 merge commit。官網尚未上傳，待 115/10/23 凍結後之交付包（第 8 條）上傳並核對通過後改記 LIVE。

2-2 列為 115/10/12 增設第三模式「用人成本（多人）」（v1.9.2 → v1.10.0；網址 `https://tools.sytaxes.com/2-2/?mode=cost`；一次算出正職、兼職、外包之每月用人預算，分每月固定與依工時件數兩欄；PARAMS 區塊換為逐字內嵌之《勞健保年度參數》v1_4；受僱者、負責人兩模式之計算與結果文字未改，頁尾官方工具清單之補充保費括號改為「（受僱者、負責人模式未納入補充保費）」）。依據為 shengyan-knowledge「inbox/2-2用人成本/」之《規格》v0_4（契約 c2）、《驗證表》v0_2、《法源登錄》v0_2（凍結於 commit 669a1aa）；驗證執行紀錄 v0_2 見 commit 8c89ea8（驗證表 62 列：通過 60、未通過 0、未執行 2；未執行為 M02、M03，其中 M02 另由總對話代測通過，見代測紀錄 v1_0，commit 67ad6e0；舊版回測 v1.9.2 與 3c17296 之涉本輪改動各列未通過；刻意錯誤一至十三全數抓到；內容同一性 V05 受僱者 3,208 與負責人 4,358 狀態新舊差異 0）。位元組數與 SHA-256 為合入前自測試分支 test/2-2-cost（commit 581698f06657e26fa6191d5299698c24a266d3c6）之 git blob 實算。使用者 115/10/12 裁定 Z02 採甲、並指示合入；合入前確認 Project Instruction 現行為 v1.6（115/10/12）。115/10/12 以 merge commit a28edf8 合入 main；使用者 115/10/12 公開頁 smoke（M03）：本機 Windows PowerShell 自 tools.sytaxes.com 取回 2-2/index.html，位元組數 165,978、SHA-256 與上表相符；瀏覽器開 2-2/?mode=cost，頁尾版本 v1.10.0、官方工具清單補充保費括號為「（受僱者、負責人模式未納入補充保費）」；E01 路線由總對話代測紀錄承接（knowledge commit 67ad6e0），smoke 紀錄見 knowledge inbox/會員工具noindex/公開頁smoke紀錄_115-10-12_v1_0.md（commit 30f42a7）；改記 LIVE。前一版 2-2 v1.9.2（128,206 位元組，SHA-256 `56dc9b7022200b82bb07a873eb758d17b978c3836293ebfb04f3742ab9b2ceb1`）見 git 歷史（commit 0016d09）。

九支（1-1 v3.6.11、1-3 v1.0.20、2-1 v2.1.10、2-2 v1.9.2、3-2 v1.5.47、4-1 v1.6.13、4-3 v1.13.8、4-4 v1.6.9、resolution v0.3.9）為 115/10/07 外殼一致化 C 批（只改外殼：側欄甲乙丙三區、乙區列出全部可能步驟與「結果」、到達結果時未走到之步驟標「本次不適用」、乙區捲動提示獨立一列、側欄版面條件改為寬 981 以上且高 640 以上、免責短版加「你輸入的資料只在這個頁面使用，不會送出。」、頁尾依序免責長版、署名、預約、版本行並置中、版本行兩段格式；2-1 判斷原則移主欄可收合卡、預約改回側欄；resolution meta robots 改 index,follow、tool-version 去「-test」、官方依據連結移至頁尾之上；題目、選項、結果、計算與法源文字未改，未改色）。依據為 shengyan-knowledge「inbox/外殼一致化C批/」之《外殼規格》v1_0 與《驗證表》v1_0（凍結於 commit 744faed）；功能規格抽取 v1_0 見 commit fe6bae8；驗證執行紀錄與驗證總表 v1_1 見 commit 09e1d7f。驗證結果（只有 Chromium；45 種尺寸加兩種縮放）：通過 196、未通過 1、未執行 4。未通過為 1-3 SB06（1440×640 側欄乙區只完整露出 2 步），使用者 115/10/07 裁定接受，留 D 批處理；H05（resolution 版本行逐字）原判未通過，因名詞解釋程式自動插入說明字，使用者 115/10/07 裁定扣除插入字判定後通過；未執行為 1-3 C06（無「第 N 步」字樣）與 D03 三支（1440×900 乙區皆超出，觸發不了）。內容同一性 X01～X06 全數通過（依序作答四支全路徑窮舉：1-1 25,531、2-1 2,029、4-4 198、resolution 382 狀態，新舊差異 0）。位元組數與 SHA-256 為合入前自測試分支 test/shell-c 之 git blob 實算（九支 index.html 與已驗證之 commit d3a6980 相同）；使用者 115/10/07 實機並排核可合入，上開未通過與未執行經使用者裁定後合入，作為公開版本規則第 5 條之核可；合入前確認 Project Instruction 現行為 v1.6（115/10/07）。九支前一版（1-1 v3.6.10、1-3 v1.0.19、2-1 v2.1.9、2-2 v1.9.1、3-2 v1.5.46、4-1 v1.6.12、4-3 v1.13.7、4-4 v1.6.8、resolution v0.3.8）之位元組數與 SHA-256 見 git 歷史（commit f3ce5d8）。115/10/07 合入 main（PR #12，merge commit e64a091）；GitHub Pages 部署（pages build and deployment #72，commit e64a091）成功（build、report-build-status、deploy 三項）；使用者 115/10/07 公開頁 smoke：本機 Windows PowerShell 自 tools.sytaxes.com 取回九支 index.html，位元組數與 SHA-256 與上表全部相符；手機走 1-1、2-1 至結果頁，頁尾版本號與版面正常；改記 LIVE；以下各段為前一版之紀錄，保留為歷史。

（前一版紀錄）下表 3-2、4-1、4-3、4-4 四列為 115/10/01 墨灰改版改色第一批（該批原含 2-2 v1.8.9，2-2 自 v1.9.1 起見下段）（只改色彩層，依《聖彥學堂 Design System v2.0》定稿 r8；驗證表 shengyan-knowledge「inbox/墨灰改版/墨灰改版_改色驗證表_v1_0」凍結於 commit f7efa17、補充（Z5）v1_0 凍結於 commit 0e65d2d；執行紀錄 v1_1 見 commit 24d5f2b）合入前自測試分支 test/ink-gray-1（commit 5e5f8ab）之 git blob 實算；使用者 115/10/01 S01 實機核可；合入前確認 Project Instruction 現行為 v1.5。115/10/01 合入 main（PR #9，merge commit 4bfd9dd）；GitHub Pages 部署（pages build and deployment #64，commit 4bfd9dd）成功；使用者 115/10/01 S02 公開頁 smoke：五支版號正確、配色正確、走至結果頁正常，4-4 桌機寬度側欄右緣分隔線可見；改記 LIVE。五支前一版（2-2 v1.8.8、3-2 v1.5.45、4-1 v1.6.11、4-3 v1.13.6、4-4 v1.6.7）之位元組數與 SHA-256 見 git 歷史（commit e892050）。

1-1、1-3、2-1 三列為 115/10/02 墨灰改版改色第二批（1-1 v3.6.9 → v3.6.10、1-3 v1.0.18 → v1.0.19、2-1 v2.1.8 → v2.1.9；只改色彩層，依《聖彥學堂 Design System v2.0》定稿 r8；容許差異 Z1 版本字串、Z5 1-1 與 1-3 側欄右緣 inset 1px paper-300、Z6 README 版號；2-1 側欄既有右緣框線換色 paper-300）。驗證表為 shengyan-knowledge「inbox/墨灰改版/」之《墨灰改版_改色驗證表》v1_0（第二批射程）、補充（Z5）v1_0 與第二批補充 v1_2（凍結於 commit c1b5c4a）；色彩處置表 1-1 v1_3、1-3 v1_1、2-1 v1_1（2-1 含使用者 115/10/01 裁定 D1 至 D5）；驗證總表與執行紀錄 v1_0 見 commit ad1542f（三支合計通過 96、未通過 4、未執行 29；只有 Chromium）。未通過四項：M22 三支（停用按鈕以透明度表示，透明度不在本批容許差異，原樣保留，舊版同樣未通過）與 W05 2-1（手機頂列未來小籤合成後 3.24，使用者裁定 D5 甲照實記未通過，登錄既有缺陷 K11）；既有缺陷 K12（2-1 .btn:hover 覆蓋主要按鈕 hover）本批不修。位元組數與 SHA-256 為合入前自測試分支 test/ink-gray-2 於 rebase 至 main 93bbe20 後之 git blob 實算（三支 index.html 與已驗證之 commit 6f8c256 之 blob 相同）；使用者 115/10/02 S01 實機並排核可；合入前確認 Project Instruction 現行為 v1.5。115/10/02 合入 main（PR #11，merge commit 1e0ea54）；GitHub Pages 部署（pages build and deployment #68，commit 1e0ea54）成功；使用者 115/10/06 S02 公開頁 smoke：本機 PowerShell 取回三支之位元組數與 SHA-256 與本表相符，iPhone 走至結果頁之頁尾版本號正確、無深藍殘留、文字清楚；改記 LIVE。三支前一版（1-1 v3.6.9、1-3 v1.0.18、2-1 v2.1.8，預約入口每畫面一個小批）之位元組數與 SHA-256 見 git 歷史（commit 93bbe20）。

2-2 列為 115/10/02 參數集中化（v1.8.9 → v1.9.1；年度參數改由單一 PARAMS 區塊承載，逐字內嵌正本《勞健保年度參數_v1_2.json》；職災保費改引 share.occUnit、share.occUnion；畫面與計算結果與 v1.8.9 相同，版本字串除外）。驗證表 shengyan-knowledge「inbox/2-2參數集中化/2-2參數集中化_驗證表_v1_3」凍結於 commit 6d34d40，A01～A04、B01～B13、C01～C09、D01、D02 全數通過，執行紀錄 v1_3 見 commit 6f122e4；位元組數與 SHA-256 為合入前自測試分支 test/2-2-params（commit 5d4053d）之 git blob 實算。E01～E03 為 Claude 代測（115/10/02）：E01 於使用者 Windows Chrome 並排兩版，受僱者與負責人路線之結果頁文字只差版本字串，負責人頁有一處 0.026px 次像素寬度差，使用者接受並判通過；E02 為 390×844 內嵌框之模擬代測，非實體手機；E03 於使用者 Excel 2019 開啟 xlsx v1.5.0 並修改 B63、B5，連動正確且無錯誤值。使用者 115/10/02 依上開結果核可合入（原文：「同意合入，請你幫我執行。」），作為公開版本規則第 5 條之並排核可；合入前確認 Project Instruction 現行為 v1.5。115/10/02 合入 main（PR #10，merge commit a085eb0）；GitHub Pages 部署（pages build and deployment #66，commit a085eb0）成功；使用者 115/10/02 公開頁 smoke（tools.sytaxes.com/2-2/）：頁尾版本 v1.9.1、受僱者月薪 35,000 之公司每月實際人事成本 42,196 元、負責人代表組合之保費總額 5,391 元，三項正確；改記 LIVE。既有缺陷 K07（#bMaxWrap 於員工數 0 時 opacity .45）經使用者裁定本批不修。前一版 2-2 v1.8.9 之位元組數與 SHA-256 見 git 歷史（commit d792ad0）。

resolution 列為 115/10/06 新上線之公司決議程序與時程整理工具 v0.3.8（內容凍結版 v0.2.13，commit 1139b1ed8fb0fd509b8bf3c08a7e0419261715d4；v0.3.8 以之為底只改色彩層，依《聖彥學堂 Design System v2.0》定稿 r8，容許差異為版本字串與側欄右緣 inset 1px paper-300）。驗證表為 shengyan-knowledge「inbox/resolution_v1_8/」之《驗證表》v1_16（207 列，連同附錄 G 治理掃描程式與清單凍結於 commit 180e4b8）與「inbox/resolution_v0_2/」之《配色補充驗證表》v1_3（commit 3f2a1c3）；執行紀錄 v0_18 見 commit fb8d0ea。原驗證表：通過 204、未通過 1、未執行 2。未通過為 T94（期望字面與畫面不符，使用者 115/09/30 裁定驗證表誤植，工具不改）；未執行為 T73、T147（期望對象為正式網址，部署後執行；未執行不視為通過）。附錄 G 2,232 頁未通過 0 行。配色補充驗證表 P01～P17、P19 通過（P13 依使用者裁定甲以對照檔判定），P18 經使用者 115/10/06 以 iPhone Safari 實機判讀通過。位元組數與 SHA-256 為合入前自測試分支 test/resolution-v1（commit 8b4ab95033abea470feb64e68f797e8722f71792）之 git blob 實算；使用者 115/10/06 核可合入；合入前確認 Project Instruction 現行為 v1.6（115/10/06）。115/10/06 合入 main（merge commit 5e8a553，同一 commit 更新本檔）；GitHub Pages 部署（pages build and deployment #69，commit 5e8a553）成功；使用者 115/10/06 公開頁確認：PowerShell 取回 124,793 位元組、SHA-256 與上表相同，瀏覽器頁尾版本 v0.3.8、配色正確、可走至結果頁。部署後 T73、T147 均通過（執行紀錄 v0_19、v0_20 見 shengyan-knowledge commit ced6981、5e09627）：T73 於正式網址走 M1～M6 各一條路線至結果頁，初始導覽以外之請求 0；T147 部署 commit 之檔無自動取得第二個檔案之參照，正式網址取回之檔與該 commit 位元組數及 SHA-256 相同。改記 LIVE。版本 meta 之「-test」字樣依使用者裁定併入下一小批。本工具無前一公開版。

1-3 列為 115/10/13 官網搬遷轉址批（v1.0.20 → v1.0.21；只把 tool21、tool11 兩個連結由 `https://tools.sytaxes.com/2-1/`、`https://tools.sytaxes.com/1-1/` 改為 `https://sytaxes.com/tools/2-1/`、`https://sytaxes.com/tools/1-1/`，並推進 meta tool-version 與頁尾版本行；位元組數不變）。依據為 🌐 官網經營 115/10/13「主機定案」交接；驗證表為 shengyan-knowledge「inbox/官網搬遷轉址/」之《驗證表》v1_3（凍結於 commit 8bb9209；v1_0～v1_2 見 4205709、927bebd、d62c79b），R12、R13、R14 通過；審查採納表 v1_2（GPT 與 Fable 5.1 三輪）與執行紀錄 v1_3（commit 607d587）同目錄。位元組數與 SHA-256 為合入前自測試分支 test/site-move（commit f8602caee70a7198a12f8f429ba0e1489c7d6417）之 git blob 實算。使用者 115/10/13 核可合入；合入前確認 Project Instruction 現行為 v1.6。官網現為 v1.0.20，待使用者經官網後台上傳 v1.0.21 並核對官網版位元組數與 SHA-256 後改記 LIVE。

3-2、4-1、4-3、4-4 四列為 115/10/12 會員工具 noindex 第一批（只改 head 內 meta robots 一行，由 `index,follow` 改為 `noindex,nofollow`，並各推進一個修訂號：3-2 v1.5.47 → v1.5.48、4-1 v1.6.13 → v1.6.14、4-3 v1.13.8 → v1.13.9、4-4 v1.6.9 → v1.6.10；其餘位元組不變）。驗證表為 shengyan-knowledge「inbox/會員工具noindex/」之《驗證表》v1_0（凍結於 commit e19328d）；執行紀錄 v1_0 與總對話代測紀錄 v1_0（commit 67ad6e0）同目錄。測試分支 test/noindex-member4 @13bc678。2-2 不在本批；其 v1.10.0（test/2-2-cost）已於同日先行合入 main，meta robots 仍為 `index,follow`，另批加 noindex。公開頁 smoke 已於 115/10/12 由使用者本機 PowerShell 執行通過（四支位元組數與 SHA-256 與本表相符，meta robots 均為 `noindex,nofollow`；2-2 為 `index,follow`），紀錄見 shengyan-knowledge「inbox/會員工具noindex/公開頁smoke紀錄_115-10-12_v1_0.md」（commit 30f42a7），四列改記 `LIVE`。

2-2 列為 115/10/12 會員工具 noindex 第二批（只改 head 內 meta robots 一行，由 `index,follow` 改為 `noindex,nofollow`，並推進一個修訂號：v1.10.0 → v1.10.1；meta tool-version 與頁尾版本行同步，程式註解內之 v1.10.0 為用人成本模式起始版本，不改；其餘位元組不變，+4）。驗證表為 shengyan-knowledge「inbox/會員工具noindex/」之《第二批2-2_驗證表》v1_0（commit 69e44e0），執行紀錄與總對話代測紀錄同目錄；測試分支 test/noindex-2-2（commit aa15d67d1a59c3458b0730ca823ff448b9e6e1c7）。公開頁 smoke（M02）由使用者 115/10/12 於本機 PowerShell 通過（位元組數 165,982、SHA-256 與本表相符、meta robots 為 noindex,nofollow），改記 LIVE。

| Tool ID | Release | Bytes | SHA-256 |
|---|---|---:|---|
| 1-1 | `v3.6.11` | 91,411 | `183bc2fc31c1979a445b6e36e26c8b16fca1fbf089a2cd3d579d74ae4ce8561f` |
| 1-3 | `v1.1.0` | 63,613 | `b10c64f1684c20dbb166efad5df028b814daf28d0296146ab0f9d0342d9ad0f2` |
| 2-1 | `v2.1.10` | 131,405 | `aff86ae78323bd64ece6e3bfd17f71ca977dc40417bd9d176e4e10375371a97a` |
| 2-2 | `v1.10.1` | 165,982 | `f448d196467097dc75077f270f4363cc1c98417cbc193239223000b45a6e50c9` |
| 3-2 | `v1.5.48` | 944,231 | `b8231b8c6295b4d12abd6407f59518c3be31c44cae99991bf390e2954b66a471` |
| 4-1 | `v1.6.15` | 140,035 | `3078e74e3657a7532a9d3c329539eb775d6c32f68e3b675ed7cfd86682c4bb7b` |
| 4-3 | `v1.13.9` | 1,022,028 | `843994edd35c1afea9e049649c01952b3a67eb0b09fb6b736afff5f4c503adf1` |
| 4-4 | `v1.7.3` | 115,786 | `e24d589d403a0b70f2f0004a6b323433f294d3e78fd15b5d1441a6bb313cafac` |
| resolution | `v0.4.0` | 161,572 | `b2e8d668812942ddc3e07c023e0bfac1d2f5193d75eb673b1ad0b9635e9d64f0` |
| business-items | `v0.2.0` | 4,705 | `80635e0f453108fc8c2632e95d1731dcc2c32e9a2b4adf7e4bbae5a680a15800` |
| penalty | `v0.3.2` | 281,443 | `7393e88546b21e496879d03a6c2e438c1697e015846db04ac8873c526e5c4a86` |
| owner-salary | `v0.4.0` | 92,323 | `2c86ebbb617decc1559f1aeb258b7b5c94bcd75c50190caf880b0a332d45e2f1` |

## 舊網址轉址頁

115/10/13 官網搬遷轉址批新增 `docs/`，合入後由使用者把 Pages 發布來源由 `main /(root)` 改為 `main /docs`，舊網址即只提供轉址頁：免費四支轉往 `https://sytaxes.com/tools/〔代號〕/`、會員五支轉往 `https://sytaxes.com/tools/go/?t=〔代號〕`（保留原查詢字串與錨點，會員頁剔除 t 參數）；`index.html`（舊站首頁）與 `404.html`（其他舊路徑之使用者救援，以 404 狀態碼送出）指向工具總覽 `https://sytaxes.com/interactive-tools/`。免費頁與首頁 canonical 指向新網址，會員頁 noindex；不再提供 sitemap。做法、依據與審查見 shengyan-knowledge「inbox/官網搬遷轉址/」（驗證表 v1_3 凍結於 8bb9209，R01～R20 通過；執行紀錄 v1_3 見 607d587；審查採納表 v1_2）。位元組數與 SHA-256 為合入前自測試分支 test/site-move（commit f8602ca）之 git blob 實算。115/10/13 切換發布來源（M02 通過，見網站資訊段）；同日使用者本機 Windows PowerShell 以 curl.exe 自 tools.sytaxes.com 取回 15 個網址（首頁、九支、2-2/index.html、robots.txt 為 200；sitemap.xml、DEPLOYMENT.html、1-1.html 為 404 並回傳 404.html），狀態碼、位元組數與 SHA-256 全數與下表相符（M03）；sytax-academy.github.io/shengyan-tools/2-2/ 回 301 轉往 tools.sytaxes.com（輸出於主控台截斷，目的地全文未見）。瀏覽器實走（M04）：tools.sytaxes.com/2-2/?mode=cost 一項通過（使用者 115/10/13 截圖：未登入落於 sytaxes.com/dashboard/，redirect_to 含 mode=cost；登入後為 sytaxes.com/tools/2-2/?mode=cost，選中「用人成本（多人）」）；sytax-academy.github.io/shengyan-tools/1-1/ 一項未執行（截圖未能確認其來源網址；官網經營 115/10/13 以 PowerShell 測得 github.io 六支均 301 轉往 tools.sytaxes.com，僅為佐證，不代替瀏覽器實走）。Firefox 與 iPhone Safari（M05）未執行（iPhone 結果未回傳；Firefox 未安裝）。故維持 DEPLOYED / PUBLIC SMOKE PENDING，M04 之 github.io 一項與 M05 通過後改記 LIVE；切換有異常時，於 Settings → Pages 改回 `main /(root)` 即回復原狀（root 之 CNAME、robots.txt、sitemap.xml 與免費四支原檔未動；會員五支原檔自 d1e7df4 起已移出本 repo，改回 root 時會員五支之舊網址將回 404）。

| 檔 | Bytes | SHA-256 | Status |
|---|---:|---|---|
| `docs/index.html` | 1,814 | `546c4f5570cc18398f67fc82e113af7a38a7261a4f3bc0348abd62e4b5e4df13` | LIVE |
| `docs/404.html` | 3,580 | `5e06277ff378032e5f5a5c1526e257634bebdd5f48ad3d722e28b44740e7b518` | LIVE |
| `docs/1-1/index.html` | 2,065 | `d921456ca766c12929c568022a18d0108a8a430f1f8a5fb596f0361b0b45ec9b` | LIVE |
| `docs/1-3/index.html` | 2,092 | `18dc2daf2c32f9f68b90fbe3f475444c4d25622b1dfcd570373d3f0553b325a6` | LIVE |
| `docs/2-1/index.html` | 2,074 | `ecbad4863086de053aa10af4358814b80218b17b8a43a6e9982372211e3c23fa` | LIVE |
| `docs/resolution/index.html` | 2,154 | `4aeff33ca5bd3c8c6c083127f647978dc609f1eb601e799bcdbd2faf4da66e29` | LIVE |
| `docs/2-2/index.html` | 2,418 | `abe588eca6c005c268199fff19ef1eff6f2be95f8ee0e70836ebe0f3f4c000f1` | LIVE |
| `docs/3-2/index.html` | 2,463 | `36c912cc9c712092321eb213fb472262a7c9b3a3f6ddf5410d5af5e26e13ff5c` | LIVE |
| `docs/4-1/index.html` | 2,436 | `cb85df1b095da3513ce6be6eb7d33dc5d79abc8cacd5223ed85da8358af42f20` | LIVE |
| `docs/4-3/index.html` | 2,409 | `ddbb6c55d5f7270f1c526a272a4ccb7a2e803007dfd646ecaf25c89a1e37b073` | LIVE |
| `docs/4-4/index.html` | 2,436 | `a981258722c6a07428af0e6ce6c3c56cb9a31ad38a9d66324e2614eefb80d221` | LIVE |
| `docs/robots.txt` | 23 | `16ceb5ee3e0dc13aa9adf31a3ebbe45a1d965b8c2b9f72eaf84e5911e140ed95` | LIVE |
| `docs/CNAME` | 18 | `5069e8f0748c48abe33f6725c0b864f8a92ca741d6c8d6938ba2040b48209dae` | LIVE |
| `docs/.nojekyll` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | LIVE |

上表十四列 115/10/13 改記 LIVE：M02（Pages 來源 /docs）、M03（tools.sytaxes.com 十五網址位元組數與 SHA-256 相符）、M04（電腦瀏覽器：tools.sytaxes.com/2-2/?mode=cost 經登入回用人成本模式；github.io/1-1 停在 sytaxes.com/tools/1-1/）通過，使用者 PowerShell 兩跳實測（github.io 301 → tools.sytaxes.com 轉址頁 → 官網）相符。M05 未執行（使用者無 iOS 裝置）：使用者 115/10/13 裁定不執行並放行（官網經營決策摘要第十節第 37 項）；M05 於執行紀錄仍記未執行，不視為通過。執行紀錄：shengyan-knowledge「inbox/官網搬遷轉址/」之《官網搬遷轉址_驗證執行紀錄_v1_6》。

## 會員工具正本私人化

115/10/13 使用者裁定乙方案提前（官網經營 115/10/13 回覆同意其分析與風險）：會員五支之正本自本 repo 根目錄移至私人 repo `sytax-academy/shengyan-tools-member`，再自本 repo main 移除，不改寫 git 歷史。理由：舊網址轉址頁與官網門禁均經實測無繞道後，公開 repo 根目錄之原檔仍可經 raw.githack 等服務直接開啟使用，為會員門禁唯一尚存之繞道。

- 驗證表：shengyan-knowledge「inbox/官網搬遷轉址/」之《會員工具私人化_驗證表_v1_0》，凍結於 commit bab097b。
- 複製：私人 repo commit 2e19a77，自本 repo main cf19d1c 以 git blob 逐位元組複製；新複製該 repo 後實算五支位元組數與 SHA-256 均與 Release Identity 段相符（P03）。
- 移除：本 repo 刪除 `2-2/index.html`、`3-2/index.html`、`4-1/index.html`、`4-3/index.html`、`4-4/index.html`，`docs/` 與免費四支不動；移除 commit d1e7df4。
- 驗證結果：P01～P07、P10、P12 通過（P07 為本段補記後判定）；P08 使用者 PowerShell 取 tools.sytaxes.com/2-2/、/4-4/ 均 200，內容分別含 tools/go/?t=2-2、tools/go/?t=4-4；P09 raw.githack 之 main 網址五支均 404；P10 使用者登入官網開 2-2，以受僱者月薪 32,545 走至結果頁（投保級距 33,300、公司每月實際人事成本 39,146 元、頁尾 v1.10.1），截圖未含網址列。回測：P04、P12 以 cf19d1c 執行均判未通過，P01 故意改錯一字元判未通過。執行紀錄見 shengyan-knowledge「inbox/官網搬遷轉址/」之《會員工具私人化_執行紀錄_v1_0》。
- 五支之版本、位元組數、SHA-256、官網網址與 LIVE 狀態不因此變動；官網版由官網「工具管理」承載，不讀本 repo。
- 會員工具之改版於私人 repo 進行；測試分支預覽不得使用 raw.githack（私人 repo 不提供），改為取回檔案於本機開啟（使用者登入 GitHub 下載該 commit 之檔案，或由 Claude 以檔案傳送）。由 Claude 傳送者，限掛 shengyan-tools-member 之 Code 會話 clone 固定 commit 後，以程式算位元組數與 SHA-256 與本檔相符再傳送（可由雜湊驗收，Sonnet 即可）；不得由對話端以連接器讀取後重建檔案（3-2 944,231 位元組、4-3 1,022,028 位元組逾連接器讀取上限，且工具回傳內容可能截斷）。私人 repo 之 main 同受「同時只能一個寫入者」約束，作業照現行 test/* 分支施作、合入前確認 main 無他批進行中。
- 已知殘留：以舊 commit 完整 SHA 指向之網址（如 raw.githack）仍可開啟舊檔，清除須改寫歷史，將使本檔與知識庫所記 SHA 失效，使用者與官網經營同意不改寫；第三方快取可能短期仍提供舊檔。
- 殘留檔移出（115/10/13，使用者裁定甲）：五支資料夾內之非工具檔九份——`2-2/README.md`、`3-2/README.md`、`4-1/README.md`、`4-3/README.md`、`4-4/README.md` 移至私人 repo 同路徑（commit 31a6f81），`4-4/驗證紀錄_v1_0_0.md`、`_v1_1_0.md`、`_v1_2_0.md`、`_v1_6_1.md` 移至 shengyan-knowledge `inbox/4-4/`（commit ccd7066）；均以 git blob 逐位元組複製，確認一致後自本 repo main 刪除（移除 commit 68503b6），本 repo 不再有會員五支之資料夾。驗證列 X01～X07 均通過，回測如預期（執行紀錄見 shengyan-knowledge「inbox/官網搬遷轉址/」之《會員工具殘留檔移出_執行紀錄_v1_0》）。驗證表：shengyan-knowledge「inbox/官網搬遷轉址/」之《會員工具殘留檔移出_驗證表_v1_0》，凍結於 commit 334714d。README 內容只搬不改，其中之版本與網址為搬移前之舊記載，以本檔為準。

## 網站地圖（歷史）

切換發布來源至 `/docs` 後，下列 root 之 `robots.txt` 與 `sitemap.xml` 不再對外提供（檔案保留為歷史；舊站不再提供 sitemap，新網址之 sitemap 由官網提供）。以下為切換前之紀錄。

根目錄 `robots.txt` 與 `sitemap.xml` 為 115/10/07 網站地圖小批新增，只列免費工具四支（1-1、1-3、2-1、resolution）；會員工具（2-2、3-2、4-1、4-3、4-4）不列，各工具 index.html 與 meta robots 於當時未改（115/10/12 會員工具 noindex 第一批已將 3-2、4-1、4-3、4-4 改為 `noindex,nofollow`，2-2 待另批，見 Release Identity 段；稅務罰則試算上線時另批加入）。依據為 shengyan-knowledge「inbox/sitemap/」之《tools網站地圖_驗證表》v1_0（凍結於 commit 21e07ad）；驗證執行紀錄 v1_0 見 commit 59b395f（SM01～SM05 通過；舊版回測 main 80590a3 SM01～SM04 未通過）。位元組數與 SHA-256 為合入前自測試分支 test/sitemap（commit ed8563a）之 git blob 實算；使用者 115/10/07 以 git blob 全文核對後核可合入；合入前確認 Project Instruction 現行為 v1.6（115/10/07）。115/10/07 合入 main（PR #13，merge commit 54d8cc4）；GitHub Pages 部署（pages build and deployment #74，commit 54d8cc4）成功（build、report-build-status、deploy 三項）；使用者 115/10/07 公開頁 smoke：本機 Windows PowerShell 自 tools.sytaxes.com 取回 robots.txt 與 sitemap.xml，狀態碼 200，位元組數與 SHA-256 與下表相符（SM06、SM07），所列四網址狀態碼均為 200（SM08）；改記 LIVE。

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
8. 115/10/13 起正式網址在官網：合入 main 後，經官網後台「工具管理」上傳該工具之 `index.html`（不指定上傳者：官網第二輪驗收前由網站公司整包上傳，驗收後由使用者上傳；使用者 115/10/13 核可官網經營決策摘要第十節第 34 項。網站公司整包上傳時，由工坊產出交付包：每支 index.html、清單〔官網路徑、位元組數、SHA-256，取自 git blob〕、一頁說明、凍結 commit；凍結點為官網經營通知之截止時點，凍結後才改者列下一批；交付包中之會員工具原檔，由掛私人 repo 之 Code 會話產出並以程式核對雜湊）（該工具正本 repo 之 git blob 原檔：免費工具為本 repo，會員工具為私人 repo `shengyan-tools-member`；不得修改或注入），再以官網管理員身分核對官網版之位元組數與 SHA-256 與本檔相符，並以瀏覽器開官網版走一條路線至結果頁；兩者皆通過，才改記 `LIVE`；核對不論上傳者為誰一律執行。官網不自動同步本 repo。（115/10/13 修訂：原檔改指正本 repo、增管理員身分與實走一條路線；實走與官網經營之驗收定義一致，即位元組數與 SHA-256 核對及另開頁實際操作一次，兩者皆通過）
9. 115/10/13 起會員五支（2-2、3-2、4-1、4-3、4-4）之正本與改版在私人 repo `shengyan-tools-member`，預覽依「會員工具正本私人化」段；以私人 repo 之 merge commit 為據，於其後第一個本 repo commit 更新本檔，並記私人 repo 之 commit（系統元控台 v5.25 第二點）。本檔為兩 repo 共同之衝突點，更新本檔之批次同時只能一個。

## Status

- `LIVE`：正式版本已確認、已部署且公開驗證 PASS（115/10/13 起，工具列指官網版之位元組數與 SHA-256 核對通過，且以瀏覽器走一條路線至結果頁通過（第 8 條）；舊網址轉址頁列指 Pages 公開頁 smoke 通過）。
- `DEPLOYED / PUBLIC SMOKE PENDING`：正式版本已部署，GitHub Pages deployment 成功，但公開頁面 smoke 尚未完成。
- `PENDING`：尚未部署。
- `HOLD`：有 blocker，不得正式發布。
- `RETIRED`：已下架但保留歷史紀錄。

> 本檔是公開部署地圖，不是法律／公式／Product Rule SOT，也不是完整 Audit Registry。
