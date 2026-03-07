---
name: Storage Monitor
description: "Disk health dashboard showing usage percentage, trends, growth areas, and color-coded status"
tools: [Bash, Read, Write, Glob]
---

# Storage Monitor

## Data Collection

1. Run `df -h /` and parse: total, used, available, percentage
2. Read `~/.macos-cleanup/scan-history.json` for historical data (if exists)
3. Read latest scan from `~/.macos-cleanup/scan-latest.json` (if exists)

## Display

```
╔══════════════════════════════════════════════════╗
║           DISK HEALTH DASHBOARD                  ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Storage: 412 GB / 500 GB                        ║
║  [████████████████░░░░] 82%                      ║
║  Status: WARNING                                 ║
║                                                  ║
║  Available: 88 GB                                ║
║  Change: +12 GB since last scan (7 days ago)     ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  TOP GROWTH AREAS                                ║
║  1. ~/Library/Developer/   +8.2 GB               ║
║  2. ~/Downloads/           +2.1 GB               ║
║  3. ~/Library/Caches/      +1.4 GB               ║
║  4. ~/Library/Mail/        +0.5 GB               ║
║  5. ~/.docker/             +0.3 GB               ║
╠══════════════════════════════════════════════════╣
║  RECOMMENDATIONS                                 ║
║  • Run /cleanup-quick to free ~15 GB of caches   ║
║  • Run /cleanup-scan --dev for full analysis      ║
╚══════════════════════════════════════════════════╝
```

## Status Colors

- GREEN (Healthy): <70% used — "Storage looks good"
- YELLOW (Warning): 70-85% — "Consider cleaning up"
- RED (Critical): >85% — "Disk space critically low! Run /cleanup-quick now"

## If no history

Show current usage only and suggest running `/cleanup-scan` to establish baseline for trend tracking.
