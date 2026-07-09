import { useEffect } from 'react';

export function usePolling(callback: () => void | Promise<void>, enabled: boolean, intervalMs: number) {
  useEffect(() => {
    if (!enabled) return;
    void callback();
    const timer = window.setInterval(() => {
      void callback();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, callback]);
}
