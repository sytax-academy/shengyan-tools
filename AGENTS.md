# AGENTS.md（shengyan-tools；v1_0，由 Claude 端維護）

本 repo 為公開 repo，放聖彥學堂免費互動工具之程式、舊網址轉址頁（docs/）與全部互動工具共用之 DEPLOYMENT.md。給在本 repo 工作之 AI 代理（ChatGPT Codex 等）之規則如下；本檔由 Claude 端維護，代理不得修改本檔。

## 一、可以做的事

- 讀取全 repo、執行測試與建置。
- 在以 `codex/` 開頭之新分支提交，並開 Pull Request 至 main。

## 二、不可以做的事

- 不直接推送 main；不 rebase、不 force push；不刪除任何分支；不自行併入 PR。併入 main 由使用者或 Claude 端為之。
- 不修改規則檔：任何目錄之 CLAUDE.md、AGENTS.md、`.claude/`、`.mcp.json`，根目錄之 README.md 與 DEPLOYMENT.md，及 `.github/`（含新增 workflow）。
- 不改 repo 設定、Pages 設定、Actions 與 Secrets。
- 不放入任何客戶、學員或事務所內部資料；不放入會員工具之程式或內容（會員工具住私有 repo shengyan-tools-member，本 repo 為公開，分支與 PR 也是公開的）。工具屬會員或免費，以 DEPLOYMENT.md 為準，判不出者不寫，於 PR 說明提問。
- 不從其他 repo 搬入內容。

## 三、法規文字與數字

工具畫面之法條、函釋、稅率、金額、門檻、期限與結論文字，其依據與查證由 Claude 端負責。PR 改動上開任何一項者，於 PR 說明逐項列出「改了哪句、改前、改後、你的依據」，標明依據為官方頁面（附網址）或依記憶；Claude 端查證前不併入。版本號、位元組數與 SHA-256 之登錄（DEPLOYMENT.md）由 Claude 端於併入時為之，PR 不改。

## 四、每個 PR 必附

一、改了什麼、為什麼（白話三行以內）。
二、實際執行之測試指令與完整輸出；沒跑的測試寫「未執行」，不得寫「已通過」。
三、未完成或不確定之處，照實列出。

## 五、語言

說明與註解用台灣繁體中文、全形標點。
