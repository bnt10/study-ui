#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const dir = path.join(root, '.codex', 'snapshots');
if (!fs.existsSync(dir)) {
  console.log('No snapshots directory found at', dir);
  process.exit(0);
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json') || f.endsWith('.json.gz'))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.log('No snapshots found.');
  process.exit(0);
}

const latestBase = files[files.length - 1].replace(/\.json(\.gz)?$/, '');
const jsonPath = path.join(dir, `${latestBase}.json`);
const gzPath = path.join(dir, `${latestBase}.json.gz`);

let data = null;
if (fs.existsSync(jsonPath)) {
  data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} else if (fs.existsSync(gzPath)) {
  const buf = fs.readFileSync(gzPath);
  data = JSON.parse(zlib.gunzipSync(buf).toString('utf8'));
}

if (!data) {
  console.log('Failed to load latest snapshot');
  process.exit(1);
}

console.log('Latest snapshot: ', latestBase);
console.log('Created:', data.meta?.createdAt);
console.log('Branch:', data.repo?.branch);
console.log('Status:', data.repo?.status);
console.log('\nNotes:\n', data.notes || '(no notes)');

