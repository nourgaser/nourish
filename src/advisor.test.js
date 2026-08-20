import { describe, it, expect } from "vitest";
import { evaluateBasket, canCheckout } from "./advisor";

// Minimal per100g fixture — only the keys a given test cares about need
// real numbers; everything else stays null (unknown), matching how the
// real catalog ships.
function per100g(overrides = {}) {
  return {
    kcal: null, protein: null, fat: null, satFat: null, carbs: null, fiber: null,
    calcium: null, iron: null, zinc: null, magnesium: null, potassium: null,
    folate: null, vitA: null, vitC: null, vitD: null, b12: null, omega3: null,
    ...overrides,
  };
}

function item(overrides = {}) {
  return {
    id: "item",
    packGrams: 1000,
    edibleFraction: 1,
    shelfLifeDays: null,
    effort: null,
    slots: [],
    tags: [],
    per100g: per100g(),
    ...overrides,
  };
}

function daily(overrides = {}) {
  // Defaults to a basket that meets every target (not zero — zero really
  // is below every floor and would make every test fixture noisy). Tests
  // override just the nutrient(s) they're exercising.
  const base = {
    kcal: { value: 2700, complete: true },
    protein: { value: 150, complete: true },
    fat: { value: 80, complete: true },
    satFat: { value: 10, complete: true },
    carbs: { value: 300, complete: true },
    fiber: { value: 35, complete: true },
    calcium: { value: 1000, complete: true },
    iron: { value: 8, complete: true },
    zinc: { value: 11, complete: true },
    magnesium: { value: 400, complete: true },
    potassium: { value: 3400, complete: true },
    folate: { value: 400, complete: true },
    vitA: { value: 900, complete: true },
    vitC: { value: 90, complete: true },
    vitD: { value: 15, complete: true },
    b12: { value: 2.4, complete: true },
    omega3: { value: 500, complete: true },
  };
  return { ...base, ...overrides };
}

const DEFAULT_TARGETS = {
  kcal: { target: 2700, floor: 2500, ceiling: 2950 },
  protein: { floor: 130 },
  fat: { floor: 75, hardFloor: 55, ceiling: 95 },
  fiber: { floor: 30, ceiling: 40 },
  satFat: { ceiling: 30 },
  calcium: { floor: 1000 }, iron: { floor: 8 }, zinc: { floor: 11 },
  magnesium: { floor: 400 }, potassium: { floor: 3400 },
  folate: { floor: 400 }, vitA: { floor: 900 }, vitC: { floor: 90 },
  vitD: { floor: 15 }, b12: { floor: 2.4 }, omega3: { floor: 500 },
};

function baseContext(overrides = {}) {
  return {
    entries: [],
    categories: [],
    categoryCounts: {},
    dailyNutrients: daily(),
    targets: DEFAULT_TARGETS,
    tripDurationDays: 3.5,
    finalCost: 0,
    costComplete: true,
    budgetLimit: 750,
    budgetGrace: 50,
    ...overrides,
  };
}

describe("budget findings", () => {
  it("is silent within budget", () => {
    const findings = evaluateBasket(baseContext({ finalCost: 700, budgetLimit: 750 }));
    expect(findings.find(f => f.code?.startsWith("OVER_BUDGET"))).toBeUndefined();
  });
  it("warns within the grace buffer", () => {
    const findings = evaluateBasket(baseContext({ finalCost: 780, budgetLimit: 750 }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "OVER_BUDGET_GRACE" }));
  });
  it("errors past the grace buffer", () => {
    const findings = evaluateBasket(baseContext({ finalCost: 900, budgetLimit: 750 }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "error", code: "OVER_BUDGET" }));
  });
  it("reports incomplete cost as info, not a budget verdict", () => {
    const findings = evaluateBasket(baseContext({ costComplete: false, finalCost: 900, budgetLimit: 750 }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "info", code: "COST_INCOMPLETE" }));
    expect(findings.find(f => f.code?.startsWith("OVER_BUDGET"))).toBeUndefined();
  });
});

