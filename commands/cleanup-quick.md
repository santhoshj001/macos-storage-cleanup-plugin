---
name: cleanup-quick
description: "One-command safe cleanup — only auto-regenerated caches, single confirmation"
skill: quick-cleanup
---

Perform a quick cleanup of only SAFE (auto-regenerated) items.

This does NOT require a full scan. Directly check known safe paths:
- `~/Library/Caches/*`
- `~/Library/Logs/*` (files >30 days old)
- Browser caches (Chrome, Firefox, Safari, Edge)
- `/tmp/`, `/var/folders/` temp files
- Package manager caches (npm, pip, brew, etc.) — only if they exist
- Xcode DerivedData (if it exists)
- Crash reports

Skip ALL REVIEW items entirely — no Downloads, no backups, no user files.

Single confirmation: "Delete X.X GB of auto-regenerated caches? These will rebuild automatically. (yes/no)"

On confirmation, move all to `~/.Trash/` and log the operation.
