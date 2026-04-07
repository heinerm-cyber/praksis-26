import { describe, expect, it } from "vitest";
import { calculateDailyCalories, suggestDiet, suggestTrainingByCalories } from "./calorie.js";

describe("calorie domain", () => {
  it("calculates daily calories based on weight change and months", () => {
    const result = calculateDailyCalories({
      currentWeightKg: 90,
      targetWeightKg: 84,
      monthsToGoal: 6,
      activityLevel: "medium"
    });

    expect(result.dailyCalories).toBeGreaterThan(1500);
    expect(result.monthlyChangeKg).toBeCloseTo(-1, 5);
  });

  it("returns safety note when monthly change is aggressive", () => {
    const result = calculateDailyCalories({
      currentWeightKg: 70,
      targetWeightKg: 55,
      monthsToGoal: 4,
      activityLevel: "low"
    });

    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("returns diet suggestion for low and high calories", () => {
    const low = suggestDiet(1700);
    const high = suggestDiet(2800);

    expect(low.dietName).toBe("Lett underskudd");
    expect(high.dietName).toBe("Masse og restitusjon");
  });

  it("returns training suggestions by calorie level", () => {
    expect(suggestTrainingByCalories(1800)[0]).toContain("Styrke");
    expect(suggestTrainingByCalories(2700)[0]).toContain("Push/Pull/Legs");
  });
});