describe("module findings", () => {
  it("warns when minSelection is unmet", () => {
    const cat = { id: "protein", title: "Protein Base", minSelection: 2, items: [] };
    const findings = evaluateBasket(baseContext({ categories: [cat], categoryCounts: { protein: 1 } }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "MODULE_MIN_UNMET", moduleId: "protein" }));
  });
  it("is silent once minSelection is met", () => {
    const cat = { id: "protein", title: "Protein Base", minSelection: 2, items: [] };
    const findings = evaluateBasket(baseContext({ categories: [cat], categoryCounts: { protein: 2 } }));
    expect(findings.find(f => f.code === "MODULE_MIN_UNMET")).toBeUndefined();
  });
  it("warns when a requireTag constraint is unmet", () => {
    const tuna = item({ id: "tuna", tags: [] });
    const cat = {
      id: "protein", title: "Protein Base", minSelection: 1, items: [tuna],
      constraints: [{ type: "requireTag", tag: "omega-3", min: 1, message: "Add an omega-3 source." }],
    };
    const findings = evaluateBasket(baseContext({
      categories: [cat], categoryCounts: { protein: 1 }, entries: [{ item: tuna, qty: 1 }],
    }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "MODULE_CONSTRAINT_UNMET", message: "Add an omega-3 source." }));
  });
  it("satisfies a requireTag constraint when a tagged item is in the cart", () => {
    const tuna = item({ id: "tuna", tags: ["omega-3"] });
    const cat = {
      id: "protein", title: "Protein Base", minSelection: 1, items: [tuna],
      constraints: [{ type: "requireTag", tag: "omega-3", min: 1, message: "Add an omega-3 source." }],
    };
    const findings = evaluateBasket(baseContext({
      categories: [cat], categoryCounts: { protein: 1 }, entries: [{ item: tuna, qty: 1 }],
    }));
    expect(findings.find(f => f.code === "MODULE_CONSTRAINT_UNMET")).toBeUndefined();
  });
});

describe("macro findings", () => {
  it("errors when fat is below the hard floor, and does not also warn the soft floor", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ fat: { value: 40, complete: true } }) }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "error", code: "FAT_BELOW_HARD_FLOOR" }));
    expect(findings.find(f => f.code === "FAT_BELOW_FLOOR")).toBeUndefined();
  });
  it("warns (not errors) when fat is between the hard floor and the soft floor", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ fat: { value: 65, complete: true } }) }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "FAT_BELOW_FLOOR" }));
    expect(findings.find(f => f.code === "FAT_BELOW_HARD_FLOOR")).toBeUndefined();
  });
  it("warns when fat is above the ceiling", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ fat: { value: 120, complete: true } }) }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "FAT_ABOVE_CEILING" }));
  });
  it("suppresses fat rules entirely when fat data is incomplete", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ fat: { value: 10, complete: false } }) }));
    expect(findings.filter(f => f.nutrient === "fat")).toHaveLength(0);
  });
  it("warns when protein is below floor", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ protein: { value: 100, complete: true } }) }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "PROTEIN_BELOW_FLOOR" }));
  });
  it("warns when calories are below floor, and separately above ceiling", () => {
    const low = evaluateBasket(baseContext({ dailyNutrients: daily({ kcal: { value: 2000, complete: true } }) }));
    expect(low).toContainEqual(expect.objectContaining({ severity: "warn", code: "KCAL_BELOW_FLOOR" }));

    const high = evaluateBasket(baseContext({ dailyNutrients: daily({ kcal: { value: 3200, complete: true } }) }));
    expect(high).toContainEqual(expect.objectContaining({ severity: "warn", code: "KCAL_ABOVE_CEILING" }));
  });
  it("warns when saturated fat is above ceiling", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ satFat: { value: 40, complete: true } }) }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "SATFAT_ABOVE_CEILING" }));
  });
  it("warns fiber below floor and above ceiling", () => {
    const low = evaluateBasket(baseContext({ dailyNutrients: daily({ fiber: { value: 10, complete: true } }) }));
    expect(low).toContainEqual(expect.objectContaining({ code: "FIBER_BELOW_FLOOR" }));
    const high = evaluateBasket(baseContext({ dailyNutrients: daily({ fiber: { value: 50, complete: true } }) }));
    expect(high).toContainEqual(expect.objectContaining({ code: "FIBER_ABOVE_CEILING" }));
  });
});

