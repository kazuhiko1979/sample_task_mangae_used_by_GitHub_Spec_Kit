import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const output = outputIndex >= 0 ? args[outputIndex + 1] : "review-gate.json";
const required = [];
const files = [];
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--output") { index += 1; continue; }
  if (args[index] === "--require") { required.push(args[index + 1]); index += 1; continue; }
  files.push(args[index]);
}
if (!files.length) throw new Error("no review result files supplied");

const results = [];
for (const file of files) results.push(JSON.parse(await readFile(file, "utf8")));
const blocking = results.flatMap((result) => result.findings.filter((finding) => finding.blocking || ["critical", "high"].includes(finding.severity)));
const failed = results.filter((result) => result.status !== "pass");
const identities = new Set(results.map((result) => `${result.reviewer}:${result.mode}`));
const missing = required.filter((identity) => !identities.has(identity));
const durations = results.map((result) => result.metadata?.duration_ms).filter((value) => Number.isFinite(value));
const usages = results.map((result) => result.metadata?.usage).filter(Boolean);
const totalTokens = usages.reduce((total, usage) => total + (usage.total_tokens ?? usage.totalTokens ?? 0), 0);
const gate = {
  schema_version: 1,
  status: failed.length || blocking.length || missing.length ? "fail" : "pass",
  reviewers: results.map(({ reviewer, mode, status }) => ({ reviewer, mode, status })),
  blocking_findings: blocking,
  missing_reviewers: missing,
  result_files: files,
  metrics: {
    review_count: results.length,
    duration_ms: durations.reduce((total, value) => total + value, 0),
    duration_coverage: results.length ? durations.length / results.length : 0,
    total_tokens: totalTokens,
    token_coverage: results.length ? usages.length / results.length : 0,
  },
  summary: `${results.length} reviewer result(s), ${blocking.length} blocking finding(s), ${missing.length} missing required review(s)`
};
await writeFile(output, JSON.stringify(gate, null, 2) + "\n");
console.log(JSON.stringify(gate, null, 2));
if (gate.status !== "pass") process.exit(1);
