#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "== required review files =="
for file in \
  .github/CODEOWNERS \
  .github/PULL_REQUEST_TEMPLATE.md \
  .github/workflows/ai-review.yml \
  review/decision.schema.json \
  review/policy.yaml \
  review/prompts/primary.md \
  review/prompts/deep.md; do
  test -f "$ROOT/$file"
done

echo "== shell syntax =="
while IFS= read -r file; do bash -n "$file"; done < <(find "$ROOT/review/scripts" -type f -name '*.sh' -print)

echo "== JavaScript syntax and JSON =="
while IFS= read -r file; do node --check "$file"; done < <(find "$ROOT/review/scripts" -type f -name '*.mjs' -print)
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT/review/decision.schema.json"

echo "== application review scaffold verification passed =="
