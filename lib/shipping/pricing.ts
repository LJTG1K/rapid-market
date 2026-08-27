/**
 * Shipping Line Finder — pricing engine.
 *
 * Pure functions only: no React, no I/O, no Tailwind class strings (this
 * file lives outside tailwind.config.js's content globs, so any class
 * string here would be silently purged in production but still work in
 * dev — keep all styling in components/).
 */

import type { BillingBasis, FxSnapshot, ShippingLine } from './types';

export interface ParcelInput {
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface QuoteSuccess {
  ok: true;
  lineId: string;
  actualGrams: number;
  /** 0 when any dimension is missing. */
  volumetricGrams: number;
  /** Pre-rounding grams selected by the line's billing basis. */
  billableGrams: number;
  /** Post-rounding grams, i.e. the weight actually charged for. */
  chargeableGrams: number;
  /** continuedWeightGrams increments beyond firstWeightGrams. */
  increments: number;
  totalUsd: number;
  /** Effective rate for comparison — totalUsd / (chargeableGrams / 1000). */
  usdPerKg: number;
  minDays: number | null;
  maxDays: number | null;
}

export type QuoteFailureReason = 'invalid-weight' | 'under-min' | 'over-max' | 'over-dimensions';

export interface QuoteFailure {
  ok: false;
  lineId: string;
  reason: QuoteFailureReason;
  detail: string;
}

export type Quote = QuoteSuccess | QuoteFailure;

/** cm^3 -> grams via a per-line divisor (cm^3 per kg). Returns 0 if any dimension is missing or non-positive. */
export function volumetricGrams(parcel: ParcelInput, divisorCm3PerKg: number): number {
  const { lengthCm, widthCm, heightCm } = parcel;
  if (!lengthCm || !widthCm || !heightCm) return 0;
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  return ((lengthCm * widthCm * heightCm) / divisorCm3PerKg) * 1000;
}

function billableGramsFor(basis: BillingBasis, actualGrams: number, volGrams: number): number {
  switch (basis) {
    case 'actual':
      return actualGrams;
    case 'volumetric':
      return volGrams;
    case 'greater':
      return Math.max(actualGrams, volGrams);
  }
}

export function quoteLine(line: ShippingLine, parcel: ParcelInput): Quote {
  const { lineId } = { lineId: line.id };

  if (!Number.isFinite(parcel.weightGrams) || parcel.weightGrams <= 0) {
    return { ok: false, lineId, reason: 'invalid-weight', detail: 'Weight must be greater than zero.' };
  }

  const actualGrams = parcel.weightGrams;
  const volGrams = volumetricGrams(parcel, line.billing.volumetricDivisor);
  const billableGrams = billableGramsFor(line.billing.basis, actualGrams, volGrams);

  const { minWeightGrams, maxWeightGrams, maxSingleSideCm, maxGirthCm } = line.limits;

  if (minWeightGrams != null && billableGrams < minWeightGrams) {
    return {
      ok: false,
      lineId,
      reason: 'under-min',
      detail: `Below this line's ${minWeightGrams}g minimum.`,
    };
  }
  if (maxWeightGrams != null && billableGrams > maxWeightGrams) {
    return {
      ok: false,
      lineId,
      reason: 'over-max',
      detail: `Above this line's ${maxWeightGrams}g maximum.`,
    };
  }
  if (maxSingleSideCm != null) {
    const sides = [parcel.lengthCm, parcel.widthCm, parcel.heightCm].filter(
      (v): v is number => typeof v === 'number' && v > 0
    );
    if (sides.some((s) => s > maxSingleSideCm)) {
      return {
        ok: false,
        lineId,
        reason: 'over-dimensions',
        detail: `A side exceeds this line's ${maxSingleSideCm}cm limit.`,
      };
    }
  }
  if (maxGirthCm != null && parcel.lengthCm && parcel.widthCm && parcel.heightCm) {
    const girth = parcel.lengthCm + parcel.widthCm + parcel.heightCm;
    if (girth > maxGirthCm) {
      return {
        ok: false,
        lineId,
        reason: 'over-dimensions',
        detail: `Combined L+W+H exceeds this line's ${maxGirthCm}cm limit.`,
      };
    }
  }

  const { firstWeightGrams, firstWeightPrice, continuedWeightGrams, continuedWeightPrice, surchargeFlat } =
    line.pricing;

  // Two-stage rounding: round UP to a continuedWeightGrams boundary first,
  // then floor at firstWeightGrams. Rounding to firstWeightGrams first is
  // wrong whenever the two increments differ from one another.
  const roundedUp = Math.ceil(billableGrams / continuedWeightGrams) * continuedWeightGrams;
  const chargeableGrams = Math.max(firstWeightGrams, roundedUp);
  const extraGrams = Math.max(0, chargeableGrams - firstWeightGrams);
  const increments = Math.ceil(extraGrams / continuedWeightGrams);

  const totalUsd = firstWeightPrice + increments * continuedWeightPrice + (surchargeFlat ?? 0);
  const usdPerKg = totalUsd / (chargeableGrams / 1000);

  return {
    ok: true,
    lineId,
    actualGrams,
    volumetricGrams: volGrams,
    billableGrams,
    chargeableGrams,
    increments,
    totalUsd,
    usdPerKg,
    minDays: line.delivery?.minDays ?? null,
    maxDays: line.delivery?.maxDays ?? null,
  };
}

export function quoteAll(lines: ShippingLine[], parcel: ParcelInput): Quote[] {
  return lines.map((line) => quoteLine(line, parcel));
}

/** Converts a USD amount to a display currency using an FX snapshot (units of `currency` per 1 USD). */
export function convert(usd: number, currency: string, fx: FxSnapshot): number {
  if (currency === fx.base) return usd;
  const rate = fx.rates[currency];
  if (rate == null) {
    throw new Error(`No FX rate for currency "${currency}" in snapshot dated ${fx.asOf}`);
  }
  return usd * rate;
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}
