#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString().trim();
  } catch (e) {
    return '';
  }
}

function parseArgs(argv) {
  const out = { base: 'main', snapshot: true, title: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-snapshot') out.snapshot = false;
    else if (a === '--base' && argv[i + 1]) { out.base = argv[++i]; }
    else if (a.startsWith('--base=')) out.base = a.split('=')[1];
    else if (a === '--title' && argv[i + 1]) { out.title = argv[++i]; }
    else if (a.startsWith('--title=')) out.title = a.split('=')[1];
  }
  return out;
}

const args = parseArgs(process.argv);
const branch = run('git rev-parse --abbrev-ref HEAD') || 'feature';
const ghExists = !!run('gh --version');

if (!ghExists) {
  console.error('GitHub CLI not found. Install with: brew install gh');
  process.exit(1);
}

if (args.snapshot) {
  const notes = `auto PR snapshot for ${branch}`;
  try { execSync(`node scripts/context-snapshot.mjs --notes "${notes}"`, { stdio: 'ignore' }); } catch {}
}

// find latest snapshot summary
const root = process.cwd();
const snapDir = path.join(root, '.codex', 'snapshots');
let latestMd = '';
if (fs.existsSync(snapDir)) {
  const files = fs.readdirSync(snapDir).filter((f) => f.endsWith('.md')).sort();
  if (files.length) latestMd = path.join(snapDir, files[files.length - 1]);
}

const defaultTitle = args.title || run('git log -1 --pretty=%s') || `pr: ${branch}`;
const tmpDir = path.join(root, '.codex', 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });
const bodyPath = path.join(tmpDir, `pr-body-${Date.now()}.md`);

let body = '';
body += `Automated PR created from branch ${branch}.`;
body += `\n\n`;
if (latestMd && fs.existsSync(latestMd)) {
  body += `## Snapshot Summary\n\n`;
  body += fs.readFileSync(latestMd, 'utf8');
} else {
  body += `_(No snapshot found. Run \`npm run snapshot\` to include session context.)_\n`;
}
fs.writeFileSync(bodyPath, body);

const res = spawnSync('gh', ['pr', 'create', '-B', args.base, '-H', branch, '--title', defaultTitle, '--body-file', bodyPath], { stdio: 'inherit' });
process.exit(res.status || 0);

