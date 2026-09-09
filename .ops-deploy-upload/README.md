# OPS-DEPLOY temporary upload staging

Temporary staging area for exact, byte-identical Final Runtime uploads authorized for production deployment on 2026-09-09.

Upload only these three exact Final Runtime files here:

- `3-2_常見費用報帳與抵稅速查工具_v1.4.3_final-release.html`
- `4-1_損益兩平互動試算工具_v1.6.7_final-release.html`
- `4-3_現金流量預算表試算工具_v1.13.1_final-release.html`

Do not edit, re-save, minify, prettify, or rename file contents before upload. OPS-DEPLOY will verify Git blob byte equivalence, promote the exact blobs to the canonical production paths, then remove this staging area.
