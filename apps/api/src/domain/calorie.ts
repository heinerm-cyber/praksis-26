import type { CalorieInput, CalorieResult } from "./models.js";

const activityFactor: Record<CalorieInput["activityLevel"], number> = {
  low: 28,
  medium: 31,
  high: 34
};

export function calculateDailyCalories(input: CalorieInput): CalorieResult {
  const maintenanceCalories = input.currentWeightKg * activityFactor[input.activityLevel];
  const totalChangeKg = input.targetWeightKg - input.currentWeightKg;
  const monthlyChangeKg = totalChangeKg / input.monthsToGoal;
  const dailyDeltaCalories = (monthlyChangeKg * 7700) / 30;
  const dailyCalories = Math.round(maintenanceCalories + dailyDeltaCalories);

  const notes: string[] = [];
  if (Math.abs(monthlyChangeKg) > 2.5) {
    notes.push("Målet er aggressivt. Vurder lengre tidsrom for trygg progresjon.");
  }
  if (dailyCalories < 1500) {
    notes.push("Beregnet inntak er lavt. Vurder faglig veiledning.");
  }

  return {
    dailyCalories,
    monthlyChangeKg,
    notes
  };
}

export function suggestDiet(dailyCalories: number): { dietName: string; meals: string[] } {
  if (dailyCalories < 1900) {
    return {
      dietName: "Lett underskudd",
      meals: [
        "Frokost: Havregryn med cottage cheese og bær",
        "Lunsj: Kyllingsalat med quinoa",
        "Middag: Laks med brokkoli og søtpotet"
      ]
    };
  }

  if (dailyCalories < 2600) {
    return {
      dietName: "Balansert prestasjon",
      meals: [
        "Frokost: Omelett med grovbrød",
        "Lunsj: Wrap med kalkun og avocado",
        "Middag: Biff med ris og grønne grønnsaker"
      ]
    };
  }

  return {
    dietName: "Masse og restitusjon",
    meals: [
      "Frokost: Havregryn med banan og peanøttsmør",
      "Lunsj: Fullkornspasta med kylling",
      "Middag: Torsk med poteter og erter"
    ]
  };
}

export function suggestTrainingByCalories(dailyCalories: number): string[] {
  if (dailyCalories < 1900) {
    return ["Styrke helkropp x3", "Rolig kondisjon x2", "Mobilitet x2"];
  }

  if (dailyCalories < 2600) {
    return ["Overkropp/underkropp split x4", "Intervall x1", "Mobilitet x1"];
  }

  return ["Push/Pull/Legs x6", "Zone 2 kondisjon x1"];
}
