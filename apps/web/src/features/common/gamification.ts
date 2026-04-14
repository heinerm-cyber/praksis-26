type TrainingPlanLike = {
  createdAt: string;
  weekPlan?: Array<{
    exercises: string[];
  }>;
};

type DietPlanLike = {
  createdAt: string;
};

type CalorieSessionLike = {
  createdAt: string;
};

type GamificationEvent = {
  createdAt: string;
  points: number;
};

export type PersonalLeaderboardEntry = {
  weekKey: string;
  label: string;
  points: number;
};

export type GamificationSnapshot = {
  totalPoints: number;
  level: number;
  levelSize: number;
  pointsIntoLevel: number;
  pointsToNextLevel: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  currentWeekPoints: number;
  leaderboard: PersonalLeaderboardEntry[];
  totals: {
    trainingPlans: number;
    dietPlans: number;
    calorieSessions: number;
    activeTrainingDays: number;
  };
};

export function calculateGamification(input: {
  trainingPlans: TrainingPlanLike[];
  dietPlans: DietPlanLike[];
  calorieSessions: CalorieSessionLike[];
  now?: Date;
}): GamificationSnapshot {
  const events: GamificationEvent[] = [];
  const activityDays = new Set<string>();

  let activeTrainingDays = 0;

  input.trainingPlans.forEach((plan) => {
    if (!isValidDate(plan.createdAt)) {
      return;
    }

    const dayCount = plan.weekPlan?.filter((day) => day.exercises.length > 0).length ?? 0;
    activeTrainingDays += dayCount;
    events.push({
      createdAt: plan.createdAt,
      points: 120 + Math.min(dayCount, 7) * 20
    });
    activityDays.add(toUtcDayKey(new Date(plan.createdAt)));
  });

  input.dietPlans.forEach((plan) => {
    if (!isValidDate(plan.createdAt)) {
      return;
    }
    events.push({ createdAt: plan.createdAt, points: 80 });
    activityDays.add(toUtcDayKey(new Date(plan.createdAt)));
  });

  input.calorieSessions.forEach((session) => {
    if (!isValidDate(session.createdAt)) {
      return;
    }
    events.push({ createdAt: session.createdAt, points: 40 });
    activityDays.add(toUtcDayKey(new Date(session.createdAt)));
  });

  const totalPoints = events.reduce((sum, event) => sum + event.points, 0);
  const levelSize = 250;
  const level = Math.floor(totalPoints / levelSize) + 1;
  const pointsIntoLevel = totalPoints % levelSize;
  const pointsToNextLevel = levelSize - pointsIntoLevel;
  const progressPercent = Math.round((pointsIntoLevel / levelSize) * 100);

  const leaderboardMap = new Map<string, number>();
  events.forEach((event) => {
    const date = new Date(event.createdAt);
    const { week, year } = getIsoWeekParts(date);
    const weekKey = `${year}-W${String(week).padStart(2, "0")}`;
    leaderboardMap.set(weekKey, (leaderboardMap.get(weekKey) ?? 0) + event.points);
  });

  const leaderboard = [...leaderboardMap.entries()]
    .map(([weekKey, points]) => {
      const [yearPart, weekPart] = weekKey.split("-W");
      return {
        weekKey,
        label: `Uke ${weekPart}, ${yearPart}`,
        points
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.weekKey.localeCompare(a.weekKey);
    })
    .slice(0, 5);

  const now = input.now ?? new Date();
  const currentWeek = getIsoWeekParts(now);
  const currentWeekKey = `${currentWeek.year}-W${String(currentWeek.week).padStart(2, "0")}`;
  const currentWeekPoints = leaderboardMap.get(currentWeekKey) ?? 0;

  return {
    totalPoints,
    level,
    levelSize,
    pointsIntoLevel,
    pointsToNextLevel,
    progressPercent,
    currentStreak: calculateCurrentStreak(activityDays, now),
    longestStreak: calculateLongestStreak(activityDays),
    currentWeekPoints,
    leaderboard,
    totals: {
      trainingPlans: input.trainingPlans.length,
      dietPlans: input.dietPlans.length,
      calorieSessions: input.calorieSessions.length,
      activeTrainingDays
    }
  };
}

function isValidDate(raw: string): boolean {
  return !Number.isNaN(new Date(raw).getTime());
}

function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function calculateCurrentStreak(days: Set<string>, now: Date): number {
  if (days.size === 0) {
    return 0;
  }

  const today = toUtcDayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = toUtcDayKey(yesterdayDate);

  let offset = 0;
  if (!days.has(today) && days.has(yesterday)) {
    offset = 1;
  } else if (!days.has(today)) {
    return 0;
  }

  let streak = 0;
  for (let i = offset; ; i += 1) {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - i);
    if (days.has(toUtcDayKey(date))) {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
}

function calculateLongestStreak(days: Set<string>): number {
  if (days.size === 0) {
    return 0;
  }

  const sorted = [...days].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const previousDate = new Date(`${sorted[i - 1]}T00:00:00.000Z`);
    const currentDate = new Date(`${sorted[i]}T00:00:00.000Z`);
    const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);

    if (diffDays === 1) {
      current += 1;
      if (current > longest) {
        longest = current;
      }
    } else {
      current = 1;
    }
  }

  return longest;
}

function getIsoWeekParts(date: Date): { week: number; year: number } {
  const temp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const year = temp.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return { week, year };
}
