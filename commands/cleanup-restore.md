---
name: cleanup-restore
description: "Restore previously deleted files from Trash by cleanup session"
skill: restore
---

Restore files from a previous cleanup session.

1. Read deletion logs from `~/.macos-cleanup/deletions-*.json`
2. List past cleanup sessions with: date, total items, total size freed, categories
3. Ask user to select a session to restore
4. Show individual items from that session
5. Ask which items to restore (all or select individually)
6. For each item to restore:
   - Check if it still exists in `~/.Trash/`
   - If yes: `mv` it back to original path (create parent dirs if needed with `mkdir -p`)
   - If no: Report that item has been permanently deleted from Trash
7. Update the deletion log to mark items as restored
8. Show summary of restored items
