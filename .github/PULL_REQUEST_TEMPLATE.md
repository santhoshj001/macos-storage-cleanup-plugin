## Summary

Brief description of the changes.

## Changes

-
-
-

## Type

- [ ] New scanner / path detection
- [ ] New command or skill
- [ ] Bug fix
- [ ] Documentation
- [ ] HTML report / UI
- [ ] Safety rules update
- [ ] Other

## Safety Checklist

- [ ] No paths in the never-delete list are affected
- [ ] All new paths are classified as SAFE or REVIEW
- [ ] Deletions use `mv` to `~/.Trash/` (never `rm`)
- [ ] No external network calls added
- [ ] No new npm dependencies added
- [ ] `plugin.json` is valid (if modified)

## Testing

How did you test this?

- [ ] Ran `/cleanup-scan` successfully
- [ ] Ran `/cleanup-execute --dry-run` — no unintended items
- [ ] Tested HTML report (if modified) in light + dark mode
- [ ] Tested report server (if modified) with `node scripts/report-server.js`

## Screenshots

If applicable (especially for HTML report changes).
