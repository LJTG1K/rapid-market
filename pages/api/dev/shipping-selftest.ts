import type { NextApiRequest, NextApiResponse } from 'next';
import { quoteLine, type ParcelInput, type Quote } from '../../../lib/shipping/pricing';
import type { ShippingLine } from '../../../lib/shipping/types';

/**
 * Dev-only self-test for the pricing engine (no test suite exists in this
 * repo — see AGENTS.md). Hit /api/dev/shipping-selftest in the dev server
 * after touching lib/shipping/pricing.ts. Disabled in production.
 */

const ACTUAL_LINE: ShippingLine = {
  id: 'test-actual-500',
  agent: 'sugargoo',
  name: 'Test Actual 500g Steps',
  pricing: { currency: 'USD', firstWeightGrams: 500, firstWeightPrice: 50, continuedWeightGrams: 500, continuedWeightPrice: 40 },
  billing: { basis: 'actual', volumetricDivisor: 6000 },
  limits: { maxWeightGrams: 20000 },
  delivery: { minDays: 10, maxDays: 15 },
  characteristics: [],
  restrictions: [],
};

const VOLUMETRIC_LINE: ShippingLine = {
  ...ACTUAL_LINE,
  id: 'test-volumetric-500',
  name: 'Test Volumetric 500g Steps',
  billing: { basis: 'volumetric', volumetricDivisor: 6000 },
};

const GREATER_LINE: ShippingLine = {
  ...ACTUAL_LINE,
  id: 'test-greater-500',
  name: 'Test Greater-Of 500g Steps',
  billing: { basis: 'greater', volumetricDivisor: 6000 },
};

const KG_STEP_LINE: ShippingLine = {
  ...ACTUAL_LINE,
  id: 'test-actual-1000',
  name: 'Test Actual 1000g Steps',
  pricing: { currency: 'USD', firstWeightGrams: 1000, firstWeightPrice: 70, continuedWeightGrams: 1000, continuedWeightPrice: 60 },
};

const CAPPED_LINE: ShippingLine = {
  ...ACTUAL_LINE,
  id: 'test-capped',
  name: 'Test Capped At 2kg',
  limits: { maxWeightGrams: 2000 },
};

interface Case {
  name: string;
  line: ShippingLine;
  parcel: ParcelInput;
  expect: (q: Quote) => string | null; // returns null on pass, else a failure message
}

const CASES: Case[] = [
  {
    name: 'exactly 500g charges only the first-weight price',
    line: ACTUAL_LINE,
    parcel: { weightGrams: 500 },
    expect: (q) => (q.ok && q.totalUsd === 50 && q.increments === 0 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: '501g rounds up into one full continued-weight increment',
    line: ACTUAL_LINE,
    parcel: { weightGrams: 501 },
    expect: (q) => (q.ok && q.increments === 1 && q.totalUsd === 90 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'exactly 1000g is exactly one increment beyond 500g first weight',
    line: ACTUAL_LINE,
    parcel: { weightGrams: 1000 },
    expect: (q) => (q.ok && q.increments === 1 && q.totalUsd === 90 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'volumetric basis ignores actual weight and uses L*W*H/divisor',
    line: VOLUMETRIC_LINE,
    parcel: { weightGrams: 100, lengthCm: 30, widthCm: 30, heightCm: 30 },
    // volumetric = 30*30*30/6000*1000 = 4500g -> chargeable 4500 rounds to 4500 (already a 500 multiple)
    expect: (q) => (q.ok && q.chargeableGrams === 4500 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'actual basis ignores dimensions entirely, even oversized ones',
    line: ACTUAL_LINE,
    parcel: { weightGrams: 100, lengthCm: 30, widthCm: 30, heightCm: 30 },
    expect: (q) => (q.ok && q.chargeableGrams === 500 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'greater-of basis picks volumetric when it exceeds actual, on the same box',
    line: GREATER_LINE,
    parcel: { weightGrams: 100, lengthCm: 30, widthCm: 30, heightCm: 30 },
    expect: (q) => (q.ok && q.chargeableGrams === 4500 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'greater-of basis picks actual when it exceeds volumetric, on the same box',
    line: GREATER_LINE,
    parcel: { weightGrams: 9000, lengthCm: 10, widthCm: 10, heightCm: 10 },
    // volumetric = 10*10*10/6000*1000 ~= 166.7g, actual 9000g wins
    expect: (q) => (q.ok && q.chargeableGrams === 9000 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'non-500g increments: 1kg first weight, 1kg steps',
    line: KG_STEP_LINE,
    parcel: { weightGrams: 1500 },
    // rounds up to 2000g -> 1 increment beyond the 1000g first weight
    expect: (q) => (q.ok && q.increments === 1 && q.totalUsd === 130 ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'over the line max weight is rejected, not silently priced',
    line: CAPPED_LINE,
    parcel: { weightGrams: 5000 },
    expect: (q) => (!q.ok && q.reason === 'over-max' ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'zero weight is rejected, not NaN-priced',
    line: ACTUAL_LINE,
    parcel: { weightGrams: 0 },
    expect: (q) => (!q.ok && q.reason === 'invalid-weight' ? null : `got ${JSON.stringify(q)}`),
  },
  {
    name: 'negative weight is rejected',
    line: ACTUAL_LINE,
    parcel: { weightGrams: -500 },
    expect: (q) => (!q.ok && q.reason === 'invalid-weight' ? null : `got ${JSON.stringify(q)}`),
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).end();
  }

  const results = CASES.map((c) => {
    const quote = quoteLine(c.line, c.parcel);
    const failure = c.expect(quote);
    return { name: c.name, pass: failure === null, detail: failure, quote };
  });

  const pass = results.filter((r) => r.pass).length;
  const fail = results.length - pass;

  return res.status(fail === 0 ? 200 : 500).json({ pass, fail, results });
}
