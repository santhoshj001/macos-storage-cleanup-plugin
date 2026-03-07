---
name: cleanup-scan
description: "Full macOS storage analysis — scans caches, downloads, backups, and more"
arguments:
  - name: flags
    description: "Options: --dev (include developer tools), --full (maximum coverage)"
    required: false
skill: storage-analysis
---

Perform a comprehensive macOS storage scan.

Parse the flags argument:
- No flags: Run 5 general scanner agents only (system, user-files, communications, backups-snapshots, app-leftovers)
- `--dev`: Run all 7 scanner agents including mobile-dev and backend-dev
- `--full`: Run all 7 scanners plus deep duplicate file detection

Steps:
1. Check disk space with `df -h /`
2. Verify Full Disk Access (try `ls ~/Library/Mail/ 2>&1`)
3. Load exclusion list from `~/.macos-cleanup/config.json`
4. Dispatch scanner agents in batches using the Agent tool
5. Aggregate and deduplicate results
6. Save results to `~/.macos-cleanup/scan-latest.json`
7. Display categorized summary with safety classifications

After scanning, suggest: `/cleanup-report` for interactive HTML report, `/cleanup-execute --dry-run` to preview deletion.
