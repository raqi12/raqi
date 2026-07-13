import { useEffect } from 'react';

export function usePolling(callback: () => void | Promise<void>, enabled: boolean, intervalMs: number) {
  useEffect(() => {
    if (!enabled) return;
    // #region agent log
    fetch('http://127.0.0.1:7507/ingest/e05eb89e-9cfa-4057-adc1-4bbb50888184',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c8176'},body:JSON.stringify({sessionId:'1c8176',location:'usePolling.ts:effect-setup',message:'usePolling effect mounted or callback changed',data:{enabled,intervalMs},timestamp:Date.now(),hypothesisId:'B',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    void callback();
    const timer = window.setInterval(() => {
      // #region agent log
      fetch('http://127.0.0.1:7507/ingest/e05eb89e-9cfa-4057-adc1-4bbb50888184',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c8176'},body:JSON.stringify({sessionId:'1c8176',location:'usePolling.ts:interval-tick',message:'usePolling interval fired',data:{intervalMs},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      void callback();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, callback]);
}
