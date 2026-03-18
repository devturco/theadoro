import { useEffect, useState } from 'react';
import { getPixLifecycleState, type PixPaymentInfoLike } from '@/lib/pix-payment';

export const usePixCountdown = (
  paymentInfo?: PixPaymentInfoLike | null,
  enabled = true
) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [enabled]);

  return getPixLifecycleState(paymentInfo, now);
};
