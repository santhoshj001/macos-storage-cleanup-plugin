---
name: Cleanup History
description: "Track and display cleanup history — total freed, timeline, categories, restorable items"
tools: [Bash, Read, Glob]
---

# Cleanup History

## Data Source

Read all `~/.macos-cleanup/deletions-*.json` log files.

## Display

**Aggregate Stats:**
- Total cleanups performed: N
- Total storage freed: X.X GB
- Average cleanup size: X.X GB
- Largest single cleanup: X.X GB (date)
- Most common category: (e.g., "System Caches")

**Timeline (most recent first):**
```
DATE                  FREED     ITEMS    CATEGORIES               RESTORABLE
2025-03-05 14:30     8.2 GB    47       caches, logs, downloads  Yes (in Trash)
2025-02-28 09:15     12.4 GB   23       xcode, npm, docker       Partial
2025-02-15 16:45     3.1 GB    15       caches, browser          No (Trash emptied)
```

**Restorable Items:**
For sessions where items are still in Trash, show count and suggest `/cleanup-restore` to undo.

## If No History

```
No cleanup history found.
Run /cleanup-scan to analyze your storage, then /cleanup-execute to start tracking.
```
