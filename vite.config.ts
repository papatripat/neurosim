import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Muat variabel lingkungan dari .env
dotenv.config();

/**
 * Plugin API Internal untuk Vite Dev Server
 * Memungkinkan pemanggilan /api/chat dan /api/evaluate berjalan langsung
 * di server Vite (port 3000) tanpa perlu menjalankan server Express terpisah.
 */
function neurosimApiPlugin(): Plugin {
  return {
    name: 'neurosim-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (req.method === 'POST' && url === '/api/chat') {
          try {
            const body = await parseJsonBody(req);
            const { processChat } = await import('./api/chat');
            const result = await processChat(body);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('[Vite API] Error pada /api/chat:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ reply: 'Baik, tolong lanjutkan tugasnya ya.' }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/evaluate') {
          try {
            const body = await parseJsonBody(req);
            const { processEvaluate } = await import('./api/evaluate');
            const result = await processEvaluate(body);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('[Vite API] Error pada /api/evaluate:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Gagal memproses evaluasi' }));
          }
          return;
        }

        next();
      });
    },
  };
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [react(), neurosimApiPlugin()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
