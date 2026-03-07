---
name: cleanup-health
description: "Disk health dashboard — usage, trends, and status"
skill: storage-monitor
---

Show a disk health dashboard.

1. Get current disk usage: `df -h /`
2. Read scan history from `~/.macos-cleanup/scan-history.json` if it exists
3. Display:
   - Current usage: X GB / Y GB (Z%)
   - Visual bar: [████████░░] 80%
   - Status color: green (<70%), yellow (70-85%), red (>85%)
   - Change since last scan (if history exists)
   - Top 5 growth areas (if history exists)
   - Largest category breakdown
4. If usage is critical (>85%), suggest running `/cleanup-quick` immediately
5. If no scan history exists, suggest running `/cleanup-scan` to establish a baseline
