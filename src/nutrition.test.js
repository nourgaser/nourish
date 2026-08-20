import { describe, it, expect } from "vitest";
import {
  edibleGrams,
  packNutrient,
  aggregateNutrients,
  staplesDailyNutrients,
  resolvePrice,
  aggregateCost,
  isPriceStale,
  staplesRestockCost,
  valuePerCurrency,
  interpolateInstruction,
} from "./nutrition";

const TEST_ITEM = {
  id: "TEST_ITEM",
  packGrams: 1000,
  edibleFraction: 1,
  per100g: { kcal: 100, protein: 10, fat: 5, satFat: null, carbs: 8, fiber: null,
    calcium: 20, iron: null, zinc: null, magnesium: null, potassium: null,
    folate: null, vitA: null, vitC: null, vitD: null, b12: null, omega3: null },
};

const UNKNOWN_ITEM = {
  id: "TEST_ITEM_UNKNOWN",
  packGrams: 500,
  edibleFraction: 1,
  per100g: { kcal: null, protein: null, fat: null, satFat: null, carbs: null, fiber: null,
    calcium: null, iron: null, zinc: null, magnesium: null, potassium: null,
    folate: null, vitA: null, vitC: null, vitD: null, b12: null, omega3: null },
};

describe("edibleGrams", () => {
  it("multiplies pack weight by edible fraction", () => {
    expect(edibleGrams({ packGrams: 1000, edibleFraction: 0.65 })).toBe(650);
  });
  it("propagates null packGrams", () => {
    expect(edibleGrams({ packGrams: null, edibleFraction: 1 })).toBeNull();
  });
  it("propagates null edibleFraction", () => {
    expect(edibleGrams({ packGrams: 1000, edibleFraction: null })).toBeNull();
  });
});

describe("packNutrient", () => {
  it("scales per-100g composition to pack size", () => {
    // 1000g pack, 100% edible, 100 kcal/100g => 1000 kcal for the whole pack
    expect(packNutrient(TEST_ITEM, "kcal")).toBe(1000);
    expect(packNutrient(TEST_ITEM, "protein")).toBe(100);
  });
  it("returns null (not 0) when the nutrient is unknown", () => {
    expect(packNutrient(TEST_ITEM, "fiber")).toBeNull();
    expect(packNutrient(TEST_ITEM, "iron")).toBeNull();
  });
  it("returns null when pack geometry is unknown even if per100g is known", () => {
    const item = { ...TEST_ITEM, packGrams: null };
    expect(packNutrient(item, "kcal")).toBeNull();
  });
});

describe("aggregateNutrients", () => {
  it("sums a known nutrient across multiple items and marks it complete", () => {
    const result = aggregateNutrients([{ item: TEST_ITEM, qty: 2 }]);
    expect(result.kcal).toEqual({ value: 2000, complete: true });
    expect(result.protein).toEqual({ value: 200, complete: true });
  });

  it("marks a nutrient incomplete if any contributing item is unknown, without zeroing the known contributions", () => {
    const result = aggregateNutrients([
      { item: TEST_ITEM, qty: 1 },
      { item: UNKNOWN_ITEM, qty: 1 },
    ]);
    // kcal: TEST_ITEM contributes 1000, UNKNOWN_ITEM is null -> incomplete, but value still reflects the known part
    expect(result.kcal.value).toBe(1000);
    expect(result.kcal.complete).toBe(false);
    // a nutrient unknown on every item is still 0 value / incomplete, never silently "complete"
    expect(result.iron).toEqual({ value: 0, complete: false });
  });

  it("ignores items with zero or missing quantity", () => {
    const result = aggregateNutrients([
      { item: TEST_ITEM, qty: 0 },
      { item: TEST_ITEM, qty: undefined },
    ]);
    expect(result.kcal).toEqual({ value: 0, complete: true });
  });

  it("expands compound packs (item.parts) into their real components instead of a blended guess", () => {
    const bundle = {
      id: "TEST_ITEM_BUNDLE",
      parts: [
        { per100g: TEST_ITEM.per100g, packGrams: 500, edibleFraction: 1 }, // oats-like
        { per100g: { ...TEST_ITEM.per100g, kcal: 50 }, packGrams: 1000, edibleFraction: 1 }, // milk-like
      ],
    };
    const result = aggregateNutrients([{ item: bundle, qty: 1 }]);
    // 500g @ 100kcal/100g = 500, plus 1000g @ 50kcal/100g = 500 -> 1000 total
    expect(result.kcal).toEqual({ value: 1000, complete: true });
  });

  it("treats a genuinely zero-weight part as a known zero, not unknown, even with no composition data", () => {
    // 0g of anything contributes 0 of every nutrient regardless of whether
    // its per100g is known — this is what lets an unconfigured staple (see
    // staplesDailyNutrients) contribute a known zero instead of blocking
    // the whole total.
    const zeroWeight = { ...UNKNOWN_ITEM, edibleFraction: 0 };
    const result = aggregateNutrients([{ item: zeroWeight, qty: 1 }]);
    expect(result.kcal).toEqual({ value: 0, complete: true });
  });
});

