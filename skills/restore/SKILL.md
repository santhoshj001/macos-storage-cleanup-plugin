---
name: Restore
description: "Restore previously deleted files from Trash using cleanup session logs"
tools: [Bash, Read, Write, Glob]
---

# Restore

## Steps

1. **Find deletion logs**: Glob `~/.macos-cleanup/deletions-*.json`
2. **List sessions**: Parse each log file, show:
   - Session date/time
   - Number of items deleted
   - Total size freed
   - Categories cleaned
   - Restoration status (fully restorable / partially restorable / expired)
3. **User selects session**: Ask which session to restore
4. **Show items**: Display individual items from selected session with:
   - Original path
   - Size
   - Category
   - Status: still in Trash? (check with `ls ~/.Trash/$(basename path)`)
5. **User selects items**: All or individual selection
6. **Restore**: For each selected item:
   - Verify it exists in `~/.Trash/`
   - Create parent directory if needed: `mkdir -p $(dirname original_path)`
   - Move back: `mv ~/.Trash/filename original_path`
   - Verify successful restore
7. **Update log**: Mark restored items in the deletion log
8. **Summary**: Show restored count, failed count, reasons for failures

## Edge Cases

- If Trash has been emptied: report items are permanently gone
- If original path now has a different file: warn about conflict, ask user
- If parent directory was also deleted: recreate the directory structure
