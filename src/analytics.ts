type AnalyticsValue = string | number | boolean | undefined;

export type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/**
 * Pushes a GA4 event into the GTM data layer.
 * Tags and triggers are configured in the GTM container, not here.
 */
export function trackEvent(event: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return;
  const dataLayer = (window.dataLayer ??= []);
  dataLayer.push({ event, ...params });
}