describe("micronutrient findings", () => {
  it("collapses multiple gaps into a single finding", () => {
    const findings = evaluateBasket(baseContext({
      dailyNutrients: daily({
        calcium: { value: 200, complete: true }, // < 80% of 1000
        iron: { value: 1, complete: true },      // < 80% of 8
      }),
    }));
    const micro = findings.find(f => f.code === "MICROS_BELOW_TARGET");
    expect(micro.severity).toBe("info");
    expect(micro.nutrients).toEqual(expect.arrayContaining(["calcium", "iron"]));
    expect(findings.filter(f => f.code === "MICROS_BELOW_TARGET")).toHaveLength(1);
  });
  it("is silent when every micro is at or above 80% of floor", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ calcium: { value: 1000, complete: true } }) }));
    expect(findings.find(f => f.code === "MICROS_BELOW_TARGET")).toBeUndefined();
  });
  it("ignores an incomplete micro rather than treating it as a gap", () => {
    const findings = evaluateBasket(baseContext({ dailyNutrients: daily({ calcium: { value: 0, complete: false } }) }));
    expect(findings.find(f => f.code === "MICROS_BELOW_TARGET")).toBeUndefined();
  });
});

describe("perishability findings", () => {
  it("aggregates short-shelf-life items into one warning", () => {
    const chicken = item({ id: "chicken", shelfLifeDays: 2 });
    const findings = evaluateBasket(baseContext({ entries: [{ item: chicken, qty: 1 }], tripDurationDays: 7 }));
    const found = findings.find(f => f.code === "SHELF_LIFE_SHORT");
    expect(found.severity).toBe("warn");
    expect(found.items).toEqual(["chicken"]);
  });
  it("is silent when everything outlasts the trip", () => {
    const canned = item({ id: "canned", shelfLifeDays: 365 });
    const findings = evaluateBasket(baseContext({ entries: [{ item: canned, qty: 1 }], tripDurationDays: 7 }));
    expect(findings.find(f => f.code === "SHELF_LIFE_SHORT")).toBeUndefined();
  });
});

describe("slot coverage findings", () => {
  it("warns when a slot has less coverage than trip days", () => {
    const eggs = item({ id: "eggs", slots: ["breakfast"] });
    const cat = { id: "breakfast", title: "Breakfast", minSelection: 1, items: [eggs] };
    const findings = evaluateBasket(baseContext({
      categories: [cat], entries: [{ item: eggs, qty: 1 }], tripDurationDays: 7,
    }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "warn", code: "SLOT_COVERAGE_LOW", slot: "breakfast" }));
  });
  it("is silent once coverage meets trip days", () => {
    const eggs = item({ id: "eggs", slots: ["breakfast"] });
    const cat = { id: "breakfast", title: "Breakfast", minSelection: 1, items: [eggs] };
    const findings = evaluateBasket(baseContext({
      categories: [cat], entries: [{ item: eggs, qty: 7 }], tripDurationDays: 7,
    }));
    expect(findings.find(f => f.code === "SLOT_COVERAGE_LOW")).toBeUndefined();
  });
});

