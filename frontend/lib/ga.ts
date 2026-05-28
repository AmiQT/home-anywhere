export function track(event: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return
  // @ts-ignore
  if (!(window as any).gtag) return
  ;(window as any).gtag('event', event, params || {})
}
