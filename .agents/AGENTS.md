# Codex project instructions

## Morph MCP

For repository exploration, codebase discovery, feature tracing, and architecture analysis, always prefer the Morph MCP tools.

Primary tool:

`mcp__morph_mcp__codebase_search`

Use it before manual text search when:
- locating features
- finding implementation flows
- tracing frontend/backend relationships
- identifying related files
- understanding architecture
- locating configuration
- finding where prompts, models, queues, generation logic, or integrations are implemented

Use:

`mcp__morph_mcp__github_codebase_search`

when searching external GitHub codebases is necessary.

Use:

`mcp__morph_mcp__edit_file`

when appropriate for code modifications.

Do not default to rg, grep, or manual repository searching for semantic codebase exploration when Morph MCP is available.

Manual search may still be used when:
- an exact literal string must be located
- Morph MCP does not find enough information
- Morph MCP is unavailable

Before significant code changes, understand the relevant implementation flow with Morph MCP first.