describe("staplesDailyNutrients", () => {
  it("reads gramsPerDay directly, independent of any pack size", () => {
    const staples = { items: [{ ...TEST_ITEM, gramsPerDay: 150, packGrams: 5000 }] };
    const result = staplesDailyNutrients(staples);
    // 150g/day @ 100 kcal/100g = 150 kcal/day, NOT scaled by the 5000g pack
    expect(result.kcal).toEqual({ value: 150, complete: true });
  });

  it("is incomplete when a staple has no per100g data yet", () => {
    const staples = { items: [{ ...UNKNOWN_ITEM, gramsPerDay: 10 }] };
    const result = staplesDailyNutrients(staples);
    expect(result.kcal).toEqual({ value: 0, complete: false });
  });

  it("returns an all-zero, complete result for an empty staples config", () => {
    const result = staplesDailyNutrients({ items: [] });
    expect(result.kcal).toEqual({ value: 0, complete: true });
  });

  it("treats an unset gramsPerDay as 0 (not counted), not unknown, even with no per100g data", () => {
    // The out-of-the-box state: gramsPerDay is a planning input the user
    // hasn't gotten to yet, not a hidden food-science fact — it shouldn't
    // permanently block the whole daily total the way a missing per100g
    // value would for something actually in the cart.
    const staples = { items: [{ ...UNKNOWN_ITEM, gramsPerDay: null }] };
    const result = staplesDailyNutrients(staples);
    expect(result.kcal).toEqual({ value: 0, complete: true });
  });

  it("stays complete overall when some staples are configured and others are still untouched", () => {
    const rice = { ...TEST_ITEM, id: "rice", gramsPerDay: 150 }; // configured, known composition
    const untouchedOil = { ...UNKNOWN_ITEM, id: "oil", gramsPerDay: null }; // never configured
    const result = staplesDailyNutrients({ items: [rice, untouchedOil] });
    expect(result.kcal).toEqual({ value: 150, complete: true });
  });

  it("still reports incomplete for a staple that's partially configured (grams set, composition not)", () => {
    const halfConfigured = { ...UNKNOWN_ITEM, gramsPerDay: 10 }; // explicit intake, unknown composition
    const result = staplesDailyNutrients({ items: [halfConfigured] });
    expect(result.kcal).toEqual({ value: 0, complete: false });
  });
});

describe("resolvePrice", () => {
  it("prefers a live override over the catalog default", () => {
    const item = { id: "x", defaultPrice: 100 };
    const overrides = { x: { value: 120, updatedAt: "2026-01-01" } };
    expect(resolvePrice(item, overrides)).toBe(120);
  });
  it("falls back to defaultPrice when there is no override", () => {
    expect(resolvePrice({ id: "x", defaultPrice: 100 }, {})).toBe(100);
  });
  it("returns null when neither is known", () => {
    expect(resolvePrice({ id: "x", defaultPrice: null }, {})).toBeNull();
  });
});

describe("aggregateCost", () => {
  it("sums price * qty across the basket", () => {
    const item = { id: "x", defaultPrice: 50 };
    const result = aggregateCost([{ item, qty: 2 }], {});
    expect(result).toEqual({ value: 100, complete: true });
  });
  it("skips unknown prices without zeroing known ones, and marks incomplete", () => {
    const known = { id: "x", defaultPrice: 50 };
    const unknown = { id: "y", defaultPrice: null };
    const result = aggregateCost([{ item: known, qty: 1 }, { item: unknown, qty: 3 }], {});
    expect(result).toEqual({ value: 50, complete: false });
  });
});

describe("isPriceStale", () => {
  it("is false with no updatedAt", () => {
    expect(isPriceStale(null)).toBe(false);
  });
  it("is true past the threshold", () => {
    const now = new Date("2026-08-20").getTime();
    const updatedAt = new Date("2026-05-01").toISOString(); // ~111 days earlier
    expect(isPriceStale(updatedAt, { now, thresholdDays: 60 })).toBe(true);
  });
  it("is false within the threshold", () => {
    const now = new Date("2026-08-20").getTime();
    const updatedAt = new Date("2026-08-01").toISOString();
    expect(isPriceStale(updatedAt, { now, thresholdDays: 60 })).toBe(false);
  });
});

describe("staplesRestockCost", () => {
  it("sums resolved prices across staple items, skipping unknowns and flagging incomplete", () => {
    const staples = { items: [{ id: "a", defaultPrice: 50 }, { id: "b", defaultPrice: null }] };
    expect(staplesRestockCost(staples, {})).toEqual({ value: 50, complete: false });
  });
  it("is complete when every staple has a resolvable price", () => {
    const staples = { items: [{ id: "a", defaultPrice: 50 }, { id: "b", defaultPrice: 20 }] };
    expect(staplesRestockCost(staples, {})).toEqual({ value: 70, complete: true });
  });
});

describe("valuePerCurrency", () => {
  it("computes a per-EGP rate", () => {
    expect(valuePerCurrency(200, 50)).toBe(4);
  });
  it("is null for unknown or non-positive price", () => {
    expect(valuePerCurrency(200, null)).toBeNull();
    expect(valuePerCurrency(200, 0)).toBeNull();
    expect(valuePerCurrency(null, 50)).toBeNull();
  });
});

describe("interpolateInstruction", () => {
  it("substitutes the {days} token", () => {
    expect(interpolateInstruction("Pick 2 packs for {days} days", 3.5)).toBe("Pick 2 packs for 3.5 days");
  });
  it("formats whole-number durations without a decimal", () => {
    expect(interpolateInstruction("Pick 2 packs for {days} days", 7)).toBe("Pick 2 packs for 7 days");
  });
});
