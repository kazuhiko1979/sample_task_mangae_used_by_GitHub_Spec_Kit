<!-- BEGIN G-AGENT-PLATFORM RULES -->
## G-agent-platform 共通規約

このプロジェクトでは、まず `.agent/policies/workspace-agents.md` を読み、その共通規約に従う。
次に、このファイルの管理ブロック以外に記載されたプロジェクト固有ルールに従う。

- 共通の安全規約は、プロジェクト固有ルールや個別タスクで緩和しない。
- プロジェクト固有の共通ルールは `AGENTS.md` に記載する。`CLAUDE.md` と `GEMINI.md`
  の管理ブロック以外は、それぞれのCLI固有の補足として扱う。
- 高リスク操作では共通規約が指定するスキル・承認・検証を先に適用する。

このブロックは `.agent/1-loop/rules-sync.sh` により管理される。CLAUDE.md 固有の指示はこのブロックの外に記載する。
<!-- END G-AGENT-PLATFORM RULES -->
