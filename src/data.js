export const APP_CONFIG = {
  budgetLimit: 750, 
  targetDailyCalories: 2700,
  targetDailyProtein: 140, 
  tripDurationDays: 3.5, 
};

// Items usually bought monthly, but we need to toggle them sometimes
export const STAPLES_COST = 250; // Cost if you need to refill Rice/Oil/Honey
export const STAPLES_CALORIES = 650; // Daily Calorie contribution from staples
export const STAPLES_PROTEIN = 8;    // Daily Protein contribution from staples

export const CATEGORIES = [
  {
    id: "protein",
    title: "Protein Base",
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
        tags: ["Iron High", "Energy"],
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
        tags: ["Tasty", "Fatty"],
        shoppingItem: "Boneless Thighs (1kg)",
        prep: "Oven roast. Higher fat content = Satiety."
      },
      {
        id: "tuna_mix",
        name: "Tuna & Corn",
        qty: "3 Cans",
        price: 180, 
        calories: 600,
        protein: 90,
        tags: ["No Cook", "Omega-3"],
        shoppingItem: "Rio Mare Tuna (3) + Sweet Corn",
        prep: "Mix with corn & mayo. Zero effort."
      },
    ],
  },
  {
    id: "breakfast",
    title: "Morning Fuel",
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
        price: 101, 
        calories: 900, 
        protein: 40,
        tags: ["Comfort", "Fast"],
        shoppingItem: "Harvest Belila (2) + Milkman LF",
        prep: "Heat in microwave. Easy on stomach."
      },
      {
        id: "eggs_foul",
        name: "Eggs & Foul",
        qty: "Tray + 2 Cans",
        price: 239, 
        calories: 2600,
        protein: 210,
        tags: ["High Prot", "Savory"],
        shoppingItem: "Eggs (30) + Harvest Foul (2)",
        prep: "Boil eggs in batch. Rinse foul well."
      },
    ],
  },
  {
    id: "produce",
    title: "Vitality (Counter)",
    items: [
      {
        id: "immunity",
        name: "Immunity C",
        qty: "Citrus Mix",
        price: 75,
        calories: 600,
        protein: 8,
        tags: ["Vit C", "Iron Absorb"],
        shoppingItem: "Tangerines (1kg) + Guava/Orange",
        prep: "Wash & Bowl. Eat with Protein meals."
      },
      {
        id: "potassium",
        name: "Potassium Hit",
        qty: "Bananas+",
        price: 60,
        calories: 500,
        protein: 5,
        tags: ["Energy", "Safe"],
        shoppingItem: "Bananas (1kg) + Cucumber",
        prep: "Keep visible on dining table."
      },
      {
        id: "crunch",
        name: "The Crunch",
        qty: "Apples/Carrot",
        price: 120,
        calories: 600,
        protein: 5,
        tags: ["Snack", "Fiber"],
        shoppingItem: "Apples (1kg) + Carrots",
        prep: "Peel apples if bloated. Wash carrots."
      },
    ],
  },
  {
    id: "gut",
    title: "Gut Shield",
    items: [
      {
        id: "rayeb",
        name: "Rayeb Force",
        qty: "3 Bottles",
        price: 90,
        calories: 510,
        protein: 27,
        tags: ["Probiotic", "Essential"],
        shoppingItem: "Juhayna/Almarai Rayeb (3)",
        prep: "Drink after heavy meals."
      },
      {
        id: "yogurt",
        name: "Yogurt Cups",
        qty: "4 Cups",
        price: 80, 
        calories: 400,
        protein: 20,
        tags: ["Light", "Snack"],
        shoppingItem: "Lactose-Free Yogurt (4)",
        prep: "Add honey."
      },
    ],
  },
];