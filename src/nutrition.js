// Pure nutrition + price math. No React, no localStorage, no side effects —
// every function here should be callable from a plain Node/Vitest process.
//
// Core principle: a `null` in per100g/price data means "unknown", not zero.
// Aggregation must never let an unknown silently become a zero — it has to
// come back out as `complete: false` so the UI can say "—" / "incomplete"
// instead of lying with a number.

export const NUTRIENT_KEYS = [
  "kcal", "protein", "fat", "satFat", "carbs", "fiber",
  "calcium", "iron", "zinc", "magnesium", "potassium",
  "folate", "vitA", "vitC", "vitD", "b12", "omega3",
];

export function emptyPer100g() {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, null]));
}

// --- pack-level derivation -------------------------------------------------

// Grams of the pack that are actually edible (e.g. bananas minus peel).
// null propagates: an unknown pack weight or edible fraction makes the
// edible weight unknown too, not zero.
export function edibleGrams(item) {
  if (item.packGrams == null || item.edibleFraction == null) return null;
  return item.packGrams * item.edibleFraction;
}

// Total of one nutrient contributed by a single purchased pack of `item`.
export function packNutrient(item, key) {
  const per100 = item.per100g?.[key];
  if (per100 == null) return null;
  const grams = edibleGrams(item);
  if (grams == null) return null;
  return (per100 * grams) / 100;
}

// --- shared aggregation core -------------------------------------------------
//
// Every higher-level aggregator (a shopping trip, a daily staples baseline)
// reduces to the same shape: a list of resolved {per100g, grams} parts. This
// keeps the null-propagation logic in exactly one place.

function partNutrient(part, key) {
  const per100 = part.per100g?.[key];
  if (per100 == null || part.grams == null) return null;
  return (per100 * part.grams) / 100;
}

function aggregateParts(parts) {
  const result = {};
  for (const key of NUTRIENT_KEYS) {
    let value = 0;
    let complete = true;
    for (const part of parts) {
      const contribution = partNutrient(part, key);
      if (contribution == null) {
        complete = false;
        continue;
      }
      value += contribution;
    }
    result[key] = { value, complete };
  }
  return result;
}

// Expands one cart line (an item bought `qty` times) into resolved parts.
// Ordinary items are a single part built from their own
// per100g/packGrams/edibleFraction. Compound packs (`item.parts`) — one SKU
// that bundles several distinct foods under one price, e.g. an "Oats & Milk"
// bundle deal — expand to one part per component so we never have to invent
// a blended composition for the bundle as a whole.
function itemToParts(item, qty) {
  const rawParts = Array.isArray(item.parts) && item.parts.length > 0
    ? item.parts
    : [{ per100g: item.per100g, packGrams: item.packGrams, edibleFraction: item.edibleFraction }];

  return rawParts.map((part) => {
    const grams = edibleGrams(part);
    return { per100g: part.per100g, grams: grams == null ? null : grams * qty };
  });
}

// Aggregates a shopping trip. entries: [{ item, qty }]. Returns, per
// nutrient key, { value, complete }.
export function aggregateNutrients(entries) {
  const parts = entries
    .filter((e) => e.qty > 0)
    .flatMap(({ item, qty }) => itemToParts(item, qty));
  return aggregateParts(parts);
}

// Staples (rice/oil/honey/...) are modeled as a daily consumption-rate
// baseline, not a per-trip purchase: you eat them most days of the trip
// whether or not this happens to be the trip you restock the pantry. So
// this reads `gramsPerDay` directly (no packGrams/qty involved) and returns
// an already-daily figure — callers must NOT divide it by trip duration, and
// must NOT gate it behind the "restocking this trip?" cost toggle.
export function staplesDailyNutrients(staples) {
  const parts = (staples?.items || []).map((item) => ({
    per100g: item.per100g,
    grams: item.gramsPerDay ?? null,
  }));
  return aggregateParts(parts);
}

// --- price -------------------------------------------------------------

// priceOverrides: { [itemId]: { value, updatedAt } }. Falls back to the
// catalog's defaultPrice when there's no live/scraped override yet.
export function resolvePrice(item, priceOverrides) {
  const override = priceOverrides?.[item.id];
  if (override?.value != null) return override.value;
  return item.defaultPrice ?? null;
}

// Total cost of a shopping trip. entries: [{ item, qty }]. Unknown prices
// are skipped rather than zeroed, and surface via `complete: false` so a
// basket with missing prices doesn't quietly under-report the total.
export function aggregateCost(entries, priceOverrides) {
  let value = 0;
  let complete = true;
  for (const { item, qty } of entries) {
    if (!qty) continue;
    const price = resolvePrice(item, priceOverrides);
    if (price == null) {
      complete = false;
      continue;
    }
    value += price * qty;
  }
  return { value, complete };
}

export function isPriceStale(updatedAt, { now = Date.now(), thresholdDays = 60 } = {}) {
  if (!updatedAt) return false;
  const ageMs = now - new Date(updatedAt).getTime();
  return ageMs > thresholdDays * 24 * 60 * 60 * 1000;
}

// Sum of restocking one pack of every staple item — this is the one-time
// trip cost, independent of the daily nutrition baseline above. Same
// { value, complete } shape as aggregateCost/aggregateNutrients.
export function staplesRestockCost(staples, priceOverrides) {
  let value = 0;
  let complete = true;
  for (const item of staples?.items || []) {
    const price = resolvePrice(item, priceOverrides);
    if (price == null) {
      complete = false;
      continue;
    }
    value += price;
  }
  return { value, complete };
}

// Nutrient (or any value) per unit of currency spent — the "is this actually
// a good deal" number. Null when price is unknown or non-positive.
export function valuePerCurrency(nutrientValue, price) {
  if (nutrientValue == null || price == null || price <= 0) return null;
  return nutrientValue / price;
}

// --- misc pure helpers -------------------------------------------------

export function interpolateInstruction(instruction, tripDurationDays) {
  if (!instruction) return instruction;
  const label = tripDurationDays == null
    ? "?"
    : (Number.isInteger(tripDurationDays) ? String(tripDurationDays) : tripDurationDays.toFixed(1));
  return instruction.replace(/\{days\}/g, label);
}
