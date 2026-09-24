#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ ! -d "$ROOT/agent-os" ]; then
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
  exit 0
fi

echo "== shell syntax =="
while IFS= read -r file; do bash -n "$file"; done < <(find "$ROOT/agent-os" "$ROOT/review/scripts" -type f -name '*.sh' -print)
echo "== JSON =="
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT/review/decision.schema.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT/agent-os/3-context/agents/manifest.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT/review/dependency-risk.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT/review/reviewer-selection.json"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT/review/agent-routing.json"
echo "== runtime tests =="
(cd "$ROOT/agent-os/5-runtime" && npm test)
echo "== review tool tests =="
(cd "$ROOT" && node --test review/scripts/*.test.mjs)
echo "== review profile sync tests =="
(cd "$ROOT" && node --test agent-os/1-loop/review-sync.test.mjs)
echo "== governance inventory checks =="
bash "$ROOT/review/scripts/verify-governance.sh"
echo "== platform verification passed =="
