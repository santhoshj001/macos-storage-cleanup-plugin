---
name: cleanup-report
description: "Generate interactive HTML report and open in browser"
skill: interactive-report
---

Generate and serve an interactive HTML cleanup report.

1. Check that scan results exist at `~/.macos-cleanup/scan-latest.json`. If not, suggest running `/cleanup-scan` first.
2. Read the scan results
3. Read the HTML template from `${CLAUDE_PLUGIN_ROOT}/templates/report.html`
4. Inject scan data into the template
5. Check if Node.js is available (`command -v node`)
   - If yes: Start the report server `node ${CLAUDE_PLUGIN_ROOT}/scripts/report-server.js` and open browser to `http://localhost:3847`
   - If no: Write static HTML file to `~/.macos-cleanup/report.html` and open with `open` command. Include a "Copy Selections to Clipboard" button as fallback.
6. Tell user to select items in the browser and click Submit
7. After submission, selections are saved to `~/.macos-cleanup/user-selections.json`
8. Suggest running `/cleanup-execute --from-report` to execute selected cleanup
