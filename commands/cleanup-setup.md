---
name: cleanup-setup
description: "First-run setup — check Full Disk Access and install low-disk warning hook"
---

Run first-time setup for the macOS Storage Cleanup plugin.

Steps:
1. **Create config directory**: `mkdir -p ~/.macos-cleanup`
2. **Check Full Disk Access**:
   - Try: `ls ~/Library/Mail/ 2>&1`
   - If "Operation not permitted": Guide user to grant FDA:
     ```
     To enable full scanning capabilities:
     1. Open System Settings
     2. Go to Privacy & Security > Full Disk Access
     3. Click + and add your terminal app (Terminal, iTerm2, etc.)
     4. Restart your terminal
     ```
   - If accessible: Report FDA is already granted
3. **Install low-disk warning hook**:
   - Read `~/.claude/settings.json`
   - Check if our SessionStart hook already exists
   - If not, add the hook:
     ```json
     {
       "type": "command",
       "command": "avail=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%'); if [ \"$avail\" -gt 90 ]; then echo 'DISK CRITICALLY LOW: only '$(( 100 - avail ))'% free. Run /cleanup-scan'; elif [ \"$avail\" -gt 80 ]; then echo 'Disk is '$avail'% full. Consider /cleanup-quick'; fi"
     }
     ```
   - Show the user what will be added and ask for confirmation before modifying settings.json
4. **Initialize config**: Create `~/.macos-cleanup/config.json` with empty safe_zones if it doesn't exist
5. **Summary**: Show setup status — FDA (yes/no), hook (installed/skipped), config (created/exists)
