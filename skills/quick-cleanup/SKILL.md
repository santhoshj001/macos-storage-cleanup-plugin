---
name: Quick Cleanup
description: "One-command safe cleanup of auto-regenerated caches — no full scan needed, single confirmation"
tools: [Bash, Read, Write, Glob]
---

# Quick Cleanup

## No Full Scan Needed

This skill directly checks known-safe paths without dispatching scanner agents.

## Safe Paths to Check (existence + size via `du -sh`)

1. `~/Library/Caches/*` — all app caches
2. `~/Library/Logs/*` — only files older than 30 days (`find -mtime +30`)
3. Browser caches: Chrome, Firefox, Safari, Edge, Arc
4. `/tmp/*` and `/var/folders/` temp files
5. `~/Library/Saved Application State/`
6. Crash reports: `~/Library/Logs/DiagnosticReports/`, `/Library/Logs/DiagnosticReports/`
7. Xcode DerivedData: `~/Library/Developer/Xcode/DerivedData/` (if it exists)
8. Package manager caches (only if they exist): `~/.npm/`, `~/Library/Caches/Homebrew/`, `~/.cache/pip/`, `~/.cargo/registry/cache/`

## Skip ALL of these

- Downloads, Desktop, Documents (user files)
- iOS backups, Time Machine snapshots
- iMessage, Mail
- Docker (may have running containers)
- Android Studio, AVDs (dev environment)
- Any REVIEW-level items

## Flow

1. Check each path, sum sizes
2. Skip paths in safe-zones exclusion list
3. Present single summary: "Delete X.X GB of auto-regenerated caches? These will rebuild automatically when needed."
4. List the categories and sizes being cleaned
5. On "yes": Move all to `~/.Trash/` using `mv`
6. Log to `~/.macos-cleanup/deletions-{timestamp}.json`
7. Show disk space freed: before vs after
