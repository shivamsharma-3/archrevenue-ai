import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'local-api-handler',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              const endpoint = req.url.replace('/api/', '').split('?')[0];
              try {
                // Dynamically import the API handler module from ./api/
                const apiModule = await server.ssrLoadModule(`./api/${endpoint}.ts`);
                const handler = apiModule.default || apiModule;
                
                let body = {};
                if (req.method === 'POST') {
                  const buffers = [];
                  for await (const chunk of req) {
                    buffers.push(chunk);
                  }
                  const rawBody = Buffer.concat(buffers).toString();
                  if (rawBody) {
                    try { body = JSON.parse(rawBody); } catch (e) {}
                  }
                }

                // Mock Vercel req/res adapters for local Vite dev server
                const mockReq: any = req;
                mockReq.body = body;
                mockReq.query = {};

                const mockRes: any = {
                  status(code: number) {
                    res.statusCode = code;
                    return mockRes;
                  },
                  json(data: any) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return mockRes;
                  },
                  send(data: any) {
                    res.end(data);
                    return mockRes;
                  }
                };

                await handler(mockReq, mockRes);
                return;
              } catch (err: any) {
                console.warn(`[Local API Handler] Failed to execute ./api/${endpoint}.ts:`, err.message);
                // Fall through to next middleware if module not found
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
