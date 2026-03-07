# Changelog — macOS Storage Cleanup (Claude Code Plugin)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-08

### Added

- **12 slash commands** for storage analysis and cleanup
  - `/cleanup-scan` — Full storage analysis with general and developer modes
  - `/cleanup-execute` — Execute cleanup with dry-run, confirm, and report modes
  - `/cleanup-quick` — One-command safe cleanup of auto-regenerated caches
  - `/cleanup-disk-usage` — Quick disk usage overview
  - `/cleanup-large-files` — Find large files using Spotlight queries
  - `/cleanup-duplicates` — Detect duplicate files via size + hash
  - `/cleanup-report` — Interactive HTML report with browser UI
  - `/cleanup-restore` — Restore deleted files from Trash
  - `/cleanup-health` — Disk health dashboard with trends
  - `/cleanup-history` — View past cleanup sessions
  - `/cleanup-safe-zones` — Manage path exclusion list
  - `/cleanup-setup` — First-run setup and permissions check

- **8 scanner agents** for parallel filesystem analysis
  - 5 general agents: system, user-files, communications, backups-snapshots, app-leftovers
  - 2 developer agents: mobile-dev (Xcode/Android), backend-dev (Docker/npm/cargo)
  - 1 coordinator agent for orchestration

- **6 skills** for workflow orchestration
  - storage-analysis, quick-cleanup, interactive-report, restore, storage-monitor, cleanup-history

- **Interactive HTML report** with dark mode, category accordion, checkboxes, and live totals
- **Local Node.js server** for browser-to-CLI communication (zero dependencies)
- **Safety system** — two-tier SAFE/REVIEW classification, hardcoded never-delete list, trash-based deletion
- **Restore capability** — undo any cleanup session from deletion logs
- **Reference docs** — comprehensive macOS path database and safety rules

### Security

- All deletions use `mv` to `~/.Trash/` (never `rm`)
- Credentials protected: `~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.android/debug.keystore`
- Report server binds to localhost only (127.0.0.1)
- Full Disk Access detection and guidance
- SIP-protected paths silently skipped
