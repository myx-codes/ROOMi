export const BATCH_TIMEZONE = process.env.BATCH_TIMEZONE ?? 'UTC';

export const JOB_NAMES = {
  BOOKING_AUTO_FINISH: 'booking-auto-finish',
  BOOKING_CANCEL_STALE_WAITING: 'booking-cancel-stale-waiting',
  PAYMENT_FAIL_STALE_PENDING: 'payment-fail-stale-pending',
  NOTICE_RETENTION: 'notice-retention',
  AVAILABILITY_CLEANUP: 'availability-cleanup',
  PROPERTY_RANK_REBUILD: 'property-rank-rebuild',
} as const;

export const DEFAULT_LOCK_TTL_MS = toPositiveInt(process.env.BATCH_LOCK_TTL_MS, 10 * 60 * 1000);
export const DEFAULT_WAITING_BOOKING_TTL_HOURS = toPositiveInt(
  process.env.BATCH_WAITING_BOOKING_TTL_HOURS,
  24,
);
export const DEFAULT_PENDING_PAYMENT_TTL_HOURS = toPositiveInt(
  process.env.BATCH_PENDING_PAYMENT_TTL_HOURS,
  24,
);
export const DEFAULT_READ_NOTICE_RETENTION_DAYS = toPositiveInt(
  process.env.BATCH_READ_NOTICE_RETENTION_DAYS,
  30,
);
export const DEFAULT_OCCUPIED_AVAILABILITY_RETENTION_DAYS = toPositiveInt(
  process.env.BATCH_OCCUPIED_AVAILABILITY_RETENTION_DAYS,
  90,
);

export function isBatchDryRunEnabled(): boolean {
  const raw = process.env.BATCH_DRY_RUN;
  if (!raw) return true;

  const normalized = raw.trim().toLowerCase();
  return !['false', '0', 'off', 'no'].includes(normalized);
}

export function toPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}