describe("effort findings", () => {
  it("flags a plan where most calories need real cooking", () => {
    const cooked = item({ id: "cooked", effort: 3, per100g: per100g({ kcal: 200 }) });
    const findings = evaluateBasket(baseContext({
      entries: [{ item: cooked, qty: 1 }],
      dailyNutrients: daily({ kcal: { value: 2000, complete: true } }),
    }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "info", code: "EFFORT_HEAVY" }));
  });
  it("is silent when kcal data is incomplete", () => {
    const cooked = item({ id: "cooked", effort: 3, per100g: per100g({ kcal: 200 }) });
    const findings = evaluateBasket(baseContext({
      entries: [{ item: cooked, qty: 1 }],
      dailyNutrients: daily({ kcal: { value: 0, complete: false } }),
    }));
    expect(findings.find(f => f.code === "EFFORT_HEAVY")).toBeUndefined();
  });
  it("is silent when cooking-heavy items are a minority of calories", () => {
    const cooked = item({ id: "cooked", effort: 3, per100g: per100g({ kcal: 50 }) });
    const easy = item({ id: "easy", effort: 1, per100g: per100g({ kcal: 200 }) });
    const findings = evaluateBasket(baseContext({
      entries: [{ item: cooked, qty: 1 }, { item: easy, qty: 1 }],
      dailyNutrients: daily({ kcal: { value: 250, complete: true } }),
    }));
    expect(findings.find(f => f.code === "EFFORT_HEAVY")).toBeUndefined();
  });
});

describe("data completeness findings", () => {
  it("counts items with any unknown tracked nutrient", () => {
    const known = item({ id: "known", per100g: per100g(Object.fromEntries(["kcal","protein","fat","satFat","fiber","calcium","iron","zinc","magnesium","potassium","folate","vitA","vitC","vitD","b12","omega3"].map(k => [k, 1]))) });
    const unknown = item({ id: "unknown" }); // all null
    const findings = evaluateBasket(baseContext({ entries: [{ item: known, qty: 1 }, { item: unknown, qty: 1 }] }));
    expect(findings).toContainEqual(expect.objectContaining({ severity: "info", code: "DATA_INCOMPLETE", count: 1 }));
  });
  it("is silent when every cart item has full data", () => {
    const filled = Object.fromEntries(["kcal","protein","fat","satFat","fiber","calcium","iron","zinc","magnesium","potassium","folate","vitA","vitC","vitD","b12","omega3"].map(k => [k, 1]));
    const known = item({ id: "known", per100g: per100g(filled) });
    const findings = evaluateBasket(baseContext({ entries: [{ item: known, qty: 1 }] }));
    expect(findings.find(f => f.code === "DATA_INCOMPLETE")).toBeUndefined();
  });
});

describe("evaluateBasket ordering + canCheckout", () => {
  it("sorts errors before warns before infos", () => {
    const findings = evaluateBasket(baseContext({
      finalCost: 900, budgetLimit: 750, // error
      dailyNutrients: daily({
        protein: { value: 50, complete: true }, // warn
        calcium: { value: 100, complete: true }, // info (micros)
      }),
    }));
    const ranks = findings.map(f => f.severity);
    const errorIdx = ranks.indexOf("error");
    const warnIdx = ranks.indexOf("warn");
    const infoIdx = ranks.indexOf("info");
    expect(errorIdx).toBeLessThan(warnIdx);
    expect(warnIdx).toBeLessThan(infoIdx);
  });

  it("blocks checkout only on error-level findings", () => {
    const warnOnly = evaluateBasket(baseContext({ finalCost: 780, budgetLimit: 750 }));
    expect(canCheckout(warnOnly)).toBe(true);

    const withError = evaluateBasket(baseContext({ finalCost: 900, budgetLimit: 750 }));
    expect(canCheckout(withError)).toBe(false);
  });

  it("is clean (no findings) for a basket that meets every check", () => {
    const findings = evaluateBasket(baseContext());
    expect(findings).toEqual([]);
    expect(canCheckout(findings)).toBe(true);
  });
});
