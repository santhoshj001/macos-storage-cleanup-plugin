# Claude Code Project Instructions

## Project Overview

This is a Claude Code plugin (`macos-storage-cleanup`) that scans and cleans macOS storage. It uses markdown-based commands, skills, and agents — not a traditional compiled codebase.

## Architecture

- **Commands** (`commands/*.md`) — Slash command entry points with YAML frontmatter
- **Skills** (`skills/*/SKILL.md`) — Orchestration workflows invoked by commands
- **Agents** (`agents/*.md`) — Autonomous scanner agents dispatched in parallel
- **References** (`references/*.md`) — Safety rules and macOS path database
- **Report UI** (`templates/report.html` + `scripts/report-server.js`) — Interactive HTML report

## Key Conventions

### Safety Rules (Non-Negotiable)
- NEVER use `rm` — always `mv` to `~/.Trash/`
- NEVER modify paths in the never-delete list (see `references/safe-delete-rules.md`)
- All items must be classified as SAFE or REVIEW
- REVIEW items always require individual user approval

### Data Format
The scan results JSON uses this structure (must match across coordinator, skills, and HTML template):
```json
{
  "categories": [
    {
      "name": "Category Name",
      "safety": "safe",
      "total_bytes": 0,
      "description": "...",
      "items": [{ "path": "...", "size_bytes": 0, "safety": "safe", "description": "..." }]
    }
  ]
}
```

### Code Standards
- `report-server.js`: Zero npm dependencies (Node.js built-ins only), localhost-only binding
- `report.html`: Self-contained (no external CSS/JS), XSS-safe (`textContent` not `innerHTML`)
- Agent/command/skill markdown: YAML frontmatter required, step-by-step instructions with exact bash commands

## Testing

```bash
# Verify plugin structure
claude plugin list

# Smoke test
/cleanup-disk-usage

# Full scan test
/cleanup-scan

# Dry run (no deletion)
/cleanup-execute --dry-run

# Verify report server
node scripts/report-server.js
```

## File Locations

- Plugin manifest: `.claude-plugin/plugin.json`
- Runtime data: `~/.macos-cleanup/` (user's home, not in repo)
- Config: `~/.macos-cleanup/config.json`
- Scan results: `~/.macos-cleanup/scan-latest.json`
- Deletion logs: `~/.macos-cleanup/deletions-*.json`
