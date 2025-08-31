Context Snapshots
==================

This project includes a tiny helper to save the current development context
(repo state, diffs, env, and your notes) so you can resume seamlessly later.

Commands
- Create snapshot: `npm run snapshot -- --notes "what I did / next steps"`
- Restore (show latest): `npm run restore`

Outputs
- Files are written under `.codex/snapshots/` as:
  - `snapshot-<timestamp>.json`
  - `snapshot-<timestamp>.json.gz` (compressed)
  - `snapshot-<timestamp>.md` (human summary)

Notes
- The script stores `git status`, recent commits, and the working tree diff.
- No external services are called; data stays local unless you commit it.
- You can commit snapshots (they’re small text/gz files) to keep them in GitHub.

