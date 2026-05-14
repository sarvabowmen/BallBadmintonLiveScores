import fs from 'fs/promises';
import path from 'path';

const isVercel = process.env.VERCEL === '1';
const storePath = isVercel 
  ? path.join('/tmp', 'store.json') 
  : path.join(process.cwd(), 'data', 'store.json');

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    // On Vercel, if not in /tmp, we might want to seed it from the repo's data/store.json
    if (isVercel) {
      try {
        const seed = await fs.readFile(path.join(process.cwd(), 'data', 'store.json'), 'utf-8');
        await fs.writeFile(storePath, seed);
      } catch {
        await fs.writeFile(storePath, JSON.stringify({ tournaments: [], matches: [] }, null, 2));
      }
    } else {
      await fs.writeFile(storePath, JSON.stringify({ tournaments: [], matches: [] }, null, 2));
    }
  }
}

export async function readStore() {
  await ensureStore();
  const file = await fs.readFile(storePath, 'utf-8');
  return JSON.parse(file);
}

export async function writeStore(data) {
  await fs.writeFile(storePath, JSON.stringify(data, null, 2));
}

export function createId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
