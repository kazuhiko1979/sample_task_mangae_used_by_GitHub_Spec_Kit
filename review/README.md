# Automated PR review

This directory defines the provider-neutral contract for Claude CLI, Gemini CLI,
and Codex CLI reviews. The CLIs are adapters; `policy.yaml`, the rubric, and the
JSON schema are the review authority.

## Local run

The adapters expect the selected CLI to already be installed and authenticated.
They never install packages or modify the project.

```bash
bash review/scripts/run-review.sh --cli codex --mode primary --base origin/main
bash review/scripts/run-review.sh --cli claude --mode deep --base origin/main
bash review/scripts/run-review.sh --cli gemini --mode deep --base origin/main
node review/scripts/aggregate.mjs --output review-gate.json review-results/*.json
```

Gemini CLI invocation can be overridden with `GEMINI_CLI_BIN`; the default is
`gemini`. Claude and Codex use the existing non-interactive forms used by the
platform's delegate adapter.

## GitHub runner boundary

The PR workflow uses a dedicated self-hosted runner labelled `ai-review`. The
recommended deployment is an ephemeral or resettable VM/runner account with
no production credentials, no shared workspace, and only the minimum GitHub
runner permissions. Install and authenticate all three CLIs on that runner
outside PR code. Do not expose the runner to fork PRs.

The workflow uses `pull_request_target` and checks out the trusted base commit;
the PR head is fetched only as a Git object and passed to the reviewer as
untrusted diff data. Keep this boundary intact when changing the workflow.

AI CLI review is opt-in. It is disabled unless the repository variable
`AI_REVIEW_ENABLED` is set to `true`; when disabled, the AI jobs are skipped and
the gate reports that only deterministic checks completed. Before enabling it,
bring an `ai-review` runner online and authenticate all three CLIs. Configure
`AI_REVIEW_PRIMARY` to `claude`, `gemini`, or `codex` to select the primary
reviewer.

Each normalized result includes trace metadata when run in the review runner:
run ID, base/head SHA, workflow identifiers, Prompt/Policy/Schema digests, CLI
version, start/end timestamps, and duration. The metadata is intended for
reproduction and cost/latency aggregation. Provider usage is preserved when a
CLI returns it; missing usage is reported as uncovered rather than estimated.

The repository-side governance inventory is in
`docs/review/governance-inventory.md`. Required status checks, CODEOWNER review,
human approval, bypass rules, and self-hosted runner permissions still require
verification in GitHub Repository Settings.

Dependency risk classification and dry-run routing are defined in
`docs/review/dependency-intake.md`, `review/dependency-risk.json`, and
`review/agent-routing.json`. The dry-run workflow intentionally produces
artifacts only; it does not merge or modify pull requests.

For gradual adoption by other projects, use the opt-in profiles documented in
`docs/review/profiles.md`. `minimal`, `standard`, and `strict` are synced only
when explicitly selected or when a project has a committed `.agent-review-profile`
marker.

Mutation measurement is configured in `review/mutation.config.json` and runs
against copies of the selected Node.js source files. The weekly/manual workflow
is intentionally non-blocking while a baseline is established; promote its
threshold to a required check only after reviewing survived mutants and false
positive/negative results.

The tool comparison and current runtime baseline are recorded in
`review/mutation-tools.md`, `review/mutation-baseline.json`, and
`review/mutation-survivors.md`. Human triage evaluation uses the versioned
dataset and protocol under `review/evaluation/`; consensus between AI reviewers
is never treated as a correctness signal.

## Required branch protection

Enable these required checks on the default branch in GitHub settings:

- `deterministic`
- `review-gate`

Add `primary-review` and `deep-review` as required checks only after
`AI_REVIEW_ENABLED=true` has been enabled and the self-hosted runner has been
verified online with authenticated CLIs.

Also require CODEOWNER review and at least one human approval. Branch protection
cannot be expressed fully in this repository's files, so it must be verified in
the repository settings after the workflow is installed.
