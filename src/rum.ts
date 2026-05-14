declare global {
  interface Window {
    __rum?: {
      endpoint: string
      env: string
      spaMode: string
      collectors: Record<string, boolean>
      tracing: boolean
    }
  }
}

export function initRum() {
  const endpoint = import.meta.env.VITE_RUM_ENDPOINT
  if (!endpoint) return

  let loaded = false
  const load = () => {
    if (loaded) return
    loaded = true

    window.__rum = {
      endpoint,
      env: 'prod',
      spaMode: 'history',
      collectors: {
        perf: true,
        webVitals: true,
        api: true,
        staticResource: true,
        jsError: true,
        consoleError: true,
        action: true,
      },
      tracing: false,
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.rum.aliyuncs.com/v2/browser-sdk.js'
    script.crossOrigin = ''
    script.async = true
    document.head.appendChild(script)
  }

  if (window.requestIdleCallback) {
    window.requestIdleCallback(load, { timeout: 4000 })
    return
  }

  if (document.readyState === 'complete') {
    window.setTimeout(load, 1500)
    return
  }

  window.addEventListener('load', () => window.setTimeout(load, 500), { once: true })
}
