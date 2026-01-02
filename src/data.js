export const APP_CONFIG = {
  budgetLimit: 750, // Strict limit per trip
  targetDailyCalories: 2700,
  targetDailyProtein: 140, 
  tripDurationDays: 3.5, 
};

// CONSTANTS FOR "INVISIBLE" FOOD (Staples)
// Assumes: 400g Rice (cooked) + 2 tbsp Olive Oil + 1 tbsp Honey per day
// This provides the caloric "floor" so you don't have to buy 100% of calories from fresh food.
export const STAPLES_COST = 250; 
export const STAPLES_CALORIES = 1100; // Increased for weight gain reality
export const STAPLES_PROTEIN = 12;

export const CATEGORIES = [
  {
    id: "protein",
    title: "Protein Source",
    subtitle: "Aim for 2 items",
    items: [
      {
        id: "chicken_breast",
        name: "Chicken Breast",
        qty: "1 kg",
        price: 265,
        calories: 1650, 
        protein: 310,   
        tags: ["Lean", "Safe"],
        shoppingItem: "Chicken Breast Fillet (1kg)",
        prep: "Pan-sear batches. Keep bland for bad IBS days."
      },
      {
        id: "minced_beef",
        name: "Lean Minced Beef",
        qty: "750g",
        price: 240, 
        calories: 1875,
        protein: 190,
        tags: ["Iron", "Energy"],
        shoppingItem: "Mafroom (Low Fat) - 750g",
        prep: "Cook with cumin/salt. Drain fat well."
      },
      {
        id: "thighs",
        name: "Chicken Thighs",
        qty: "1 kg",
        price: 250, 
        calories: 2090,
        protein: 260,
        tags: ["Tasty", "Bulking"],
        shoppingItem: "Boneless Thighs (1kg)",
        prep: "Oven roast. High calorie density."
      },
      {
        id: "tuna_mix",
        name: "Tuna Pack",
        qty: "3 Cans",
        price: 180, 
        calories: 600,
        protein: 90,
        tags: ["No Cook", "Omega-3"],
        shoppingItem: "Rio Mare Tuna (3)",
        prep: "Mix with corn & mayo. Zero effort."
      },
    ],
  },
  {
    id: "breakfast",
    title: "Breakfast & Carbs",
    subtitle: "Mix & Match",
    items: [
      {
        id: "oats_bundle",
        name: "Oats & LF Milk",
        qty: "Bundle",
        price: 130,
        calories: 1400, 
        protein: 60,
        tags: ["Fiber", "Heart"],
        shoppingItem: "Milkman Lactose-Free + Oats",
        prep: "Overnight oats. Add your pantry Honey."
      },
      {
        id: "belila_bundle",
        name: "Belila Warm-Up",
        qty: "2 Cans",
        price: 50, // Adjusted down (Just cans, assuming milk bought above or separate)
        calories: 400, 
        protein: 15,
        tags: ["Comfort", "Fast"],
        shoppingItem: "Harvest Belila (2 cans)",
        prep: "Heat in microwave."
      },
      {
        id: "eggs_pack",
        name: "Eggs (30)",
        qty: "1 Pack",
        price: 190, 
        calories: 2100,
        protein: 180,
        tags: ["Essential", "Gold"],
        shoppingItem: "Red/White Eggs (30 Pack)",
        prep: "Boil 10 at a time."
      },
      {
        id: "foul_cans",
        name: "Foul Medames",
        qty: "2 Cans",
        price: 50,
        calories: 350,
        protein: 24,
        tags: ["Slow Carb"],
        shoppingItem: "Harvest Foul (2)",
        prep: "Rinse well (IBS)."
      }
    ],
  },
  {
    id: "produce",
    title: "Fresh & Vitality",
    subtitle: "Fill the gaps",
    items: [
      {
        id: "citrus_kg",
        name: "Tangerines",
        qty: "1 kg",
        price: 30,
        calories: 500,
        protein: 8,
        tags: ["Vit C"],
        shoppingItem: "Tangerines (1kg)",
        prep: "Snack with Iron sources."
      },
      {
        id: "bananas_kg",
        name: "Bananas",
        qty: "1 kg",
        price: 45,
        calories: 900,
        protein: 10,
        tags: ["Potassium"],
        shoppingItem: "Bananas (1kg)",
        prep: "Counter top."
      },
      {
        id: "veg_mix",
        name: "Veg Salad Base",
        qty: "2 kg mix",
        price: 60,
        calories: 100,
        protein: 5,
        tags: ["Hydration"],
        shoppingItem: "Cucumber + Peppers",
        prep: "Wash immediately."
      },
    ],
  },
  {
    id: "gut",
    title: "Gut Shield",
    subtitle: "Don't skip",
    items: [
      {
        id: "rayeb",
        name: "Rayeb",
        qty: "3 Bottles",
        price: 90,
        calories: 510,
        protein: 27,
        tags: ["Probiotic"],
        shoppingItem: "Juhayna Rayeb (3)",
        prep: "Digestive aid."
      },
      {
        id: "yogurt",
        name: "Yogurt LF",
        qty: "4 Cups",
        price: 80, 
        calories: 400,
        protein: 20,
        tags: ["Light"],
        shoppingItem: "Lactose-Free Yogurt (4)",
        prep: "Snack."
      },
    ],
  },
];