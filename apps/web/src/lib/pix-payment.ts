export const PIX_EXPIRATION_SECONDS = 10 * 60;
export const PIX_GRACE_PERIOD_MS = 10 * 60 * 1000;

export interface PixPaymentInfoLike {
  pixExpiration?: string | null;
  cancelAt?: string | null;
  status?: string | null;
}

const toTimestamp = (value?: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const calculatePixCancelAt = (
  pixExpiration?: string | null,
  gracePeriodMs = PIX_GRACE_PERIOD_MS
) => {
  const expirationTimestamp = toTimestamp(pixExpiration);
  if (!expirationTimestamp) return null;
  return new Date(expirationTimestamp + gracePeriodMs).toISOString();
};

export const formatCountdown = (remainingMs: number) => {
  if (remainingMs <= 0) return '00:00';

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

export const getPixLifecycleState = (
  paymentInfo?: PixPaymentInfoLike | null,
  now = Date.now()
) => {
  const pixExpiration = paymentInfo?.pixExpiration || null;
  const cancelAt = paymentInfo?.cancelAt || calculatePixCancelAt(pixExpiration);
  const expirationTimestamp = toTimestamp(pixExpiration);
  const cancellationTimestamp = toTimestamp(cancelAt);
  const msUntilExpiration = expirationTimestamp ? expirationTimestamp - now : null;
  const msUntilCancellation = cancellationTimestamp ? cancellationTimestamp - now : null;
  const isExpired = msUntilExpiration !== null ? msUntilExpiration <= 0 : false;
  const isCancellationDue = msUntilCancellation !== null ? msUntilCancellation <= 0 : false;
  const isInGracePeriod = isExpired && !isCancellationDue;

  return {
    pixExpiration,
    cancelAt,
    msUntilExpiration,
    msUntilCancellation,
    isExpired,
    isInGracePeriod,
    isCancellationDue,
    formattedExpirationCountdown:
      msUntilExpiration !== null ? formatCountdown(msUntilExpiration) : null,
    formattedCancellationCountdown:
      msUntilCancellation !== null ? formatCountdown(msUntilCancellation) : null,
  };
};
