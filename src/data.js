// src/data.js

export const APP_CONFIG = {
  budgetLimit: 750, // Per trip (assuming 2 trips/week = 6000/month)
  targetDailyCalories: 2700,
  targetDailyProtein: 140, // Grams
  tripDurationDays: 3.5, // Shopping for half the week
};

export const STAPLES_PANTRY = {
  // Items you have at home (Monthly buy). We count their calories but not their trip cost.
  rice: { name: "White Rice", calPer100g: 130, proteinPer100g: 2.7 },
  oliveOil: { name: "Olive Oil", calPer100g: 884, proteinPer100g: 0 },
  honey: { name: "Honey", calPer100g: 304, proteinPer100g: 0.3 },
};

export const CATEGORIES = [
  {
    id: "protein",
    title: "Main Protein (3-4 Days)",
    items: [
      {
        id: "chicken_breast",
        name: "Chicken Breast (1kg)",
        price: 265,
        calories: 1650, // Total in pack
        protein: 310,   // Total in pack
        ibsNote: "Safe. Good for lean bulk.",
        mealIdea: "Pan-seared cubes with rice",
      },
      {
        id: "minced_beef",
        name: "Low Fat Minced Beef (750g)",
        price: 240, // Est
        calories: 1875,
        protein: 190,
        ibsNote: "Drain fat well. High Iron.",
        mealIdea: "Bolognese or Beef hash with potatoes",
      },
      {
        id: "thighs",
        name: "Boneless Thighs (1kg)",
        price: 250, // Est
        calories: 2090,
        protein: 260,
        ibsNote: "Higher fat but very satiating.",
        mealIdea: "Oven roasted with herbs",
      },
    ],
  },
  {
    id: "breakfast",
    title: "Breakfast & Carbs",
    items: [
      {
        id: "oats_milk",
        name: "Oats + Milkman Lactose Free",
        price: 130, // 50 (Oats amortized) + 80 (Milk)
        calories: 1400, // 1L Milk + 200g Oats
        protein: 60,
        ibsNote: "Fiber heavy. Good for mornings.",
        mealIdea: "Overnight oats with honey",
      },
      {
        id: "belila_milk",
        name: "Harvest Belila + Milkman",
        price: 101, // 21 (Can) + 80 (Milk)
        calories: 900, 
        protein: 40,
        ibsNote: "Warm comfort food.",
        mealIdea: "Warm belila soup",
      },
      {
        id: "eggs_foul",
        name: "30 Eggs + 2 Foul Cans",
        price: 239, // 189 (Eggs) + 50 (Foul)
        calories: 2600,
        protein: 210,
        ibsNote: "Rinse foul well. Eggs are gold standard.",
        mealIdea: "Omelette breakfast + Foul dinner",
      },
    ],
  },
  {
    id: "produce",
    title: "Counter-Top Vitamin C",
    items: [
      {
        id: "citrus_mix",
        name: "Tangerines + Bananas",
        price: 75,
        calories: 600,
        protein: 8,
        ibsNote: "Safe. Vitamin C helps Iron absorption.",
      },
      {
        id: "digest_mix",
        name: "Cucumber + Bananas + Zucchini",
        price: 90,
        calories: 500,
        protein: 10,
        ibsNote: "Hydrating and gentle.",
      },
    ],
  },
  {
    id: "gut",
    title: "Gut Health & Snacks",
    items: [
      {
        id: "rayeb",
        name: "3x Rayeb Milk",
        price: 90,
        calories: 510,
        protein: 27,
        ibsNote: "Essential for digestion.",
      },
      {
        id: "yogurt",
        name: "4x Lactose Free Yogurt",
        price: 80, // Est for lactose free
        calories: 400,
        protein: 20,
        ibsNote: "Light snack.",
      },
    ],
  },
];