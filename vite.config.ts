import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Build-time stamp baked into the bundle. Used as a query-string cache buster
// for `/data/*.json` fetches so that every deploy forces ALL caching layers
// (browser disk cache, EdgeOne edge nodes, transparent proxies) to re-fetch
// from origin. Without this, even `Cache-Control: no-cache` on the client
// can be ignored by intermediate CDNs that serve from edge cache regardless
// of client revalidation hints. Compact base36 timestamp keeps URLs short.
const BUILD_STAMP = Date.now().toString(36)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_STAMP__: JSON.stringify(BUILD_STAMP),
  },
})
