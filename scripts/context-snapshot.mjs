#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  } catch (e) {
    return '';
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--notes' || a === '-n') {
      args.notes = argv[i + 1] || '';
      i++;
    } else if (a.startsWith('--notes=')) {
      args.notes = a.slice('--notes='.length);
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, '-');
const root = process.cwd();
const outDir = path.join(root, '.codex', 'snapshots');
fs.mkdirSync(outDir, { recursive: true });

const pkg = fs.existsSync(path.join(root, 'package.json'))
  ? JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  : {};

const node = run('node -v');
const npm = run('npm -v');
const branch = run('git rev-parse --abbrev-ref HEAD');
const remotes = run('git remote -v');
const status = run('git status -sb');
const diffNames = run('git diff --name-only HEAD');
const diff = run('git diff');
const lastCommits = run('git log --oneline -n 10');

const notes = (args.notes || process.env.SNAPSHOT_NOTES || '').trim();

const snapshot = {
  meta: {
    createdAt: now.toISOString(),
    tool: 'context-snapshot.mjs',
    version: 1,
  },
  env: { node, npm },
  repo: { branch, remotes, status, lastCommits, diffNames: diffNames.split('\n').filter(Boolean) },
  package: { name: pkg.name, version: pkg.version, scripts: pkg.scripts, deps: pkg.dependencies, devDeps: pkg.devDependencies },
  files: {
    present: {
      'vercel.json': fs.existsSync(path.join(root, 'vercel.json')),
      'tailwind.config.js': fs.existsSync(path.join(root, 'tailwind.config.js')),
      'postcss.config.js': fs.existsSync(path.join(root, 'postcss.config.js')),
    },
  },
  diff,
  notes,
};

const base = path.join(outDir, `snapshot-${stamp}`);
const jsonPath = `${base}.json`;
fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2));
const gz = zlib.gzipSync(Buffer.from(JSON.stringify(snapshot)));
fs.writeFileSync(`${base}.json.gz`, gz);

// Also emit a short Markdown summary
const md = `# Snapshot ${stamp}\n\n- Branch: ${branch}\n- Node: ${node}, npm: ${npm}\n- Status: ${status}\n- Last commits:\n\n\`${lastCommits}\`\n\n## Notes\n\n${notes || '(no notes)'}\n`;
fs.writeFileSync(`${base}.md`, md);

console.log('Snapshot written to:', jsonPath);
console.log('Compressed:', `${base}.json.gz`);
console.log('Summary:', `${base}.md`);

