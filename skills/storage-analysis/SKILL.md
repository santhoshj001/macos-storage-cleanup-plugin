---
name: Storage Analysis
description: "Comprehensive macOS storage analysis — orchestrates scanner agents, aggregates results, and presents categorized cleanup recommendations"
tools: [Bash, Read, Write, Glob, Grep, Agent]
---

# Storage Analysis

## Phase 1: Pre-flight Checks

1. Run `df -h /` to get current disk usage (total, used, available, percentage)
2. Test Full Disk Access: `ls ~/Library/Mail/ 2>&1` — if "Operation not permitted", warn user but continue with limited scan
3. Load exclusion list from `~/.macos-cleanup/config.json` (create empty config if missing)
4. Create `~/.macos-cleanup/` directory if it doesn't exist

## Phase 2: Dispatch Scanner Agents

Parse input for flags: `--dev`, `--full`

**Batch 1 — General Agents (always run):**
Launch these 5 agents in parallel using the Agent tool:
- `system-scanner` — system caches, logs, temp files, browser caches, cloud storage
- `user-files-scanner` — Downloads, Desktop, Documents, creative tools, media
- `communications-scanner` — Mail attachments, iMessage media
- `backups-snapshots-scanner` — iOS backups, Time Machine snapshots
- `app-leftovers-scanner` — orphaned app data, containers, language files

**Batch 2 — Developer Agents (only with --dev or --full):**
Launch these 2 agents in parallel:
- `mobile-dev-scanner` — Xcode, Android Studio, Gradle, Flutter, Kotlin/Native
- `backend-dev-scanner` — Docker, package managers, stale node_modules, build artifacts

## Phase 3: Aggregate Results

1. Collect all scanner agent outputs
2. Parse each output into structured items: `{path, size_bytes, size_human, category, safety, description}`
3. Deduplicate by path prefix — if multiple scanners report overlapping paths, keep the most specific one
4. Group items by category
5. Calculate totals per category and grand total

## Phase 4: Save & Display

1. Write consolidated results to `~/.macos-cleanup/scan-latest.json`:
```json
{
  "timestamp": "ISO-8601",
  "disk_total_bytes": 0,
  "disk_used_bytes": 0,
  "disk_available_bytes": 0,
  "disk_percent_used": 0,
  "full_disk_access": true,
  "flags": ["--dev"],
  "categories": [
    {
      "name": "System Caches & Logs",
      "safety": "safe",
      "total_bytes": 0,
      "items": []
    }
  ],
  "total_recoverable_bytes": 0
}
```

2. Append to `~/.macos-cleanup/scan-history.json` for trend tracking
3. Display formatted summary:
```
DISK: {used} / {total} used ({percent}%)

── GENERAL ──────────────────────────────────────
✓ System caches & logs       X.X GB   auto-regenerated
✓ Cloud storage caches       X.X GB   local copies, re-downloadable
⚠ Old Downloads (>30 days)   X.X GB   N files: .dmg, .zip, .pkg
⚠ iOS backup (device name)   X.X GB   backup from YYYY-MM
⚠ Time Machine snapshots     X.X GB   local APFS snapshots
⚠ iMessage media             X.X GB   photos, videos, GIFs
⚠ Mail attachments           X.X GB   re-downloadable from server
⚠ Orphaned app data          X.X GB   N uninstalled apps
⚠ Desktop screenshots        X.X GB   N files
⚠ Creative tool caches       X.X GB   render caches

── DEVELOPER (--dev) ────────────────────────────
✓ Xcode DerivedData + Sims   X.X GB   rebuilds on next build
✓ Package manager caches     X.X GB   redownloads on install
⚠ Android AVDs               X.X GB   user picks which to keep
⚠ Old node_modules           X.X GB   N dirs, inactive >6 months
⚠ Docker images (unused)     X.X GB   N dangling images
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL RECOVERABLE:           X.X GB

Run /cleanup-report for interactive HTML selection
Run /cleanup-execute --dry-run to preview deletion
```

Use ✓ for SAFE items, ⚠ for REVIEW items. Show General section always, Developer section only when --dev flag was used.
