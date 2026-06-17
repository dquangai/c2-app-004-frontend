import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const sseProxyConfig = {
  target: '',
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      if (req.url?.includes('/chat/stream')) {
        proxyReq.setHeader('Accept', 'text/event-stream')
        proxyReq.setHeader('Connection', 'keep-alive')
        proxyReq.setHeader('Cache-Control', 'no-cache')
      }
    })
    proxy.on('proxyRes', (proxyRes, req, res) => {
      if (req.url?.includes('/chat/stream')) {
        proxyRes.headers['content-type'] = 'text/event-stream; charset=utf-8'
        proxyRes.headers['cache-control'] = 'no-cache, no-transform'
        proxyRes.headers['x-accel-buffering'] = 'no'
        proxyRes.headers['connection'] = 'keep-alive'
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders()
        }
      }
    })
  },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8010'
  const apiProxy = { ...sseProxyConfig, target: apiTarget }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 5174,
      strictPort: false,
      proxy: {
        '/api': apiProxy,
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
      allowedHosts: ['v-connect.shopyanie.id.vn'],
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': apiProxy,
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
