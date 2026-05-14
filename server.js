import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 5173);
const modeIndex = process.argv.indexOf('--mode');
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : process.env.NODE_ENV || 'development';
const isProd = mode === 'production';

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html';
  if (ext === '.js') return 'application/javascript';
  if (ext === '.css') return 'text/css';
  if (ext === '.json') return 'application/json';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

function isApiRequest(req) {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  return pathname.startsWith('/api/');
}

async function handleApiRequest(req, res) {
  const apiPath = new URL(req.url || '/', 'http://localhost').pathname;
  try {
    if (apiPath.startsWith('/api/tournaments')) {
      const handler = (await import('./api/tournaments.js')).default;
      return handler(req, res);
    }
    if (apiPath.startsWith('/api/matches')) {
      const handler = (await import('./api/matches.js')).default;
      return handler(req, res);
    }
    if (apiPath.startsWith('/api/auth')) {
      const handler = (await import('./api/auth.js')).default;
      return handler(req, res);
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'API route not found' }));
  } catch (error) {
    console.error('API error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'API handler error', details: error.message }));
  }
}

async function createServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: 'ssr' },
      appType: 'custom',
    });

    const server = http.createServer(async (req, res) => {
      try {
        if (isApiRequest(req)) {
          return await handleApiRequest(req, res);
        }

        vite.middlewares(req, res, async (error) => {
          if (error) {
            vite.ssrFixStacktrace(error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            return res.end(error.stack || error.message);
          }

          try {
            const url = req.url;
            let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
            template = await vite.transformIndexHtml(url, template);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(template);
          } catch (e) {
            vite.ssrFixStacktrace(e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end(e.stack || String(e));
          }
        });
      } catch (error) {
        vite.ssrFixStacktrace(error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(error.stack || String(error));
      }
    });

    server.listen(port, () => {
      console.log(`Dev server running at http://localhost:${port}`);
    });
  } else {
    const server = http.createServer(async (req, res) => {
      try {
        if (isApiRequest(req)) {
          return await handleApiRequest(req, res);
        }

        let urlPath = new URL(req.url || '/', 'http://localhost').pathname;
        if (urlPath === '/') {
          urlPath = '/index.html';
        }

        const filePath = path.join(__dirname, 'dist', urlPath);
        try {
          const data = await fs.readFile(filePath);
          res.statusCode = 200;
          res.setHeader('Content-Type', getContentType(filePath));
          return res.end(data);
        } catch {
          const indexHtml = await fs.readFile(path.join(__dirname, 'dist', 'index.html'));
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          return res.end(indexHtml);
        }
      } catch (error) {
        console.error('Server error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(error.stack || String(error));
      }
    });

    server.listen(port, () => {
      console.log(`Production server running at http://localhost:${port}`);
    });
  }
}

createServer();
