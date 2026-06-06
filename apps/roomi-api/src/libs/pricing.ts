import { formatDateOnly, parseDateOnly } from './config';

export interface PricingSettings {
  propertyPrice: number;
  propertyType?: string;
  propertyRank?: number;
  propertyLikes?: number;
  propertyViews?: number;
  propertyComments?: number;
  propertyRatingCount?: number;
  dynamicPricingEnabled?: boolean;
  weekendMultiplier?: number | null;
  minMultiplier?: number | null;
  maxMultiplier?: number | null;
  manualMultiplierOverride?: number | null;
}

export interface PriceBreakdownItem {
  date: string;
  basePrice: number;
  multiplier: number;
  pricePerDay: number;
  isWeekend: boolean;
  mode: 'BASE' | 'WEEKEND' | 'AI' | 'MANUAL' | 'LOCKED';
  explanation: string[];
}

export interface PricePreview {
  dates: PriceBreakdownItem[];
  nights: number;
  baseTotal: number;
  totalPrice: number;
  averagePrice: number;
}

const WEEKEND_WEEKDAYS = new Set(['SAT', 'SUN']);
const DEFAULT_WEEKEND_MULTIPLIER = 1.22;
const DEFAULT_MIN_MULTIPLIER = 0.85;
const DEFAULT_MAX_MULTIPLIER = 1.8;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundPrice(value: number): number {
  return Math.max(0, Math.round(value));
}

export function getWeekdayShort(date: Date, timeZone: string): string {
  const stableDate = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(stableDate).toUpperCase();
}

export function isWeekendDate(date: Date, timeZone: string): boolean {
  return WEEKEND_WEEKDAYS.has(getWeekdayShort(date, timeZone));
}

export function iterateDateRange(startDate: string, endDateExclusive: string): Date[] {
  const dates: Date[] = [];
  let cursor = parseDateOnly(startDate);
  const end = parseDateOnly(endDateExclusive);

  while (cursor.getTime() < end.getTime()) {
    dates.push(new Date(cursor));
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function generateUpcomingDates(startDate: Date, daysAhead: number): string[] {
  const dates: string[] = [];
  const cursor = new Date(startDate);
  cursor.setUTCHours(12, 0, 0, 0);

  for (let i = 0; i < daysAhead; i += 1) {
    dates.push(formatDateOnly(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function getDemandAdjustment(settings: PricingSettings): { multiplier: number; explanation: string[] } {
  const explanation: string[] = [];

  const rating = Math.max(0, Number(settings.propertyRank ?? 0));
  if (rating > 0) {
    const ratingBoost = clamp((rating / 5) * 0.12, 0, 0.12);
    if (ratingBoost > 0) {
      explanation.push(`rating_boost=${ratingBoost.toFixed(3)}`);
    }
    const popularityBase =
      (Number(settings.propertyViews ?? 0) + Number(settings.propertyLikes ?? 0) + Number(settings.propertyComments ?? 0)) || 0;
    const popularityBoost = clamp(Math.log10(popularityBase + 1) / 25, 0, 0.08);
    if (popularityBoost > 0) {
      explanation.push(`popularity_boost=${popularityBoost.toFixed(3)}`);
    }

    const ratingCountBoost = clamp(Math.log10(Number(settings.propertyRatingCount ?? 0) + 1) / 40, 0, 0.05);
    if (ratingCountBoost > 0) {
      explanation.push(`rating_volume_boost=${ratingCountBoost.toFixed(3)}`);
    }

    return {
      multiplier: 1 + ratingBoost + popularityBoost + ratingCountBoost,
      explanation,
    };
  }

  explanation.push('no_rating_signal');
  return { multiplier: 1, explanation };
}

export function calculateNightPrice(
  settings: PricingSettings,
  date: Date,
  timeZone: string,
): PriceBreakdownItem {
  const basePrice = Math.max(0, Number(settings.propertyPrice ?? 0));
  const weekendMultiplier = Number(settings.weekendMultiplier ?? DEFAULT_WEEKEND_MULTIPLIER);
  const minMultiplier = Number(settings.minMultiplier ?? DEFAULT_MIN_MULTIPLIER);
  const maxMultiplier = Number(settings.maxMultiplier ?? DEFAULT_MAX_MULTIPLIER);
  const manualOverride = settings.manualMultiplierOverride;
  const dynamicEnabled = settings.dynamicPricingEnabled !== false;
  const weekend = isWeekendDate(date, timeZone);
  const explanation: string[] = [];

  if (!dynamicEnabled) {
    return {
      date: formatDateOnly(date),
      basePrice,
      multiplier: 1,
      pricePerDay: roundPrice(basePrice),
      isWeekend: weekend,
      mode: 'BASE',
      explanation: ['dynamic_pricing_disabled'],
    };
  }

  if (manualOverride != null && Number.isFinite(Number(manualOverride)) && Number(manualOverride) > 0) {
    const multiplier = clamp(Number(manualOverride), minMultiplier, maxMultiplier);
    explanation.push(`manual_override=${Number(manualOverride).toFixed(3)}`);
    return {
      date: formatDateOnly(date),
      basePrice,
      multiplier,
      pricePerDay: roundPrice(basePrice * multiplier),
      isWeekend: weekend,
      mode: 'MANUAL',
      explanation,
    };
  }

  const demand = getDemandAdjustment(settings);
  const weekendBoost = weekend ? weekendMultiplier : 1;
  if (weekend) {
    explanation.push(`weekend_multiplier=${weekendMultiplier.toFixed(3)}`);
  }
  explanation.push(...demand.explanation);

  const rawMultiplier = weekendBoost * demand.multiplier;
  const multiplier = clamp(rawMultiplier, minMultiplier, maxMultiplier);

  return {
    date: formatDateOnly(date),
    basePrice,
    multiplier,
    pricePerDay: roundPrice(basePrice * multiplier),
    isWeekend: weekend,
    mode: weekend ? 'WEEKEND' : 'AI',
    explanation,
  };
}

export function previewPriceRange(
  settings: PricingSettings,
  startDate: string,
  endDateExclusive: string,
  timeZone: string,
): PricePreview {
  const dates = iterateDateRange(startDate, endDateExclusive).map((date) =>
    calculateNightPrice(settings, date, timeZone),
  );
  const baseTotal = dates.reduce((sum, item) => sum + item.basePrice, 0);
  const totalPrice = dates.reduce((sum, item) => sum + item.pricePerDay, 0);

  return {
    dates,
    nights: dates.length,
    baseTotal,
    totalPrice,
    averagePrice: dates.length ? Math.round(totalPrice / dates.length) : 0,
  };
}
