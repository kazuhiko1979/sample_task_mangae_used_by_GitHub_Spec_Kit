import { readFile, writeFile } from "node:fs/promises";

const [input, output, reviewer, mode] = process.argv.slice(2);
if (!input || !output || !reviewer || !mode) {
  console.error("usage: normalize-result.mjs INPUT OUTPUT REVIEWER MODE");
  process.exit(2);
}

const raw = await readFile(input, "utf8");
const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
const source = fenced ?? raw;
const start = source.indexOf("{");
const end = source.lastIndexOf("}");
if (start < 0 || end <= start) throw new Error("reviewer output contains no JSON object");

let result;
try {
  result = JSON.parse(source.slice(start, end + 1));
} catch (error) {
  throw new Error(`invalid reviewer JSON: ${error.message}`);
}

if (result.schema_version !== 1 || result.reviewer !== reviewer || result.mode !== mode) {
  throw new Error("reviewer JSON has an invalid schema_version, reviewer, or mode");
}
if (!["pass", "fail"].includes(result.status) || !Array.isArray(result.findings)) {
  throw new Error("reviewer JSON has an invalid status or findings");
}
for (const finding of result.findings) {
  if (!["critical", "high", "medium", "low", "info"].includes(finding.severity)) {
    throw new Error("finding has an invalid severity");
  }
  if (typeof finding.confidence !== "number" || finding.confidence < 0 || finding.confidence > 1) {
    throw new Error("finding has an invalid confidence");
  }
  if (typeof finding.message !== "string" || typeof finding.category !== "string" || typeof finding.blocking !== "boolean") {
    throw new Error("finding is missing required fields");
  }
}

const metadata = readMetadata();
if (result.usage && typeof result.usage === "object") metadata.usage = result.usage;
if (Object.keys(metadata).length) result.metadata = metadata;

await writeFile(output, JSON.stringify(result, null, 2) + "\n");

function readMetadata() {
  const values = {
    run_id: process.env.REVIEW_RUN_ID,
    pr_number: process.env.GITHUB_PR_NUMBER,
    workflow_run_id: process.env.GITHUB_RUN_ID,
    workflow_attempt: process.env.GITHUB_RUN_ATTEMPT,
    repository: process.env.GITHUB_REPOSITORY,
    event: process.env.GITHUB_EVENT_NAME,
    base_sha: process.env.REVIEW_BASE_SHA,
    head_sha: process.env.REVIEW_HEAD_SHA,
    prompt_sha256: process.env.REVIEW_PROMPT_SHA256,
    policy_sha256: process.env.REVIEW_POLICY_SHA256,
    schema_sha256: process.env.REVIEW_SCHEMA_SHA256,
    cli_version: process.env.REVIEW_CLI_VERSION,
    started_at: process.env.REVIEW_STARTED_AT,
    finished_at: new Date().toISOString(),
    duration_ms: process.env.REVIEW_DURATION_MS ? Number(process.env.REVIEW_DURATION_MS) : undefined,
  };
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== ""));
}
