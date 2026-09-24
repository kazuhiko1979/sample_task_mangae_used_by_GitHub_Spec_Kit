# sample_task_mangae_used_by_GitHub_Spec_Kit

技術スタック未確定のゼロベースアプリです。共通の開発基盤は
`G-agent-platform` と連携し、アプリの実装・依存関係・インフラ構成はこのリポジトリで管理します。

## 同期済みの開発基盤

- **ローカル連携**: `.agent` はローカルの G-agent-platform を参照します。マシン固有のためGit管理しません。
- **共通規約**: `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` を配置済みです。
- **Harness**: `harness-profile.yaml`、`agent-progress.md`、`docs/harness/` に進捗・検証・学びを記録します。
- **設計・検証基準**: `docs/architecture/object-oriented-design.md` をプロジェクト規約として採用しています。
- **レビュー基盤**: `minimal` profile を適用済みです。`.github/CODEOWNERS`、PRテンプレート、AI review workflow、`review/` を含みます。所有者は `@kazuhiko1979` です。
- **MCP / CLI設定**: Context7 の設定を `.mcp.json` と `.vscode/mcp.json` に配線しています。認証値は `CONTEXT7_API_KEY` 環境変数で与え、リポジトリへ保存しません。
- **Claude Code**: `.claude/settings.json` と、explore / implement / reviewer / tester / security の agent 定義を配置済みです。
- **Serena**: 既存の `.serena/` 設定は保持します。ローカル状態は `.serena/.gitignore` の対象です。

## 現在は対象外の機能

アプリの言語・framework・依存関係・Docker構成はまだ決まっていないため、Node/Python等のCI、依存更新、
Docker digest防御、`standard` / `strict` review profile は導入していません。マニフェストやDockerfileを追加後、
その構成に合わせて同期・検証を追加します。

この実行環境では `.codex/`、`.agents/`、`.git/hooks/` が読み取り専用です。そのため Codex 固有の設定・
native agent、共通hook、Git pre-commit hook は、書込み可能な通常の開発環境で別途同期します。

### Codex をプロジェクト設定で利用する

書込み可能で trusted な通常の開発環境では、まず生成予定を確認します。

```bash
bash .agent/3-context/mcp/sync-mcp.sh --project . --targets codex --dry-run
bash .agent/2-harness/scripts/agent-sync.sh --project . --targets codex --dry-run
```

内容を確認してから、`--force` を付けずに同期します。既存の `.codex/config.toml` がある場合は、
生成内容を確認して手動で統合します。

```bash
bash .agent/3-context/mcp/sync-mcp.sh --project . --targets codex
bash .agent/2-harness/scripts/agent-sync.sh --project . --targets codex
```

これにより `.codex/config.toml` に Context7 MCP 設定、`.codex/agents/` に explore / implement /
reviewer / tester / security の agent 定義が作成されます。同期後はこのプロジェクトから Codex を再起動します。
このセッションでは Context7 がすでに利用可能なため、MCPを使うだけなら上記の個別同期は必須ではありません。
ユーザー全体のstdio版 `context7` と競合しないよう、プロジェクトのHTTP接続は `context7_remote` として登録します。

## 確認コマンド

```bash
# harness と review scaffold の検証
bash .agent/2-harness/foundation/scripts/verify.sh --project .
bash review/scripts/verify-platform.sh

# MCP 設定と秘密情報の確認
node .agent/3-context/mcp/audit-mcp-security.js
bash .agent/2-harness/scripts/secret-scan.sh .
```

## 次の段階

技術スタックを決めたら、`harness-profile.yaml` の `purpose` と検証コマンドを更新し、対応する
マニフェスト・lockfile・テスト・CIをこのリポジトリに追加します。コンテナを採用する場合は、
DockerfileまたはComposeを追加してから G-agent-platform の container sync を実行します。
