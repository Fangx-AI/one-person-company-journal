import type { ImgHTMLAttributes } from 'react'

type OptimizedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  /**
   * `priority` images skip lazy-loading and request high fetch priority. Use
   * this for the first 1-3 above-the-fold images on a page.
   */
  priority?: boolean
}

const RASTER_PATTERN = /\.(png|jpe?g)(\?.*)?$/i

/**
 * Drop-in replacement for <img>. If the source is a local PNG/JPG produced by
 * `npm run optimize:images`, this component renders a <picture> element that
 * prefers the WebP sibling and falls back to the original raster file for
 * older browsers. External URLs and already-WebP sources pass through as a
 * regular <img>.
 */
export function OptimizedImage({ src, alt, priority, loading, fetchPriority, ...rest }: OptimizedImageProps) {
  const isLocalRaster = src.startsWith('/') && RASTER_PATTERN.test(src)
  const resolvedLoading = priority ? 'eager' : (loading ?? 'lazy')
  const resolvedFetchPriority = priority ? 'high' : (fetchPriority ?? 'auto')
  const resolvedDecoding = priority ? 'sync' : 'async'

  if (!isLocalRaster) {
    return (
      <img
        src={src}
        alt={alt}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        {...rest}
      />
    )
  }

  const webpSrc = src.replace(RASTER_PATTERN, '.webp$2')

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        {...rest}
      />
    </picture>
  )
}
