---
name: cleanup-disk-usage
description: "Quick disk usage overview — capacity and top directories"
---

Show a quick disk usage overview.

1. Run `df -h /` to show disk capacity, used, available, percentage
2. Run `du -sh ~/* ~/Library/* 2>/dev/null | sort -rh | head -20` to show top 20 largest directories
3. Format as a clean table with visual bars showing relative sizes
4. Color-code the disk usage percentage:
   - <70%: Healthy
   - 70-85%: Warning
   - >85%: Critical

This is a quick informational command — no scanning or deletion.
