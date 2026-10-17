#!/usr/bin/env python3
"""驗證用：獨立讀取母本 code_v8.xlsx（以欄名讀取），輸出 {代碼: [營業項目, 英文營業項目, 定義內容]} 之 JSON 至標準輸出。
不經 build.py，供 verify.js 判定 Q19、Q82 等列之「與母本逐字相同」。
用法：python3 -I master_dump.py 〔code_v8.xlsx〕
"""
import json
import sys

import openpyxl

ws = openpyxl.load_workbook(sys.argv[1], read_only=True).active
it = ws.iter_rows(values_only=True)
head = list(next(it))
ix = {h: head.index(h) for h in ("營業項目代碼", "營業項目", "英文營業項目", "定義內容")}
out = {}
for r in it:
    if r[ix["營業項目代碼"]]:
        out[r[ix["營業項目代碼"]]] = [r[ix["營業項目"]] or "", r[ix["英文營業項目"]] or "", r[ix["定義內容"]] or ""]
sys.stdout.write(json.dumps(out, ensure_ascii=False))
