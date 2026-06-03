import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const routerBasename = process.env.VITE_ROUTER_BASENAME || '/gestaomateriasCRM/'
const normalizedBase = routerBasename.endsWith('/') ? routerBasename : `${routerBasename}/`
const bareBasePath = normalizedBase.replace(/\/$/, '')

export default defineConfig({
  base: normalizedBase,
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    {
      name: 'dev-basename-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === bareBasePath) {
            res.statusCode = 302
            res.setHeader('Location', normalizedBase)
            res.end()
            return
          }

          next()
        })
      },
    },
  ],
})
