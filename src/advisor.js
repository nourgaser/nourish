// Pure rule engine for basket advice. No React, no I/O — everything here
// takes plain data and returns a list of findings so each rule is testable
// in isolation and the caller (App.jsx) decides how to render them.
//
// A finding: { severity: "error"|"warn"|"info", code, message, ...extra }
// Checkout is blocked only by "error" — see canCheckout().

import { NUTRIENT_KEYS, aggregateNutrients, formatDays } from "./nutrition";

export const SEVERITY_RANK = { error: 0, warn: 1, info: 2 };

// Targets don't cover carbs (it's the "remainder" macro once
// protein/fat/fiber are set) — everything else is a tracked floor/ceiling.
const TRACKED_NUTRIENT_KEYS = NUTRIENT_KEYS.filter((k) => k !== "carbs");
export const MICRO_KEYS = [
  "calcium", "iron", "zinc", "magnesium", "potassium",
  "folate", "vitA", "vitC", "vitD", "b12", "omega3",
];
// "On target" for a micro means at least 80% of its floor — shared with the
// UI's Micros tile so the collapsed advisor finding and the expanded
// coverage bars never disagree about what counts as a gap.
export const MICRO_TARGET_RATIO = 0.8;

function finding(severity, code, message, extra = {}) {
  return { severity, code, message, ...extra };
}

// --- budget --------------------------------------------------------------

function budgetFindings({ finalCost, costComplete, budgetLimit, budgetGrace = 50 }) {
  if (!costComplete) {
    return [finding("info", "COST_INCOMPLETE", "Some prices are still unknown — the cost total is a partial figure.")];
  }
  const overBudget = Math.round(finalCost - budgetLimit);
  if (overBudget > budgetGrace) {
    return [finding("error", "OVER_BUDGET", `Over budget by ${overBudget} EGP. (Max buffer ${budgetGrace} EGP)`)];
  }
  if (overBudget > 0) {
    return [finding("warn", "OVER_BUDGET_GRACE", `Over budget by ${overBudget} EGP but within the ${budgetGrace} EGP buffer.`)];
  }
  return [];
}

// --- module minimums + constraints ---------------------------------------

function moduleFindings({ categories, categoryCounts, entries }) {
  const findings = [];
  for (const cat of categories) {
    const count = categoryCounts[cat.id] || 0;
    if (count < cat.minSelection) {
      findings.push(finding(
        "warn", "MODULE_MIN_UNMET",
        `Add ${cat.minSelection - count} more item(s) to ${cat.title}.`,
        { moduleId: cat.id },
      ));
    }

    for (const constraint of cat.constraints || []) {
      if (constraint.type !== "requireTag") continue;
      const matchCount = (cat.items || []).filter((item) => {
        const inCart = entries.some((e) => e.item.id === item.id);
        return inCart && (item.tags || []).includes(constraint.tag);
      }).length;
      if (matchCount < (constraint.min ?? 1)) {
        findings.push(finding(
          "warn", "MODULE_CONSTRAINT_UNMET",
          constraint.message || `${cat.title} is missing a required "${constraint.tag}" item.`,
          { moduleId: cat.id, tag: constraint.tag },
        ));
      }
    }
  }
  return findings;
}

// --- macro floors/ceilings -------------------------------------------------
//
// Each check reads dailyNutrients[key].complete first — an unknown value
// suppresses the rule entirely rather than comparing against 0 and firing a
// false "too low" warning (Phase 1's data-completeness principle, applied
// to the advisor).

