---
name: cleanup-history
description: "View past cleanup sessions — total freed, timeline, restorable items"
skill: cleanup-history
---

Show cleanup history and statistics.

1. Read all `~/.macos-cleanup/deletions-*.json` log files
2. Display:
   - Total cleanups performed
   - Total GB freed across all sessions
   - Timeline: list each session with date, size freed, categories cleaned
   - Currently restorable items (still in Trash)
3. Show aggregate stats:
   - Most commonly cleaned category
   - Average cleanup size
   - Largest single cleanup
4. If no history exists, report that no cleanups have been performed yet
