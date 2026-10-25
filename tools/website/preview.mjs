import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fallback = process.argv[3] ? path.resolve(process.argv[3]) : null;
const port = Number(process.argv[4] || 8786);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.ics': 'text/calendar', '.ico': 'image/x-icon' };
const server = http.createServer((request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    let file = path.resolve(repository, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (file !== repository && !file.startsWith(repository + path.sep)) { response.writeHead(403).end(); return; }
    if (!existsSync(file) && fallback && /^(assets|downloads)\//.test(path.relative(repository, file))) file = path.join(fallback, path.relative(repository, file));
    if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const size = statSync(file).size;
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    let start = 0, end = size - 1, status = 200;
    const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
      if (start >= size || start > end) { response.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      status = 206;
    }
    headers['Content-Length'] = end - start + 1;
    response.writeHead(status, headers);
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(file, { start, end });
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch { if (!response.headersSent) response.writeHead(404).end('Not found'); else response.destroy(); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}/${process.argv[2] ? '' : 'local-tests/claude-overhaul/'}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