function macroFindings({ dailyNutrients, targets }) {
  const findings = [];

  const fat = dailyNutrients.fat;
  if (fat?.complete && targets.fat) {
    if (targets.fat.hardFloor != null && fat.value < targets.fat.hardFloor) {
      // Hard-floor breach replaces the soft-floor warning with an error —
      // this is the single most important new rule per the spec: fat this
      // low risks fat-soluble vitamin absorption and hormone synthesis.
      findings.push(finding(
        "error", "FAT_BELOW_HARD_FLOOR",
        `Fat is critically low (${Math.round(fat.value)}g, hard floor ${targets.fat.hardFloor}g) — risks fat-soluble vitamin absorption and hormone synthesis.`,
        { nutrient: "fat" },
      ));
    } else if (targets.fat.floor != null && fat.value < targets.fat.floor) {
      findings.push(finding(
        "warn", "FAT_BELOW_FLOOR",
        `Fat is below target (${Math.round(fat.value)}g, floor ${targets.fat.floor}g).`,
        { nutrient: "fat" },
      ));
    }
    if (targets.fat.ceiling != null && fat.value > targets.fat.ceiling) {
      findings.push(finding(
        "warn", "FAT_ABOVE_CEILING",
        `Fat is above target (${Math.round(fat.value)}g, ceiling ${targets.fat.ceiling}g).`,
        { nutrient: "fat" },
      ));
    }
  }

  const protein = dailyNutrients.protein;
  if (protein?.complete && targets.protein?.floor != null && protein.value < targets.protein.floor) {
    findings.push(finding(
      "warn", "PROTEIN_BELOW_FLOOR",
      `Protein is below target (${Math.round(protein.value)}g, floor ${targets.protein.floor}g).`,
      { nutrient: "protein" },
    ));
  }

  const fiber = dailyNutrients.fiber;
  if (fiber?.complete && targets.fiber) {
    if (targets.fiber.floor != null && fiber.value < targets.fiber.floor) {
      findings.push(finding(
        "warn", "FIBER_BELOW_FLOOR",
        `Fiber is below target (${Math.round(fiber.value)}g, floor ${targets.fiber.floor}g).`,
        { nutrient: "fiber" },
      ));
    }
    if (targets.fiber.ceiling != null && fiber.value > targets.fiber.ceiling) {
      findings.push(finding(
        "warn", "FIBER_ABOVE_CEILING",
        `Fiber is above target (${Math.round(fiber.value)}g, ceiling ${targets.fiber.ceiling}g).`,
        { nutrient: "fiber" },
      ));
    }
  }

  const kcal = dailyNutrients.kcal;
  if (kcal?.complete && targets.kcal) {
    if (targets.kcal.floor != null && kcal.value < targets.kcal.floor) {
      findings.push(finding(
        "warn", "KCAL_BELOW_FLOOR",
        `Calories are below target (${Math.round(kcal.value)}, floor ${targets.kcal.floor}).`,
        { nutrient: "kcal" },
      ));
    }
    if (targets.kcal.ceiling != null && kcal.value > targets.kcal.ceiling) {
      findings.push(finding(
        "warn", "KCAL_ABOVE_CEILING",
        `Calories are above target (${Math.round(kcal.value)}, ceiling ${targets.kcal.ceiling}) — bulking faster than intended.`,
        { nutrient: "kcal" },
      ));
    }
  }

  const satFat = dailyNutrients.satFat;
  if (satFat?.complete && targets.satFat?.ceiling != null && satFat.value > targets.satFat.ceiling) {
    findings.push(finding(
      "warn", "SATFAT_ABOVE_CEILING",
      `Saturated fat is above target (${Math.round(satFat.value)}g, ceiling ${targets.satFat.ceiling}g).`,
      { nutrient: "satFat" },
    ));
  }

  return findings;
}

// --- micronutrient gaps ----------------------------------------------------
//
// Collapsed into a single finding — spec is explicit that 11 separate
// warnings would be worse than useless. `nutrients` carries the detail for
// a UI that wants to expand it.

function micronutrientFindings({ dailyNutrients, targets }) {
  const below = MICRO_KEYS.filter((key) => {
    const daily = dailyNutrients[key];
    const floor = targets[key]?.floor;
    return daily?.complete && floor != null && daily.value < floor * MICRO_TARGET_RATIO;
  });
  if (below.length === 0) return [];
  return [finding(
    "info", "MICROS_BELOW_TARGET",
    `${below.length} nutrient${below.length > 1 ? "s" : ""} below target.`,
    { nutrients: below },
  )];
}

