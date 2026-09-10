# audit_harness

Throwaway test harness built for the 2026-09-10 six-tool technical implementation
audit (`REVIEW-ONLY`). Outputs are in `../audit_output/`.

**This harness does not modify any production HTML.** It reads the six
`<Tool ID>/index.html` files over a local static server and writes only into
`results/`.

## Layout

| Path | Contents |
|---|---|
| `scripts/` | The Node + Playwright scripts actually run during the audit |
| `results/` | JSON reports and run logs (large regenerable artefacts are gitignored) |
| `inputs/` | *(gitignored)* the manifest-named 3-2 v1.5.6 blob, extracted read-only from git history |

## Reproducing

```bash
npx http-server -p 8099 -s .

# recreate the gitignored inputs
mkdir -p audit_harness/inputs
git cat-file blob $(git rev-parse cb8cfe7:3-2/index.html) \
  > audit_harness/inputs/3-2_v1.5.6_manifest_named.html

node audit_harness/scripts/extract.js '[{"id":"1-1","file":"1-1/index.html"},{"id":"2-1","file":"2-1/index.html"},{"id":"2-2","file":"2-2/index.html"},{"id":"3-2","file":"3-2/index.html"},{"id":"4-1","file":"4-1/index.html"},{"id":"4-3","file":"4-3/index.html"},{"id":"3-2v156","file":"audit_harness/inputs/3-2_v1.5.6_manifest_named.html"}]'
node audit_harness/scripts/static.js
node audit_harness/scripts/runtime.js
node audit_harness/scripts/flows2.js
node audit_harness/scripts/flows3.js
node audit_harness/scripts/flows4.js
node audit_harness/scripts/t22.js
node audit_harness/scripts/t41.js
node audit_harness/scripts/t43.js
```

Environment used: Node v22.22.2, Playwright 1.56.1, Chromium 1194.

## Note

`scripts/flows.js` contains the **superseded** programmatic-focus probe
(`element.focus()`), which produced false positives because Chromium does not
apply `:focus-visible` to programmatic focus. `flows2.js` supersedes it with a
real-keyboard Tab sweep. Both are kept so the correction is auditable — see
NR-02 in `../audit_output/Six_Tool_Audit_Findings.json`.
