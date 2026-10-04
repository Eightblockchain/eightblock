const fs = require('node:fs');
const path = require('node:path');
const FileSystemCache =
  require('next/dist/server/lib/incremental-cache/file-system-cache.js').default;
const {
  tagsManifest,
} = require('next/dist/server/lib/incremental-cache/tags-manifest.external.js');

/**
 * Next's file-system cache, with revalidations shared between processes.
 *
 * PM2 runs the blog as several processes on one `.next` directory. Rendered pages live on disk, so
 * every process sees a re-render, but Next records `revalidatePath()` only in the memory of the
 * process that handled it, and only the first time a tag is revalidated. After an edit, the other
 * process (and later edits on the same one) kept serving the old article. Here every revalidation
 * is stamped with its time and appended to a log that all processes read before serving a page.
 */
let offset = 0;
let pending = '';

function readNewRevalidations(logFile) {
  let size;
  try {
    size = fs.statSync(logFile).size;
  } catch {
    return;
  }
  // A new build starts a new log.
  if (size < offset) {
    offset = 0;
    pending = '';
  }
  if (size === offset) return;

  const fd = fs.openSync(logFile, 'r');
  try {
    const chunk = Buffer.alloc(size - offset);
    fs.readSync(fd, chunk, 0, chunk.length, offset);
    offset = size;
    const lines = (pending + chunk.toString('utf8')).split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      const tab = line.indexOf('\t');
      if (tab < 0) continue;
      const at = Number(line.slice(0, tab));
      const tag = line.slice(tab + 1);
      if (tag && at > (tagsManifest.get(tag) ?? 0)) tagsManifest.set(tag, at);
    }
  } finally {
    fs.closeSync(fd);
  }
}

class SharedRevalidationCache extends FileSystemCache {
  constructor(ctx) {
    super(ctx);
    this.logFile = ctx.serverDistDir
      ? path.join(ctx.serverDistDir, '..', 'revalidated-tags.log')
      : null;
  }

  async revalidateTag(tags) {
    const list = (Array.isArray(tags) ? tags : [tags]).filter(Boolean);
    if (list.length === 0) return;
    const at = Date.now();
    for (const tag of list) tagsManifest.set(tag, at);
    if (!this.logFile) return;
    try {
      await fs.promises.appendFile(this.logFile, list.map((tag) => `${at}\t${tag}\n`).join(''));
    } catch (error) {
      console.error('[cache] could not share a revalidation:', error);
    }
  }

  async get(key, ctx) {
    if (this.logFile) readNewRevalidations(this.logFile);
    return super.get(key, ctx);
  }
}

module.exports = SharedRevalidationCache;