// --- perishability ----------------------------------------------------

function perishabilityFindings({ entries, tripDurationDays }) {
  const short = entries.filter(({ item }) => item.shelfLifeDays != null && item.shelfLifeDays < tripDurationDays);
  if (short.length === 0) return [];
  return [finding(
    "warn", "SHELF_LIFE_SHORT",
    "Fresh items won't last the full trip — consider frozen or a mid-week top-up.",
    { items: short.map(({ item }) => item.id) },
  )];
}

// --- meal-slot coverage ----------------------------------------------------
//
// There's no explicit "servings per pack" field in the schema (adding one
// without real data would be exactly the kind of invented number Phase 1
// avoided), so this treats each unit of quantity bought as roughly one
// day's serving for that slot — a modeling simplification, not a fact.

function slotCoverageFindings({ entries, categories, tripDurationDays }) {
  const slots = new Set();
  categories.forEach((cat) => (cat.items || []).forEach((item) => (item.slots || []).forEach((s) => slots.add(s))));

  const findings = [];
  for (const slot of slots) {
    const coverage = entries.reduce((sum, { item, qty }) => ((item.slots || []).includes(slot) ? sum + qty : sum), 0);
    if (coverage < tripDurationDays) {
      findings.push(finding(
        "warn", "SLOT_COVERAGE_LOW",
        `Not enough ${slot} coverage for the trip (${formatDays(coverage)}/${formatDays(tripDurationDays)} days).`,
        { slot },
      ));
    }
  }
  return findings;
}

// --- effort budget ----------------------------------------------------

function effortFindings({ entries, dailyNutrients }) {
  if (!dailyNutrients.kcal?.complete) return [];
  let totalKcal = 0;
  let effortfulKcal = 0;
  for (const { item, qty } of entries) {
    const kcal = aggregateNutrients([{ item, qty }]).kcal;
    if (!kcal.complete) continue;
    totalKcal += kcal.value;
    if (item.effort === 3) effortfulKcal += kcal.value;
  }
  if (totalKcal > 0 && effortfulKcal / totalKcal > 0.6) {
    return [finding("info", "EFFORT_HEAVY", "This plan needs a lot of cooking — over 60% of calories come from real-cooking items.")];
  }
  return [];
}

// --- data completeness ----------------------------------------------------

function dataCompletenessFindings({ entries }) {
  let incompleteCount = 0;
  for (const { item } of entries) {
    const single = aggregateNutrients([{ item, qty: 1 }]);
    if (TRACKED_NUTRIENT_KEYS.some((key) => !single[key].complete)) incompleteCount += 1;
  }
  if (incompleteCount === 0) return [];
  return [finding(
    "info", "DATA_INCOMPLETE",
    `Nutrition data incomplete for ${incompleteCount} item${incompleteCount > 1 ? "s" : ""}.`,
    { count: incompleteCount },
  )];
}

// --- entry point -----------------------------------------------------

// context: {
//   entries,          [{ item, qty }] — cart items only, qty > 0
//   categories,
//   categoryCounts,   distinct-item count per category id
//   dailyNutrients,   { key: { value, complete } } — daily, incl. staples
//   targets,          profile.targets
//   tripDurationDays,
//   finalCost, costComplete, budgetLimit, budgetGrace,
// }
export function evaluateBasket(context) {
  const findings = [
    ...budgetFindings(context),
    ...moduleFindings(context),
    ...macroFindings(context),
    ...micronutrientFindings(context),
    ...perishabilityFindings(context),
    ...slotCoverageFindings(context),
    ...effortFindings(context),
    ...dataCompletenessFindings(context),
  ];
  return findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export function canCheckout(findings) {
  return !findings.some((f) => f.severity === "error");
}
